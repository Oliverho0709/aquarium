type FishCountProps = {
  count: number;
};

export function FishCount({ count }: FishCountProps) {
  return <div className="fish-count">Fish in tank: {count}</div>;
}
