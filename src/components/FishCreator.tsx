import { FormEvent, useMemo, useState } from "react";
import { renderFishTemplate } from "../assets/fishTemplates";
import { addFish } from "../services/fishApi";
import { generateFishFromDescription } from "../services/fishGenerator";
import type { Fish, FishColors, GeneratedFishSvg } from "../types";
import { createId } from "../utils/id";
import { DescriptionFishGenerator } from "./DescriptionFishGenerator";
import { FishColorCustomizer } from "./FishColorCustomizer";
import { FishPreview } from "./FishPreview";
import { FishTemplatePicker } from "./FishTemplatePicker";

type FishCreatorProps = {
  creatorName: string;
  roomId: string;
};

const initialColors: FishColors = {
  bodyColor: "#ff8fab",
  finColor: "#ffd166",
  tailColor: "#06d6a0",
  patternColor: "#ffffff",
};

export function FishCreator({ creatorName, roomId }: FishCreatorProps) {
  const [mode, setMode] = useState<"template" | "description">("template");
  const [templateId, setTemplateId] = useState("classic");
  const [colors, setColors] = useState<FishColors>(initialColors);
  const [fishName, setFishName] = useState("");
  const [description, setDescription] = useState("a rainbow fish with tiny wings");
  const [generatedFish, setGeneratedFish] = useState<GeneratedFishSvg>(() => generateFishFromDescription(description));
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const templateSvg = useMemo(() => renderFishTemplate(templateId, colors), [colors, templateId]);

  async function submitFish(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmedName = fishName.trim();
    if (!trimmedName) {
      setMessage("Please name your fish before releasing it.");
      return;
    }

    const fish: Fish = {
      id: createId("fish"),
      roomId,
      creatorName,
      fishName: trimmedName,
      creationMode: mode,
      templateId: mode === "template" ? templateId : undefined,
      description: mode === "description" ? description : undefined,
      svgMarkup: mode === "description" ? generatedFish.svgMarkup : templateSvg,
      bodyColor: mode === "template" ? colors.bodyColor : generatedFish.bodyColor,
      finColor: mode === "template" ? colors.finColor : generatedFish.finColor,
      tailColor: mode === "template" ? colors.tailColor : generatedFish.tailColor,
      patternColor: mode === "template" ? colors.patternColor : generatedFish.patternColor,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    setMessage("");
    try {
      const result = await addFish(fish);
      setFishName("");
      setMessage(result.source === "api" ? "Your fish joined the aquarium!" : "Demo mode: fish saved locally in this browser.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGenerate(nextDescription: string) {
    setDescription(nextDescription);
    setGeneratedFish(generateFishFromDescription(nextDescription));
    setMessage("Fish generated. Release it when you are ready.");
  }

  return (
    <section className="student-card fish-creator">
      <div className="student-header">
        <div>
          <span className="eyebrow">Room {roomId}</span>
          <h1>Create your fish, {creatorName}</h1>
        </div>
      </div>
      <div className="tab-list" role="tablist" aria-label="Fish creation modes">
        <button className={mode === "template" ? "active" : ""} onClick={() => setMode("template")} type="button">
          Color a Fish
        </button>
        <button className={mode === "description" ? "active" : ""} onClick={() => setMode("description")} type="button">
          Describe a Fish
        </button>
      </div>

      {mode === "template" ? (
        <form className="creator-panel" onSubmit={submitFish}>
          <label>
            Fish name
            <input
              maxLength={40}
              onChange={(event) => setFishName(event.target.value)}
              placeholder="e.g. Professor Bubbles"
              value={fishName}
            />
          </label>
          <FishTemplatePicker selectedTemplateId={templateId} onChange={setTemplateId} />
          <FishColorCustomizer colors={colors} onChange={setColors} />
          <FishPreview svgMarkup={templateSvg} />
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Releasing..." : "Release Fish into Aquarium"}
          </button>
        </form>
      ) : (
        <div className="creator-panel">
          <DescriptionFishGenerator
            description={description}
            fishName={fishName}
            onFishNameChange={setFishName}
            onGenerate={handleGenerate}
          />
          <button disabled={isSubmitting} onClick={() => void submitFish()} type="button">
            {isSubmitting ? "Releasing..." : "Release Fish into Aquarium"}
          </button>
        </div>
      )}

      {message ? <p className="status-message">{message}</p> : null}
    </section>
  );
}
