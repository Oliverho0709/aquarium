import { AquariumDecor } from "../assets/aquariumAssets";
import type { Fish } from "../types";
import { BubbleLayer } from "./BubbleLayer";
import { SwimmingFish } from "./SwimmingFish";

type AquariumProps = {
  fishes: Fish[];
};

export function Aquarium({ fishes }: AquariumProps) {
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
        fishes.map((fish) => <SwimmingFish fish={fish} key={fish.id} />)
      )}
    </section>
  );
}
