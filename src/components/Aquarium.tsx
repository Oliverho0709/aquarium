import { AquariumDecor } from "../assets/aquariumAssets";
import { useAquariumSimulation } from "../hooks/useAquariumSimulation";
import type { Fish } from "../types";
import { BubbleLayer } from "./BubbleLayer";
import { FoodPellet } from "./FoodPellet";
import { SwimmingFish } from "./SwimmingFish";

type AquariumProps = {
  fishes: Fish[];
};

export function Aquarium({ fishes }: AquariumProps) {
  const { fishStates, foods, eatCount } = useAquariumSimulation(fishes);
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
        fishes.map((fish) => (
          <SwimmingFish fish={fish} key={fish.id} state={fishStates[fish.id]} />
        ))
      )}
      {foods.map((food) => (
        <FoodPellet key={food.id} x={food.x} y={food.y} />
      ))}
      {eatCount > 0 ? (
        <div className="feed-counter" aria-live="polite">
          <span aria-hidden="true">🍤</span> Fed: {eatCount}
        </div>
      ) : null}
    </section>
  );
}
