import type { FishColors } from "../types";

type FishColorCustomizerProps = {
  colors: FishColors;
  onChange: (colors: FishColors) => void;
};

const colorFields: Array<{ key: keyof FishColors; label: string }> = [
  { key: "bodyColor", label: "Body" },
  { key: "finColor", label: "Fins" },
  { key: "tailColor", label: "Tail" },
  { key: "patternColor", label: "Pattern" },
];

export function FishColorCustomizer({ colors, onChange }: FishColorCustomizerProps) {
  return (
    <div className="color-grid">
      {colorFields.map((field) => (
        <label className="color-field" key={field.key}>
          {field.label}
          <input
            onChange={(event) => onChange({ ...colors, [field.key]: event.target.value })}
            type="color"
            value={colors[field.key]}
          />
        </label>
      ))}
    </div>
  );
}
