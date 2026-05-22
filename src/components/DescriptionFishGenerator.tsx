import { useEffect, useMemo, useRef, useState } from "react";
import { generateFishFromDescription } from "../services/fishGenerator";
import {
  generateFishWithAi,
  fetchAiProvidersStatus,
  type AiProvider,
  type AiProvidersStatus,
} from "../services/aiFishApi";
import type { GeneratedFishSvg } from "../types";
import { FishPreview } from "./FishPreview";

type DescriptionFishGeneratorProps = {
  fishName: string;
  onFishNameChange: (value: string) => void;
  onGenerate: (description: string, fish: GeneratedFishSvg) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
  description: string;
};

const samples = [
  "a rainbow fish with tiny wings",
  "a sleepy cloud fish made of soft blue light",
  "a cyberpunk robot fish with glowing fins",
  "a golden fish that looks very confident",
  "a dragon fish with red scales and spiky fins",
  "a tiny GitHub Copilot-inspired coding fish",
  "an ice fish with crystal fins",
  "a friendly shark pretending to be a student",
];

const providerLabels: Record<AiProvider, string> = {
  foundry: "Azure AI Foundry",
  github: "GitHub Models",
};

const generationStages = [
  "Sketching skeleton…",
  "Shaping the body…",
  "Adding fins and tail…",
  "Placing the eye…",
  "Mixing gradient colors…",
  "Painting patterns…",
  "Polishing scales…",
  "Almost ready…",
];

