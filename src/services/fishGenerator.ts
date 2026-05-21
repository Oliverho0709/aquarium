import type { GeneratedFishSvg } from "../types";
import { renderFishTemplate } from "../assets/fishTemplates";

const palettes = {
  robot: ["#b8c2cc", "#36d1dc", "#6c757d", "#2f4858"],
  rainbow: ["#ff6b6b", "#ffd166", "#06d6a0", "#118ab2"],
  shark: ["#8d99ae", "#cfd8dc", "#6c757d", "#ffffff"],
  gold: ["#ffd166", "#ff9f1c", "#f77f00", "#fff3b0"],
  github: ["#24292f", "#8b949e", "#57606a", "#7ee787"],
  cloud: ["#caf0f8", "#ffffff", "#90e0ef", "#48cae4"],
  fire: ["#ef233c", "#ffb703", "#fb5607", "#ffd166"],
  ice: ["#90e0ef", "#caf0f8", "#48cae4", "#ffffff"],
  dragon: ["#d00000", "#ffba08", "#6a040f", "#f48c06"],
  default: ["#7b2ff7", "#00c2ff", "#ff70a6", "#f8f9fa"],
} as const;

function paletteFor(description: string) {
  const lower = description.toLowerCase();
  const match = Object.keys(palettes).find((keyword) => lower.includes(keyword)) as keyof typeof palettes | undefined;
  return palettes[match ?? "default"];
}

export function generateFishFromDescription(description: string): GeneratedFishSvg {
  const lower = description.toLowerCase();
  const [bodyColor, finColor, tailColor, patternColor] = paletteFor(description);
  const baseTemplate = lower.includes("shark") || lower.includes("robot") ? "speedy" : lower.includes("cloud") ? "puffer" : "classic";
  const base = renderFishTemplate(baseTemplate, { bodyColor, finColor, tailColor, patternColor });
  const decorations = [
    lower.includes("rainbow") ? `<path d="M53 28c28 13 65 13 95 0" stroke="#ff006e" stroke-width="7" fill="none"/><path d="M48 43c34 14 76 14 112 0" stroke="#ffbe0b" stroke-width="7" fill="none"/><path d="M47 58c34 13 77 13 113 0" stroke="#3a86ff" stroke-width="7" fill="none"/>` : "",
    lower.includes("robot") ? `<path d="M74 34h26v18H74zM106 58h28v16h-28z" fill="none" stroke="#073b4c" stroke-width="3"/><circle cx="84" cy="43" r="3" fill="#7ee787"/><circle cx="119" cy="66" r="3" fill="#7ee787"/>` : "",
    lower.includes("dragon") ? `<path d="M73 21 83 4l10 20 11-18 8 25" fill="${finColor}" stroke="#073b4c" stroke-width="3" stroke-linejoin="round"/>` : "",
    lower.includes("sleepy") ? `<path d="M135 45q8 8 16 0" stroke="#073b4c" stroke-width="4" fill="none" stroke-linecap="round"/>` : "",
    lower.includes("happy") ? `<path d="M144 61q12 13 27 0" stroke="#073b4c" stroke-width="4" fill="none" stroke-linecap="round"/>` : "",
    lower.includes("cloud") ? `<circle cx="73" cy="36" r="12" fill="rgba(255,255,255,.55)"/><circle cx="89" cy="31" r="16" fill="rgba(255,255,255,.55)"/><circle cx="106" cy="39" r="12" fill="rgba(255,255,255,.55)"/>` : "",
  ].join("");

  const svgMarkup = base.replace("</svg>", `${decorations}</svg>`);

  // TODO(Stage 2+): Replace or augment this procedural generator with an Azure OpenAI image service.
  return { svgMarkup, bodyColor, finColor, tailColor, patternColor };
}
