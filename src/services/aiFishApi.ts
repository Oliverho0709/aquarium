import type { GeneratedFishSvg } from "../types";

export type AiFishResult = GeneratedFishSvg & {
  summary?: string;
  source: "ai";
  model?: string;
};

export type AiFishError = {
  source: "error";
  status: number;
  message: string;
};

export async function generateFishWithAi(description: string): Promise<AiFishResult | AiFishError> {
  try {
    const response = await fetch("/api/generate-fish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        source: "error",
        status: response.status,
        message: (payload && (payload.error as string)) || `Request failed (${response.status})`,
      };
    }
    return payload as AiFishResult;
  } catch (err) {
    return {
      source: "error",
      status: 0,
      message: err instanceof Error ? err.message : "Network error",
    };
  }
}
