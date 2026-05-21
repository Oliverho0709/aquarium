// HTTP trigger: POST /api/generate-fish
//
// Body: { description: string }
// Returns: { svgMarkup, bodyColor, finColor, tailColor, patternColor, summary, source: "ai" }
//
// Calls an Azure AI Foundry chat completions deployment via the OpenAI-compatible v1
// endpoint, e.g. https://<resource>.services.ai.azure.com/openai/v1/chat/completions.
//
// Required env vars:
//   AZURE_AI_FOUNDRY_ENDPOINT - e.g. https://aquarium-resource.services.ai.azure.com/openai/v1
//                               (must be the OpenAI-compatible /openai/v1 base URL)
//
// Auth (one of):
//   AZURE_AI_FOUNDRY_KEY      - API key. If set, sent as `api-key` header.
//   (else) DefaultAzureCredential is used to fetch a Bearer token for the
//          scope `https://ai.azure.com/.default`. Requires the Function App's
//          managed identity to have the appropriate Azure AI role on the
//          AI Foundry resource (e.g. "Azure AI Developer" or "Cognitive Services User").
//
// Optional:
//   AZURE_AI_FOUNDRY_MODEL    - deployment name (default: DeepSeek-V4-Pro)

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_MODEL = process.env.AZURE_AI_FOUNDRY_MODEL || "DeepSeek-V4-Pro";
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

// Compose the chat completions URL from the configured base.
// Accepts any of:
//   - https://<resource>.services.ai.azure.com/openai/v1
//   - https://<resource>.services.ai.azure.com/openai/v1/chat/completions
//   - https://<resource>.services.ai.azure.com/api/projects/<name>      (project endpoint — auto-rewritten)
//   - https://<resource>.services.ai.azure.com                          (resource root — auto-rewritten)
function buildChatCompletionsUrl(raw) {
  if (!raw) return null;
  const base = raw.trim().replace(/\/+$/, "");
  // Already pointing at chat completions.
  if (/\/chat\/completions$/i.test(base)) return base;
  // Already pointing at the OpenAI v1 base.
  if (/\/openai\/v1$/i.test(base)) return `${base}/chat/completions`;
  // Project endpoint or resource root — normalize to /openai/v1/chat/completions.
  try {
    const u = new URL(base);
    return `${u.protocol}//${u.host}/openai/v1/chat/completions`;
  } catch {
    return null;
  }
}

// Cached AAD credential + token to avoid re-fetching on every call.
let cachedCredential = null;
let cachedToken = null; // { token, expiresOnTimestamp }

async function getBearerToken() {
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

module.exports = async function generateFish(context, req) {
  const rawEndpoint = process.env.AZURE_AI_FOUNDRY_ENDPOINT;
  const endpoint = buildChatCompletionsUrl(rawEndpoint);
  const key = process.env.AZURE_AI_FOUNDRY_KEY;
  const authMode = key ? "api-key" : "aad";

  if (req.method.toUpperCase() === "GET") {
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        configured: Boolean(endpoint),
        endpoint,
        endpointRaw: rawEndpoint || null,
        model: DEFAULT_MODEL,
        authMode,
      },
    };
    return;
  }

  if (!endpoint) {
    context.res = {
      status: 503,
      headers: { "Content-Type": "application/json" },
      body: {
        error: "AI generator not configured: AZURE_AI_FOUNDRY_ENDPOINT not set.",
        configured: false,
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

  // Build auth headers.
  const headers = { "Content-Type": "application/json" };
  try {
    if (key) {
      headers["api-key"] = key;
      headers["Authorization"] = `Bearer ${key}`;
    } else {
      const token = await getBearerToken();
      headers["Authorization"] = `Bearer ${token}`;
    }
  } catch (err) {
    context.log.error("[generate-fish] Auth failed:", err);
    context.res = {
      status: 500,
      headers: { "Content-Type": "application/json" },
      body: {
        error: "Failed to authenticate to Azure AI Foundry.",
        authMode,
        detail: String(err?.message || err),
      },
    };
    return;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: DEFAULT_MODEL,
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
      context.log.error("[generate-fish] AI Foundry error", response.status, errBody);
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "AI service returned an error.",
          status: response.status,
          authMode,
          endpoint,
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
      context.log.warn("[generate-fish] Model returned invalid JSON/SVG", content?.slice?.(0, 500));
      context.res = {
        status: 502,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "AI returned invalid fish JSON.",
          rawPreview: typeof content === "string" ? content.slice(0, 400) : null,
        },
      };
      return;
    }

    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: { ...coerced, source: "ai", model: DEFAULT_MODEL, authMode },
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
