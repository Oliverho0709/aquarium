import { useMemo, useState } from "react";
import { generateFishFromDescription } from "../services/fishGenerator";
import { generateFishWithAi } from "../services/aiFishApi";
import type { GeneratedFishSvg } from "../types";
import { FishPreview } from "./FishPreview";

type DescriptionFishGeneratorProps = {
  fishName: string;
  onFishNameChange: (value: string) => void;
  onGenerate: (description: string, fish: GeneratedFishSvg) => void;
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

export function DescriptionFishGenerator({
  fishName,
  onFishNameChange,
  onGenerate,
  description,
}: DescriptionFishGeneratorProps) {
  const [draftDescription, setDraftDescription] = useState(description || samples[0]);
  const proceduralFish = useMemo(
    () => generateFishFromDescription(draftDescription),
    [draftDescription],
  );
  const [aiFish, setAiFish] = useState<GeneratedFishSvg | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const previewFish = aiFish ?? proceduralFish;
  const previewSource: "ai" | "procedural" = aiFish ? "ai" : "procedural";

  function applyDescription(next: string) {
    setDraftDescription(next);
    // New description invalidates any previous AI result.
    setAiFish(null);
    setAiSummary("");
    setStatusMessage("");
  }

  async function handleAiGenerate() {
    setIsGenerating(true);
    setStatusMessage("Asking Azure AI Foundry to design your fish…");
    const result = await generateFishWithAi(draftDescription);
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
      setStatusMessage("AI-generated fish ready. Release it when you're happy.");
      onGenerate(draftDescription, fish);
    } else {
      setAiFish(null);
      setAiSummary("");
      setStatusMessage(
        result.status === 503
          ? "AI not configured on the server. Using the built-in generator instead."
          : `AI generation failed (${result.message}). Using the built-in generator instead.`,
      );
      onGenerate(draftDescription, proceduralFish);
    }
  }

  function handleProceduralGenerate() {
    setAiFish(null);
    setAiSummary("");
    setStatusMessage("Built-in generator used.");
    onGenerate(draftDescription, proceduralFish);
  }

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
      <p className="status-message" aria-live="polite">
        Preview: <strong>{previewSource === "ai" ? "AI generated" : "Built-in"}</strong>
        {aiSummary ? ` — ${aiSummary}` : ""}
        {statusMessage ? ` · ${statusMessage}` : ""}
      </p>
      <div className="generator-actions">
        <button onClick={handleAiGenerate} type="button" disabled={isGenerating}>
          {isGenerating ? "Generating…" : "✨ Generate with AI"}
        </button>
        <button onClick={handleProceduralGenerate} type="button" disabled={isGenerating}>
          Use built-in generator
        </button>
      </div>
    </div>
  );
}
