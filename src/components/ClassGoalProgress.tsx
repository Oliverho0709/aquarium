type ClassGoalProgressProps = {
  fishCount: number;
};

export function ClassGoalProgress({ fishCount }: ClassGoalProgressProps) {
  // TODO(Stage 2): Live-code the class goal unlock progress, e.g. "Class goal: 13 / 20 fish".
  return <div className="stage-two-placeholder">Class goal placeholder: {fishCount} / 20 fish</div>;
}