export function DescriptionFishGenerator({
  fishName,
  onFishNameChange,
  onGenerate,
  onGeneratingChange,
  description,
}: DescriptionFishGeneratorProps) {
  const [draftDescription, setDraftDescription] = useState(description || samples[0]);
  const proceduralFish = useMemo(
    () => generateFishFromDescription(draftDescription),
    [draftDescription],
  );
  const [aiFish, setAiFish] = useState<GeneratedFishSvg | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiInfo, setAiInfo] = useState<{ provider: AiProvider; model: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [providerStatus, setProviderStatus] = useState<AiProvidersStatus | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>("foundry");
  const [stageIndex, setStageIndex] = useState(0);
  const stageTimerRef = useRef<number | null>(null);

  useEffect(() => {
    onGeneratingChange?.(isGenerating);
  }, [isGenerating, onGeneratingChange]);

  useEffect(() => {
    if (!isGenerating) {
      if (stageTimerRef.current !== null) {
        window.clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
      return;
    }
    setStageIndex(0);
    stageTimerRef.current = window.setInterval(() => {
      setStageIndex((i) => (i + 1) % generationStages.length);
    }, 1100);
    return () => {
      if (stageTimerRef.current !== null) {
        window.clearInterval(stageTimerRef.current);
        stageTimerRef.current = null;
      }
    };
  }, [isGenerating]);

  useEffect(() => {
    let cancelled = false;
    fetchAiProvidersStatus().then((status) => {
      if (cancelled || !status) return;
      setProviderStatus(status);
      if (status.defaultProvider) setSelectedProvider(status.defaultProvider);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const previewFish = aiFish ?? proceduralFish;
  const previewSource: "ai" | "procedural" = aiFish ? "ai" : "procedural";

  function applyDescription(next: string) {
    setDraftDescription(next);
    setAiFish(null);
    setAiSummary("");
    setAiInfo(null);
    setStatusMessage("");
  }

  async function handleAiGenerate() {
    setIsGenerating(true);
    setStatusMessage(`Asking ${providerLabels[selectedProvider]} to design your fish…`);
    const result = await generateFishWithAi(draftDescription, selectedProvider);
    setIsGenerating(false);
    if (result.source === "ai") {
      const fish: GeneratedFishSvg = {
        svgMarkup: result.svgMarkup,
        bodyColor: result.bodyColor,
        finColor: result.finColor,
        tailColor: result.tailColor,
        patternColor: result.patternColor,
      };
      setAiFish(fish);
      setAiSummary(result.summary || "");
      setAiInfo({ provider: result.provider, model: result.model || "" });
      setStatusMessage("AI-generated fish ready. Release it when you're happy.");
      onGenerate(draftDescription, fish);
    } else {
      setAiFish(null);
      setAiSummary("");
      setAiInfo(null);
      setStatusMessage(
        result.status === 503
          ? `${providerLabels[selectedProvider]} not configured on the server. Using the built-in generator instead.`
          : `AI generation failed (${result.message}). Using the built-in generator instead.`,
      );
      onGenerate(draftDescription, proceduralFish);
    }
  }

  function handleProceduralGenerate() {
    setAiFish(null);
    setAiSummary("");
    setAiInfo(null);
    setStatusMessage("Built-in generator used.");
    onGenerate(draftDescription, proceduralFish);
  }

  const providerOptions: Array<{ id: AiProvider; label: string; configured: boolean; model: string }> = [
    {
      id: "foundry",
      label: providerLabels.foundry,
      configured: providerStatus?.providers.foundry.configured ?? true,
      model: providerStatus?.providers.foundry.model ?? "DeepSeek-V4-Pro",
    },
    {
      id: "github",
      label: providerLabels.github,
      configured: providerStatus?.providers.github.configured ?? true,
      model: providerStatus?.providers.github.model ?? "openai/gpt-5-mini",
    },
  ];

  return (
    <div className="creator-panel">
      <label>
        Fish name
        <input
          maxLength={40}
          onChange={(event) => onFishNameChange(event.target.value)}
          placeholder="e.g. Bubble Byte"
          value={fishName}
        />
      </label>
      <label>
        Fish description
        <textarea
          onChange={(event) => applyDescription(event.target.value)}
          rows={4}
          value={draftDescription}
        />
      </label>
      <div className="sample-pills">
        {samples.map((sample) => (
          <button key={sample} onClick={() => applyDescription(sample)} type="button">
            {sample}
          </button>
        ))}
      </div>
      <FishPreview svgMarkup={previewFish.svgMarkup} />
      {isGenerating ? (
        <div className="ai-progress" role="status" aria-live="polite">
          <div className="ai-progress-spinner" aria-hidden="true">
            <span className="ai-progress-bubble" />
            <span className="ai-progress-bubble" />
            <span className="ai-progress-bubble" />
          </div>
          <div className="ai-progress-text">
            <strong>{providerLabels[selectedProvider]} is designing your fish</strong>
            <span className="ai-progress-stage">{generationStages[stageIndex]}</span>
          </div>
        </div>
      ) : null}
      <p className="status-message" aria-live="polite">
        Preview: <strong>{previewSource === "ai" ? "AI generated" : "Built-in"}</strong>
        {aiInfo ? ` · ${providerLabels[aiInfo.provider]} (${aiInfo.model})` : ""}
        {aiSummary ? ` — ${aiSummary}` : ""}
        {statusMessage ? ` · ${statusMessage}` : ""}
      </p>

      <fieldset className="provider-picker">
        <legend>AI model</legend>
        {providerOptions.map((option) => (
          <label key={option.id} className={!option.configured ? "disabled" : ""}>
            <input
              checked={selectedProvider === option.id}
              disabled={!option.configured}
              name="ai-provider"
              onChange={() => setSelectedProvider(option.id)}
              type="radio"
              value={option.id}
            />
            <span>
              {option.label}
              <small>{option.model}{option.configured ? "" : " · not configured"}</small>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="generator-actions">
        <button onClick={handleAiGenerate} type="button" disabled={isGenerating}>
          {isGenerating ? "Generating…" : `✨ Generate with ${providerLabels[selectedProvider]}`}
        </button>
        <button onClick={handleProceduralGenerate} type="button" disabled={isGenerating}>
          Use built-in generator
        </button>
      </div>
    </div>
  );
}
