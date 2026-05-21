import { playFishAddedSound } from "../services/soundEffects";

type SoundToggleProps = {
  enabled: boolean;
  onEnable: () => void;
};

export function SoundToggle({ enabled, onEnable }: SoundToggleProps) {
  return (
    <button
      className={enabled ? "sound-toggle enabled" : "sound-toggle"}
      type="button"
      onClick={() => {
        playFishAddedSound();
        onEnable();
      }}
    >
      {enabled ? "Sound enabled" : "Enable Sound"}
    </button>
  );
}
