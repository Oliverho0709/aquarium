type FishLabelProps = {
  creatorName: string;
  fishName: string;
};

export function FishLabel({ creatorName, fishName }: FishLabelProps) {
  return (
    <div className="fish-label">
      <strong>{fishName}</strong>
      <span>{creatorName}</span>
    </div>
  );
}
