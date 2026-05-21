// HTTP trigger: POST /api/generate-fish
//
// Body: { description: string }
// Returns: { svgMarkup, bodyColor, finColor, tailColor, patternColor, summary, source: "ai" }
//
// Calls Azure AI Foundry chat completions via the Azure AI Inference REST API.
// Required env vars:
//   AZURE_AI_FOUNDRY_ENDPOINT - e.g. https://aquarium-resource.services.ai.azure.com/api/projects/aquarium
//                               (only the resource host is used; project path is stripped)
//   AZURE_AI_FOUNDRY_KEY      - API key from Azure AI Foundry
// Optional:
//   AZURE_AI_FOUNDRY_MODEL    - model deployment name (default: gpt-4o-mini)
//   AZURE_AI_FOUNDRY_API_VERSION - default: 2024-05-01-preview

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_MODEL = process.env.AZURE_AI_FOUNDRY_MODEL || "gpt-4o-mini";
const API_VERSION = process.env.AZURE_AI_FOUNDRY_API_VERSION || "2024-05-01-preview";

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

function resolveInferenceEndpoint(raw) {
  if (!raw) return null;
  // Accept either a project endpoint (.../api/projects/<name>) or the resource root.
  // Inference REST API lives at: https://<resource>.services.ai.azure.com/models/chat/completions
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}/models/chat/completions?api-version=${API_VERSION}`;
  } catch {
    return null;
  }
}

function extractJson(text) {
  if (!text) return null;
  const trimmed = text.trim();
  // Some models still wrap in ```json fences; strip them.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const body = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // Last-ditch: find the first {...} block.
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
  const endpoint = resolveInferenceEndpoint(process.env.AZURE_AI_FOUNDRY_ENDPOINT);
  const key = process.env.AZURE_AI_FOUNDRY_KEY;

  // Lightweight GET health-check.
  if (req.method.toUpperCase() === "GET") {
    context.res = {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: {
        configured: Boolean(endpoint && key),
        endpoint: endpoint,
        model: DEFAULT_MODEL,
        apiVersion: API_VERSION,
      },
    };
    return;
  }

  if (!endpoint || !key) {
    context.res = {
      status: 503,
      headers: { "Content-Type": "application/json" },
      body: { error: "AI generator not configured.", configured: false },
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

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": key,
      },
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
        body: { error: "AI service returned an error.", status: response.status, detail: errBody.slice(0, 500) },
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
      body: { ...coerced, source: "ai", model: DEFAULT_MODEL },
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
