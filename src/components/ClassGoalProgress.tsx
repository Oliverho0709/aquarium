import { CLASS_GOAL } from "../constants";

type ClassGoalProgressProps = {
  fishCount: number;
};

export function ClassGoalProgress({ fishCount }: ClassGoalProgressProps) {
  const reached = fishCount >= CLASS_GOAL;
  const pct = Math.min(100, Math.round((fishCount / CLASS_GOAL) * 100));
  return (
    <div className={`class-goal${reached ? " class-goal--reached" : ""}`}>
      <div className="class-goal-label">
        <span>Class goal</span>
        <strong>
          {Math.min(fishCount, CLASS_GOAL)} / {CLASS_GOAL} fish
        </strong>
      </div>
      <div className="class-goal-bar" aria-hidden="true">
        <div className="class-goal-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      {reached ? <div className="class-goal-hint">🦈 Shark incoming!</div> : null}
    </div>
  );
}
