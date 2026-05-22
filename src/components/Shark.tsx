import type { SharkSimState } from "../hooks/useAquariumSimulation";

type SharkProps = {
  state: SharkSimState;
};

// Stylised shark, viewBox 320x140, facing RIGHT by default.
const SHARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 140">
  <defs>
    <linearGradient id="sharkBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a738a"/>
      <stop offset="55%" stop-color="#374b5e"/>
      <stop offset="100%" stop-color="#1f2c3a"/>
    </linearGradient>
    <linearGradient id="sharkBelly" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#e8edf2"/>
      <stop offset="100%" stop-color="#aebac6"/>
    </linearGradient>
  </defs>
  <!-- tail -->
  <polygon points="20,30 60,72 20,118 70,80 70,68" fill="url(#sharkBody)"/>
  <!-- body -->
  <path d="M60,72 C100,30 200,30 270,60 C290,68 300,76 295,84 C285,100 200,118 100,108 C80,106 65,98 60,86 Z" fill="url(#sharkBody)"/>
  <!-- belly -->
  <path d="M90,98 C150,118 230,114 280,92 C260,108 200,120 130,114 C110,112 96,106 90,98 Z" fill="url(#sharkBelly)"/>
  <!-- dorsal fin -->
  <polygon points="150,42 180,18 200,52" fill="url(#sharkBody)"/>
  <!-- pectoral fin -->
  <polygon points="140,92 195,104 175,118" fill="#2a3a4c"/>
  <!-- mouth (open, with teeth) -->
  <path d="M250,76 L295,72 L292,86 L255,90 Z" fill="#1a1a1a"/>
  <polygon points="252,76 258,86 264,76" fill="#fff"/>
  <polygon points="266,76 272,86 278,76" fill="#fff"/>
  <polygon points="280,76 286,86 292,76" fill="#fff"/>
  <polygon points="255,90 261,82 267,90" fill="#fff"/>
  <polygon points="270,90 276,82 282,90" fill="#fff"/>
  <!-- eye -->
  <circle cx="245" cy="66" r="5" fill="#fff"/>
  <circle cx="246" cy="66" r="2.6" fill="#0a0a0a"/>
  <!-- gills -->
  <path d="M215,76 q-4,8 0,14 M225,76 q-4,8 0,14 M235,76 q-4,8 0,14" stroke="#1f2c3a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
</svg>
`;

export function Shark({ state }: SharkProps) {
  return (
    <div
      className={`shark shark--${state.mode}`}
      style={{ left: `${state.x}%`, top: `${state.y}%` }}
      aria-hidden="true"
    >
      <div
        className="shark-art"
        style={{ transform: `scaleX(${state.facing})` }}
        dangerouslySetInnerHTML={{ __html: SHARK_SVG }}
      />
    </div>
  );
}
