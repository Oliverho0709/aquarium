export function playFishAddedSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  const now = audioContext.currentTime;

  [0, 0.08, 0.16].forEach((offset, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(420 + index * 130, now + offset);
    oscillator.frequency.exponentialRampToValueAtTime(720 + index * 160, now + offset + 0.12);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.08, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now + offset);
    oscillator.stop(now + offset + 0.18);
  });
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
