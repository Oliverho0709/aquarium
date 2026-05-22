import { renderFishTemplate } from "../assets/fishTemplates";
import type { Fish } from "../types";
import { hashString } from "../utils/id";
import { namespaceSvgIds } from "../utils/svg";
import { FishLabel } from "./FishLabel";

type SwimmingFishProps = {
  fish: Fish;
};

export function SwimmingFish({ fish }: SwimmingFishProps) {
  const seed = hashString(fish.id);
  const top = 18 + (seed % 58);
  const duration = 18 + (seed % 22);
  const delay = -((seed % 13) + 1);
  const scale = 0.82 + (seed % 42) / 100;
  const direction = seed % 2 === 0 ? "normal" : "reverse";
  const rawSvg =
    fish.svgMarkup ??
    renderFishTemplate(fish.templateId ?? "classic", {
      bodyColor: fish.bodyColor ?? "#ff8fab",
      finColor: fish.finColor ?? "#ffd166",
      tailColor: fish.tailColor ?? "#06d6a0",
      patternColor: fish.patternColor ?? "#ffffff",
    });
  const svgMarkup = namespaceSvgIds(rawSvg, `f${fish.id}`);

  return (
    <div
      className="swimming-fish"
      style={{
        top: `${top}%`,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        animationDirection: direction,
        transform: `scale(${scale})`,
      }}
    >
      <div className="swimming-fish-art" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
      <FishLabel creatorName={fish.creatorName} fishName={fish.fishName} />
    </div>
  );
}
