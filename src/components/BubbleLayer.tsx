const bubbles = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  left: `${(index * 37) % 100}%`,
  size: `${10 + ((index * 11) % 30)}px`,
  delay: `${-((index * 0.7) % 8)}s`,
  duration: `${7 + (index % 7)}s`,
}));

export function BubbleLayer() {
  return (
    <div className="bubble-layer" aria-hidden="true">
      {bubbles.map((bubble) => (
        <span
          className="bubble"
          key={bubble.id}
          style={{
            left: bubble.left,
            width: bubble.size,
            height: bubble.size,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        />
      ))}
    </div>
  );
}
