import { useEffect, useState } from "react";
import { AquariumDecor } from "../assets/aquariumAssets";
import { CLASS_GOAL } from "../constants";
import { useAquariumSimulation } from "../hooks/useAquariumSimulation";
import type { Fish } from "../types";
import { BubbleLayer } from "./BubbleLayer";
import { FoodPellet } from "./FoodPellet";
import { Shark } from "./Shark";
import { SwimmingFish } from "./SwimmingFish";

type AquariumProps = {
  fishes: Fish[];
  onSharkFinished?: () => void;
};

export function Aquarium({ fishes, onSharkFinished }: AquariumProps) {
  const [sharkActive, setSharkActive] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const goalReached = fishes.length >= CLASS_GOAL;

  useEffect(() => {
    if (goalReached && !sharkActive) {
      setSharkActive(true);
      setShowBanner(true);
      const t = window.setTimeout(() => setShowBanner(false), 3500);
      return () => window.clearTimeout(t);
    }
  }, [goalReached, sharkActive]);

  const { fishStates, foods, eatCount, sharkState, sharkEatenIds } = useAquariumSimulation(
    fishes,
    {
      sharkActive,
      onSharkFinished: () => {
        setSharkActive(false);
        onSharkFinished?.();
      },
    },
  );

  return (
    <section className="aquarium" aria-label="Animated classroom aquarium">
      <div className="light-rays" aria-hidden="true" />
      <BubbleLayer />
      <AquariumDecor />
      {fishes.length === 0 ? (
        <div className="empty-tank">
          <strong>No fish yet</strong>
          <span>Students can join and release the first fish.</span>
        </div>
      ) : (
        fishes
          .filter((fish) => !sharkEatenIds.has(fish.id))
          .map((fish) => (
            <SwimmingFish fish={fish} key={fish.id} state={fishStates[fish.id]} />
          ))
      )}
      {foods.map((food) => (
        <FoodPellet key={food.id} x={food.x} y={food.y} />
      ))}
      {sharkState ? <Shark state={sharkState} /> : null}
      {eatCount > 0 ? (
        <div className="feed-counter" aria-live="polite">
          <span aria-hidden="true">🍤</span> Fed: {eatCount}
        </div>
      ) : null}
      {showBanner ? (
        <div className="shark-banner" role="alert">
          <span aria-hidden="true">🦈</span> Class goal reached — SHARK ATTACK!
        </div>
      ) : null}
    </section>
  );
}
