// HTTP trigger: POST /api/generate-fish
//
// Body:   { description: string, provider?: "foundry" | "github" }
// Returns: { svgMarkup, bodyColor, finColor, tailColor, patternColor, summary,
//            source: "ai", provider, model }
//
// Two providers supported:
//
//  1) "foundry" — Azure AI Foundry, OpenAI-compatible /openai/v1/chat/completions
//     Env vars:
//       AZURE_AI_FOUNDRY_ENDPOINT (required)  resource root, project endpoint,
//                                             /openai/v1, or full chat URL
//       AZURE_AI_FOUNDRY_KEY      (optional)  if set, used as api-key + Bearer
//                                             else DefaultAzureCredential is used
//       AZURE_AI_FOUNDRY_MODEL    (optional)  default: DeepSeek-V4-Pro
//
//  2) "github" — GitHub Models inference API
//     Env vars:
//       GITHUB_MODELS_TOKEN       (required)  PAT with models:read scope
//       GITHUB_MODELS_MODEL       (optional)  default: openai/gpt-5-mini
//       GITHUB_MODELS_ENDPOINT    (optional)  default: https://models.github.ai/inference/chat/completions

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const AAD_SCOPE = "https://ai.azure.com/.default";

const SYSTEM_PROMPT = `You are a creative SVG fish designer for a classroom aquarium demo.
Given a short description, return STRICT JSON (no prose, no markdown) with this exact shape:
{
  "bodyColor":    "#rrggbb",
  "finColor":     "#rrggbb",
  "tailColor":    "#rrggbb",
  "patternColor": "#rrggbb",
  "svgMarkup":    "<svg ...>...</svg>",
  "summary":      "one short sentence"
}

Rules for svgMarkup:
- Root element must be <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">.
- Total markup MUST be under 1800 characters.
- Use only basic shapes: path, circle, ellipse, rect, polygon, line, g.
- No <script>, no <foreignObject>, no external references, no <image>, no <style> blocks.
- Fish faces RIGHT. Keep the design playful and bold so it reads on a projector.
- Use the four colors above prominently.
- Do NOT include xml prolog or DOCTYPE.`;

// ---------- Foundry endpoint normalization ----------

