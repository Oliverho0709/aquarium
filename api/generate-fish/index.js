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

Fish anatomy & layout (viewBox is 240 wide x 120 tall, fish faces RIGHT):
- BODY: centered around x=110, y=60. Body length ~140 (x≈40 to x≈180). The body shape is up to you — it can be an ellipse, rounded rectangle, triangle/wedge, hexagon, blob, teardrop, diamond, or any creative silhouette. Be bold and varied.
- TAIL (caudal fin): attached on the LEFT side of the body, roughly x=20-55, y=35-85. Fan, forked, ribbon, flame, or geometric shapes all welcome.
- TOP FIN (dorsal): on top of the body, roughly x=80-150, y=15-55.
- BOTTOM/SIDE FIN (pectoral): below or on the front of the body, roughly x=110-160, y=65-100.
- EYE: on the front (right) third of the body, roughly x=150-175, y=45-65. Always include an eye (white sclera + dark pupil, or a stylized equivalent). A tiny highlight dot is encouraged.
- MOUTH: at the front tip of the body, roughly x=175-195, y=55-70. Can be a smile, a tiny circle, or a beak — match the personality.
- PATTERN: stripes, spots, scales, runes, glowing nodes — use the patternColor on top of the body.

Style freedom:
- You MAY (and should!) use linear or radial GRADIENTS for richer color. Define them in <defs> with <linearGradient> / <radialGradient> / <stop> and reference via fill="url(#id)". Use stop-color and stop-opacity (no CSS style attributes needed, but inline style="stop-color:#xxx" is OK).
- You MAY use opacity, fill-opacity, stroke, stroke-width, stroke-linecap, stroke-linejoin.
- Use the four declared colors (bodyColor / finColor / tailColor / patternColor) as the dominant palette, but gradient stops may blend toward lighter/darker shades of them.

Hard rules for svgMarkup:
- Root element must be <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 120">.
- Total markup MUST be under 3500 characters.
- Allowed elements only: svg, defs, g, path, circle, ellipse, rect, polygon, polyline, line, linearGradient, radialGradient, stop, title, desc.
- FORBIDDEN: <script>, <foreignObject>, <image>, <use> with external href, <style> blocks, event handlers (onload, onclick, etc.), external URLs.
- Keep design bold and readable on a projector — strong silhouette, clear eye, no thin spidery details.
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
      endpoint: buildGithubUrl(process.env.GITHUB_MODELS_ENDPOINT),
      endpointRaw: process.env.GITHUB_MODELS_ENDPOINT || null,
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
    bodyExtras: {
      temperature: 0.95,
      max_tokens: 1600,
    },
  };
}

function buildGithubUrl(raw) {
  const base = (raw || "https://models.github.ai/inference/chat/completions").trim().replace(/\/+$/, "");
  if (/\/chat\/completions$/i.test(base)) return base;
  // Allow ".../inference" or root host — append the path.
  return `${base}/chat/completions`;
}

function buildGithubRequest() {
  const token = process.env.GITHUB_MODELS_TOKEN;
  if (!token) {
    throw httpError(503, "GitHub Models not configured: GITHUB_MODELS_TOKEN not set.");
  }
  const url = buildGithubUrl(process.env.GITHUB_MODELS_ENDPOINT);
  return {
    url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "Accept": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    model: process.env.GITHUB_MODELS_MODEL || "openai/gpt-5-mini",
    // GPT-5 family rejects max_tokens and only supports the default temperature.
    // Reasoning models spend tokens on internal reasoning before emitting output;
    // give them a large budget and tell them not to over-think this.
    bodyExtras: {
      max_completion_tokens: 6000,
      reasoning_effort: "minimal",
    },
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
  if (/<script|<foreignObject|<image|<iframe|on\w+\s*=|href\s*=\s*"https?:|xlink:href\s*=\s*"https?:|javascript:/i.test(svg)) return null;
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
    const envKeys = Object.keys(process.env);
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        providers,
        defaultProvider: providers.foundry.configured ? "foundry" : providers.github.configured ? "github" : null,
        envPresence: {
          AZURE_AI_FOUNDRY_ENDPOINT: Boolean(process.env.AZURE_AI_FOUNDRY_ENDPOINT),
          AZURE_AI_FOUNDRY_KEY: Boolean(process.env.AZURE_AI_FOUNDRY_KEY),
          AZURE_AI_FOUNDRY_MODEL: Boolean(process.env.AZURE_AI_FOUNDRY_MODEL),
          GITHUB_MODELS_TOKEN: Boolean(process.env.GITHUB_MODELS_TOKEN),
          GITHUB_MODELS_MODEL: Boolean(process.env.GITHUB_MODELS_MODEL),
          GITHUB_MODELS_ENDPOINT: Boolean(process.env.GITHUB_MODELS_ENDPOINT),
        },
        // Names of env vars that look related (no values exposed).
        relatedEnvKeys: envKeys.filter((k) => /^(GITHUB|AZURE_AI|GH_|MODELS_)/.test(k)),
      },
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
        response_format: { type: "json_object" },
        ...(request.bodyExtras || {}),
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
    const choice = data?.choices?.[0];
    const content = choice?.message?.content;
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
          finishReason: choice?.finish_reason || null,
          usage: data?.usage || null,
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
