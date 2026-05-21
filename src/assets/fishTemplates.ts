import type { FishColors, FishTemplate } from "../types";

export const fishTemplates: FishTemplate[] = [
  { id: "classic", name: "Classic fish", description: "A friendly classroom fish" },
  { id: "puffer", name: "Round puffer fish", description: "A bubbly round fish" },
  { id: "speedy", name: "Long speedy fish", description: "Built for quick laps" },
  { id: "angel", name: "Angelfish", description: "Tall fins and fancy style" },
];

const escapeSvg = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function renderFishTemplate(templateId: string, colors: FishColors) {
  const { bodyColor, finColor, tailColor, patternColor } = colors;

  if (templateId === "puffer") {
    return `<svg viewBox="0 0 180 110" role="img" aria-label="Puffer fish" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="82" cy="56" rx="48" ry="38" fill="${escapeSvg(bodyColor)}" stroke="#073b4c" stroke-width="4"/>
      <path d="M31 55 8 35v42z" fill="${escapeSvg(tailColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M76 18 92 3l9 24M78 94l18 13 8-25" fill="${escapeSvg(finColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="102" cy="46" r="6" fill="#073b4c"/>
      <path d="M111 67c10 7 20 7 29 0" fill="none" stroke="#073b4c" stroke-width="4" stroke-linecap="round"/>
      <circle cx="61" cy="43" r="6" fill="${escapeSvg(patternColor)}"/><circle cx="70" cy="71" r="5" fill="${escapeSvg(patternColor)}"/><circle cx="95" cy="77" r="4" fill="${escapeSvg(patternColor)}"/>
    </svg>`;
  }

  if (templateId === "speedy") {
    return `<svg viewBox="0 0 210 100" role="img" aria-label="Long speedy fish" xmlns="http://www.w3.org/2000/svg">
      <path d="M39 52C63 18 142 18 178 52c-37 35-116 35-139 0Z" fill="${escapeSvg(bodyColor)}" stroke="#073b4c" stroke-width="4"/>
      <path d="M39 52 8 24v56z" fill="${escapeSvg(tailColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
      <path d="m96 27 30-19-8 32M99 73l31 17-10-31" fill="${escapeSvg(finColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M70 51h76" stroke="${escapeSvg(patternColor)}" stroke-width="7" stroke-linecap="round"/>
      <circle cx="157" cy="43" r="5" fill="#073b4c"/>
      <path d="M166 57c5 5 10 5 15 0" stroke="#073b4c" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  if (templateId === "angel") {
    return `<svg viewBox="0 0 180 140" role="img" aria-label="Angelfish" xmlns="http://www.w3.org/2000/svg">
      <path d="M82 22c38 16 50 48 0 94C31 70 44 38 82 22Z" fill="${escapeSvg(bodyColor)}" stroke="#073b4c" stroke-width="4"/>
      <path d="M51 65 9 30v72z" fill="${escapeSvg(tailColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M80 22 113 4 101 50M80 116l36 16-18-52" fill="${escapeSvg(finColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
      <path d="M72 42c8 16 8 33 0 51M91 43c8 16 8 34 0 52" stroke="${escapeSvg(patternColor)}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="101" cy="56" r="5" fill="#073b4c"/>
      <path d="M109 72c6 4 12 4 18 0" stroke="#073b4c" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  return `<svg viewBox="0 0 190 110" role="img" aria-label="Classic fish" xmlns="http://www.w3.org/2000/svg">
    <path d="M43 55C68 18 136 16 168 55c-32 39-100 37-125 0Z" fill="${escapeSvg(bodyColor)}" stroke="#073b4c" stroke-width="4"/>
    <path d="M43 55 10 28v54z" fill="${escapeSvg(tailColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
    <path d="M91 28 116 9l-8 37M92 82l26 18-10-37" fill="${escapeSvg(finColor)}" stroke="#073b4c" stroke-width="4" stroke-linejoin="round"/>
    <path d="M73 38c9 11 9 25 0 36M92 34c11 13 11 30 0 43" stroke="${escapeSvg(patternColor)}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="142" cy="45" r="6" fill="#073b4c"/>
    <path d="M150 62c7 6 14 6 21 0" stroke="#073b4c" stroke-width="3" fill="none" stroke-linecap="round"/>
  </svg>`;
}