function buildFoundryUrl(raw) {
  if (!raw) return null;
  const base = raw.trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(base)) return base;
  if (/\/openai\/v1$/i.test(base)) return `${base}/chat/completions`;
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}/openai/v1/chat/completions`;
  } catch {
    return null;
  }
}

// ---------- AAD token cache (Foundry only) ----------

let cachedCredential = null;
let cachedToken = null;

async function getFoundryBearerToken() {
  if (cachedToken && cachedToken.expiresOnTimestamp - 60_000 > Date.now()) {
    return cachedToken.token;
  }
  if (!cachedCredential) {
    const { DefaultAzureCredential } = require("@azure/identity");
    cachedCredential = new DefaultAzureCredential();
  }
  const tokenResponse = await cachedCredential.getToken(AAD_SCOPE);
  if (!tokenResponse || !tokenResponse.token) {
    throw new Error("Failed to acquire AAD token for Azure AI Foundry.");
  }
  cachedToken = tokenResponse;
  return tokenResponse.token;
}

// ---------- Provider registry ----------

function describeProviders() {
  const foundryEndpoint = buildFoundryUrl(process.env.AZURE_AI_FOUNDRY_ENDPOINT);
  const foundryKey = process.env.AZURE_AI_FOUNDRY_KEY;
  const githubEndpoint = (process.env.GITHUB_MODELS_ENDPOINT || "https://models.github.ai/inference/chat/completions").trim();
  const githubToken = process.env.GITHUB_MODELS_TOKEN;
  return {
    foundry: {
      configured: Boolean(foundryEndpoint),
      endpoint: foundryEndpoint,
      endpointRaw: process.env.AZURE_AI_FOUNDRY_ENDPOINT || null,
      model: process.env.AZURE_AI_FOUNDRY_MODEL || "DeepSeek-V4-Pro",
      authMode: foundryKey ? "api-key" : "aad",
    },
    github: {
      configured: Boolean(githubToken),
      endpoint: githubEndpoint,
      model: process.env.GITHUB_MODELS_MODEL || "openai/gpt-5-mini",
      authMode: "pat",
    },
  };
}

async function buildFoundryRequest() {
  const endpoint = buildFoundryUrl(process.env.AZURE_AI_FOUNDRY_ENDPOINT);
  if (!endpoint) {
    throw httpError(503, "Foundry not configured: AZURE_AI_FOUNDRY_ENDPOINT not set.");
  }
  const key = process.env.AZURE_AI_FOUNDRY_KEY;
  const headers = { "Content-Type": "application/json" };
  if (key) {
    headers["api-key"] = key;
    headers["Authorization"] = `Bearer ${key}`;
  } else {
    const token = await getFoundryBearerToken();
    headers["Authorization"] = `Bearer ${token}`;
  }
  return {
    url: endpoint,
    headers,
    model: process.env.AZURE_AI_FOUNDRY_MODEL || "DeepSeek-V4-Pro",
  };
}

function buildGithubRequest() {
  const token = process.env.GITHUB_MODELS_TOKEN;
  if (!token) {
    throw httpError(503, "GitHub Models not configured: GITHUB_MODELS_TOKEN not set.");
  }
  const url = (process.env.GITHUB_MODELS_ENDPOINT || "https://models.github.ai/inference/chat/completions").trim();
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    model: process.env.GITHUB_MODELS_MODEL || "openai/gpt-5-mini",
  };
}

async function buildProviderRequest(providerId) {
  switch (providerId) {
    case "foundry":
      return await buildFoundryRequest();
    case "github":
      return buildGithubRequest();
    default:
      throw httpError(400, `Unknown provider "${providerId}". Use "foundry" or "github".`);
  }
}

function httpError(status, message, extra) {
  const err = new Error(message);
  err.httpStatus = status;
  if (extra) err.extra = extra;
  return err;
}

// ---------- Response parsing ----------

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    const start = body.indexOf("{");
    const end = body.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(body.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function validateAndCoerce(parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  const required = ["bodyColor", "finColor", "tailColor", "patternColor", "svgMarkup"];
  for (const key of required) {
    if (typeof parsed[key] !== "string") return null;
  }
  for (const key of ["bodyColor", "finColor", "tailColor", "patternColor"]) {
    if (!HEX_RE.test(parsed[key])) return null;
  }
  const svg = parsed.svgMarkup.trim();
  if (!svg.startsWith("<svg")) return null;
  if (!/viewBox\s*=\s*"0\s+0\s+240\s+120"/.test(svg)) return null;
  if (svg.length > 4000) return null;
  if (/<script|<foreignObject|<image|onload=|onclick=/i.test(svg)) return null;
  return {
    bodyColor: parsed.bodyColor,
    finColor: parsed.finColor,
    tailColor: parsed.tailColor,
    patternColor: parsed.patternColor,
    svgMarkup: svg,
    summary: typeof parsed.summary === "string" ? parsed.summary.slice(0, 240) : "",
  };
}

// ---------- HTTP handler ----------

module.exports = async function generateFish(context, req) {
  const providers = describeProviders();

  if (req.method.toUpperCase() === "GET") {
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { providers, defaultProvider: providers.foundry.configured ? "foundry" : providers.github.configured ? "github" : null },
    };
    return;
  }

  const description = (req.body && typeof req.body.description === "string" ? req.body.description : "").trim();
  if (!description) {
    context.res = { status: 400, body: { error: "description is required." } };
    return;
  }
  if (description.length > 400) {
    context.res = { status: 400, body: { error: "description too long (max 400 chars)." } };
    return;
  }

  const providerId =
    (typeof req.body?.provider === "string" && req.body.provider.toLowerCase()) ||
    (providers.foundry.configured ? "foundry" : "github");

  let request;
  try {
    request = await buildProviderRequest(providerId);
  } catch (err) {
    context.log.error(`[generate-fish] Provider setup failed (${providerId}):`, err);
    context.res = {
      status: err.httpStatus || 500,
      headers: { "Content-Type": "application/json" },
      body: { error: err.message, provider: providerId },
    };
    return;
  }

  try {
    const response = await fetch(request.url, {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({
        model: request.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Design a fish: ${description}` },
        ],
        temperature: 0.9,
        max_tokens: 900,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      context.log.error(`[generate-fish] ${providerId} error`, response.status, errBody);
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "AI service returned an error.",
          provider: providerId,
          status: response.status,
          endpoint: request.url,
          model: request.model,
          detail: errBody.slice(0, 500),
        },
      };
      return;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = extractJson(content);
    const coerced = validateAndCoerce(parsed);

    if (!coerced) {
      context.log.warn(`[generate-fish] ${providerId} returned invalid JSON/SVG`, content?.slice?.(0, 500));
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "AI returned invalid fish JSON.",
          provider: providerId,
          model: request.model,
          rawPreview: typeof content === "string" ? content.slice(0, 400) : null,
        },
      };
      return;
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { ...coerced, source: "ai", provider: providerId, model: request.model },
    };
  } catch (err) {
    context.log.error("[generate-fish] Unhandled error:", err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: { error: "Internal server error.", detail: String(err?.message || err) },
    };
  }
};
