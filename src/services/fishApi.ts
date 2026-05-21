import type { Fish } from "../types";

const storageKey = (roomId: string) => `usyd-aquarium-fishes:${roomId}`;

function readLocalFishes(roomId: string): Fish[] {
  const raw = localStorage.getItem(storageKey(roomId));
  if (!raw) {
    return [];
  }
  const parsed = JSON.parse(raw) as Fish[];
  return Array.isArray(parsed) ? parsed : [];
}

function writeLocalFishes(roomId: string, fishes: Fish[]) {
  localStorage.setItem(storageKey(roomId), JSON.stringify(fishes));
}

export async function listFishes(roomId: string): Promise<{ fishes: Fish[]; source: "api" | "local" }> {
  try {
    const response = await fetch(`/api/fishes?roomId=${encodeURIComponent(roomId)}`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const payload = (await response.json()) as { fishes: Fish[] };
    return { fishes: payload.fishes, source: "api" };
  } catch {
    return { fishes: readLocalFishes(roomId), source: "local" };
  }
}

export async function addFish(fish: Fish): Promise<{ source: "api" | "local" }> {
  try {
    const response = await fetch("/api/fishes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fish),
    });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    return { source: "api" };
  } catch {
    const fishes = readLocalFishes(fish.roomId);
    writeLocalFishes(fish.roomId, [...fishes, fish]);
    window.dispatchEvent(new Event("aquarium-local-fishes-changed"));
    return { source: "local" };
  }
}

export async function clearFishes(roomId: string): Promise<{ source: "api" | "local" }> {
  try {
    const response = await fetch(`/api/fishes?roomId=${encodeURIComponent(roomId)}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    writeLocalFishes(roomId, []);
    return { source: "api" };
  } catch {
    writeLocalFishes(roomId, []);
    window.dispatchEvent(new Event("aquarium-local-fishes-changed"));
    return { source: "local" };
  }
}
