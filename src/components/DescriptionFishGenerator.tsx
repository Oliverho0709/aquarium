import { useMemo, useState } from "react";
import { generateFishFromDescription } from "../services/fishGenerator";
import { FishPreview } from "./FishPreview";

type DescriptionFishGeneratorProps = {
  fishName: string;
  onFishNameChange: (value: string) => void;
  onGenerate: (description: string) => void;
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
  const generated = useMemo(() => generateFishFromDescription(draftDescription), [draftDescription]);

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
          onChange={(event) => setDraftDescription(event.target.value)}
          rows={4}
          value={draftDescription}
        />
      </label>
      <div className="sample-pills">
        {samples.map((sample) => (
          <button key={sample} onClick={() => setDraftDescription(sample)} type="button">
            {sample}
          </button>
        ))}
      </div>
      <FishPreview svgMarkup={generated.svgMarkup} />
      <button onClick={() => onGenerate(draftDescription)} type="button">
        Generate Fish
      </button>
    </div>
  );
}
