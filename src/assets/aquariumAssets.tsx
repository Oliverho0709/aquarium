export function AquariumDecor() {
  return (
    <div className="aquarium-decor" aria-hidden="true">
      <svg className="decor decor-seaweed decor-left" viewBox="0 0 120 220">
        <path d="M28 220C8 158 56 122 29 58 19 34 31 13 52 1" />
        <path d="M62 220c-34-55 28-84 2-140-17-37 10-61 39-75" />
        <path d="M83 220c-12-42 25-78 3-123" />
      </svg>
      <svg className="decor decor-coral" viewBox="0 0 180 150">
        <path d="M74 145V72M74 101C36 91 42 52 62 48M77 82c37-2 48-39 30-62M94 145v-52M94 112c32 3 51-20 43-51" />
      </svg>
      <svg className="decor decor-rocks" viewBox="0 0 260 90">
        <ellipse cx="60" cy="63" rx="58" ry="25" />
        <ellipse cx="132" cy="57" rx="72" ry="30" />
        <ellipse cx="205" cy="65" rx="50" ry="23" />
      </svg>
      <svg className="decor decor-seaweed decor-right" viewBox="0 0 120 220">
        <path d="M28 220C8 158 56 122 29 58 19 34 31 13 52 1" />
        <path d="M62 220c-34-55 28-84 2-140-17-37 10-61 39-75" />
        <path d="M83 220c-12-42 25-78 3-123" />
      </svg>
    </div>
  );
}
