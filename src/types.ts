export type FishCreationMode = "template" | "description";

export type Fish = {
  id: string;
  roomId: string;
  creatorName: string;
  fishName: string;
  creationMode: FishCreationMode;
  templateId?: string;
  description?: string;
  svgMarkup?: string;
  bodyColor?: string;
  finColor?: string;
  tailColor?: string;
  patternColor?: string;
  size?: number; // Growth state: 0.2 = 20% size, up to 2.0 = 200%
  createdAt: string;
};

export type FishTemplate = {
  id: string;
  name: string;
  description: string;
};

export type FishColors = {
  bodyColor: string;
  finColor: string;
  tailColor: string;
  patternColor: string;
};

export type GeneratedFishSvg = {
  svgMarkup: string;
  bodyColor: string;
  finColor: string;
  tailColor: string;
  patternColor: string;
};
