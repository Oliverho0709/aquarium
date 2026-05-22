import { useEffect, useRef, useState } from "react";
import type { Fish } from "../types";
import { hashString } from "../utils/id";

export type FishSimState = { x: number; y: number; facing: 1 | -1; scale: number };
export type FoodPelletState = { id: string; x: number; y: number };

type InternalFish = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  scale: number;
  baseScale: number;
  nextWanderAt: number;
};

type InternalFood = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
};

const MAX_FOOD = 8;
const SPAWN_MIN_MS = 1600;
const SPAWN_MAX_MS = 3800;
const WANDER_SPEED = 5; // % of stage / second
const CHASE_SPEED = 18;
const EAT_DIST = 5; // % radius for collision
const PAD_X = 4;
const PAD_TOP = 8;
const PAD_BOTTOM = 14;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function useAquariumSimulation(fishes: Fish[]) {
  const [fishStates, setFishStates] = useState<Record<string, FishSimState>>({});
  const [foods, setFoods] = useState<FoodPelletState[]>([]);
  const [eatCount, setEatCount] = useState(0);

  const fishMapRef = useRef<Map<string, InternalFish>>(new Map());
  const foodsRef = useRef<InternalFood[]>([]);
  const eatCountRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const fishesRef = useRef<Fish[]>(fishes);

  // Sync fish set
  useEffect(() => {
    fishesRef.current = fishes;
    const map = fishMapRef.current;
    const live = new Set(fishes.map((f) => f.id));
    for (const id of Array.from(map.keys())) {
      if (!live.has(id)) map.delete(id);
    }
    for (const f of fishes) {
      if (map.has(f.id)) continue;
      const seed = hashString(f.id);
      const baseScale = 0.82 + (seed % 42) / 100;
      map.set(f.id, {
        x: rand(PAD_X + 6, 100 - PAD_X - 6),
        y: rand(PAD_TOP + 4, 100 - PAD_BOTTOM - 4),
        vx: rand(-WANDER_SPEED, WANDER_SPEED),
        vy: rand(-1, 1),
        tx: rand(PAD_X, 100 - PAD_X),
        ty: rand(PAD_TOP, 100 - PAD_BOTTOM),
        scale: baseScale,
        baseScale,
        nextWanderAt: 0,
      });
    }
  }, [fishes]);

  useEffect(() => {
    function tick(ts: number) {
      const last = lastTsRef.current ?? ts;
      const dt = Math.min(0.05, (ts - last) / 1000);
      lastTsRef.current = ts;

      // Spawn food
      if (ts > nextSpawnRef.current && foodsRef.current.length < MAX_FOOD) {
        const food: InternalFood = {
          id: `food-${ts.toFixed(0)}-${Math.random().toString(36).slice(2, 7)}`,
          x: rand(PAD_X + 4, 100 - PAD_X - 4),
          y: rand(2, 6),
          vx: rand(-1, 1),
          vy: rand(1.4, 2.4),
        };
        foodsRef.current = [...foodsRef.current, food];
        nextSpawnRef.current = ts + rand(SPAWN_MIN_MS, SPAWN_MAX_MS);
      }

      // Move food
      const movedFoods: InternalFood[] = [];
      for (const food of foodsRef.current) {
        const nx = food.x + food.vx * dt;
        const ny = food.y + food.vy * dt;
        let nvx = food.vx + Math.sin(ts / 500 + food.x) * dt * 1.5;
        if (nx < PAD_X || nx > 100 - PAD_X) nvx = -nvx;
        if (ny < 100 - PAD_BOTTOM) {
          movedFoods.push({
            ...food,
            x: Math.max(PAD_X, Math.min(100 - PAD_X, nx)),
            y: ny,
            vx: nvx,
          });
        }
      }

      // Assign each food to its nearest fish (so multiple fish don't all chase
      // the same pellet) and let unclaimed fish wander.
      const assignment = new Map<string, string>(); // foodId -> fishId
      const fishToFood = new Map<string, InternalFood>();
      const fishEntries = Array.from(fishMapRef.current.entries());
      for (const food of movedFoods) {
        let bestFishId: string | null = null;
        let bestDist = Infinity;
        for (const [id, s] of fishEntries) {
          if (fishToFood.has(id)) continue;
          const d = Math.hypot(food.x - s.x, food.y - s.y);
          if (d < bestDist) {
            bestDist = d;
            bestFishId = id;
          }
        }
        if (bestFishId) {
          assignment.set(food.id, bestFishId);
          fishToFood.set(bestFishId, food);
        }
      }

      const states: Record<string, FishSimState> = {};
      const eatenIds = new Set<string>();
      let consumed = 0;

      for (const [id, s] of fishEntries) {
        const target = fishToFood.get(id);
        let desiredVx: number;
        let desiredVy: number;
        if (target) {
          const dx = target.x - s.x;
          const dy = target.y - s.y;
          const d = Math.hypot(dx, dy) || 1;
          desiredVx = (dx / d) * CHASE_SPEED;
          desiredVy = (dy / d) * CHASE_SPEED;
          if (d < EAT_DIST) {
            eatenIds.add(target.id);
            consumed++;
            s.scale = s.baseScale * 1.18;
          }
        } else {
          if (ts > s.nextWanderAt || Math.hypot(s.tx - s.x, s.ty - s.y) < 4) {
            s.tx = rand(PAD_X, 100 - PAD_X);
            s.ty = rand(PAD_TOP, 100 - PAD_BOTTOM);
            s.nextWanderAt = ts + rand(3000, 6000);
          }
          const dx = s.tx - s.x;
          const dy = s.ty - s.y;
          const d = Math.hypot(dx, dy) || 1;
          desiredVx = (dx / d) * WANDER_SPEED;
          desiredVy = (dy / d) * WANDER_SPEED;
        }

        // Ease toward desired velocity
        const ease = Math.min(1, dt * 3);
        s.vx += (desiredVx - s.vx) * ease;
        s.vy += (desiredVy - s.vy) * ease;
        s.x = Math.max(PAD_X, Math.min(100 - PAD_X, s.x + s.vx * dt));
        s.y = Math.max(PAD_TOP, Math.min(100 - PAD_BOTTOM, s.y + s.vy * dt));
        // Ease scale back down (eat pulse)
        s.scale += (s.baseScale - s.scale) * Math.min(1, dt * 2.5);

        states[id] = {
          x: s.x,
          y: s.y,
          facing: s.vx >= 0 ? 1 : -1,
          scale: s.scale,
        };
      }

      foodsRef.current = movedFoods.filter((f) => !eatenIds.has(f.id));
      if (consumed > 0) {
        eatCountRef.current += consumed;
        setEatCount(eatCountRef.current);
      }
      setFoods(foodsRef.current.map((f) => ({ id: f.id, x: f.x, y: f.y })));
      setFishStates(states);

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, []);

  return { fishStates, foods, eatCount };
}
