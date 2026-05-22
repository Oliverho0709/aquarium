type FoodPelletProps = {
  x: number;
  y: number;
};

export function FoodPellet({ x, y }: FoodPelletProps) {
  return (
    <div
      className="food-pellet"
      style={{ left: `${x}%`, top: `${y}%` }}
      aria-hidden="true"
    />
  );
}
