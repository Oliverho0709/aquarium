import { renderFishTemplate } from "../assets/fishTemplates";
import type { Fish } from "../types";
import type { FishSimState } from "../hooks/useAquariumSimulation";
import { namespaceSvgIds } from "../utils/svg";
import { FishLabel } from "./FishLabel";

type SwimmingFishProps = {
  fish: Fish;
  state?: FishSimState;
};

export function SwimmingFish({ fish, state }: SwimmingFishProps) {
  const rawSvg =
    fish.svgMarkup ??
    renderFishTemplate(fish.templateId ?? "classic", {
      bodyColor: fish.bodyColor ?? "#ff8fab",
      finColor: fish.finColor ?? "#ffd166",
      tailColor: fish.tailColor ?? "#06d6a0",
      patternColor: fish.patternColor ?? "#ffffff",
    });
  const svgMarkup = namespaceSvgIds(rawSvg, `f${fish.id}`);

  if (!state) {
    return null;
  }

  return (
    <div
      className="swimming-fish swimming-fish--sim"
      style={{
        left: `${state.x}%`,
        top: `${state.y}%`,
      }}
    >
      <div
        className="swimming-fish-art"
        style={{ transform: `scaleX(${state.facing}) scale(${state.scale})` }}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <FishLabel creatorName={fish.creatorName} fishName={fish.fishName} />
    </div>
  );
}
