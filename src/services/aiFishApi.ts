import type { GeneratedFishSvg } from "../types";

export type AiProvider = "foundry" | "github";

export type AiFishResult = GeneratedFishSvg & {
  summary?: string;
  source: "ai";
  provider: AiProvider;
  model?: string;
};

export type AiFishError = {
  source: "error";
  status: number;
  message: string;
  provider?: AiProvider;
};

export type AiProviderInfo = {
  configured: boolean;
  endpoint: string | null;
  endpointRaw?: string | null;
  model: string;
  authMode: string;
};

export type AiProvidersStatus = {
  defaultProvider: AiProvider | null;
  providers: Record<AiProvider, AiProviderInfo>;
};

export async function generateFishWithAi(
  description: string,
  provider?: AiProvider,
): Promise<AiFishResult | AiFishError> {
  try {
    const response = await fetch("/api/generate-fish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, provider }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        source: "error",
        status: response.status,
        message: (payload && (payload.error as string)) || `Request failed (${response.status})`,
        provider: (payload && (payload.provider as AiProvider)) || provider,
      };
    }
    return payload as AiFishResult;
  } catch (err) {
    return {
      source: "error",
      status: 0,
      message: err instanceof Error ? err.message : "Network error",
      provider,
    };
  }
}

export async function fetchAiProvidersStatus(): Promise<AiProvidersStatus | null> {
  try {
    const response = await fetch("/api/generate-fish");
    if (!response.ok) return null;
    return (await response.json()) as AiProvidersStatus;
  } catch {
    return null;
  }
}
