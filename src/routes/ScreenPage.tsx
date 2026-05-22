import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Aquarium } from "../components/Aquarium";
import { ClassGoalProgress } from "../components/ClassGoalProgress";
import { FishCount } from "../components/FishCount";
import { JoinQRCode } from "../components/JoinQRCode";
import { SoundToggle } from "../components/SoundToggle";
import { UnlockCreature } from "../components/UnlockCreature";
import { clearFishes, listFishes } from "../services/fishApi";
import { playFishAddedSound } from "../services/soundEffects";
import type { Fish } from "../types";
import { getRoomIdFromUrl } from "../utils/room";

export function ScreenPage() {
  const roomId = useMemo(() => getRoomIdFromUrl(), []);
  const [fishes, setFishes] = useState<Fish[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [dataSource, setDataSource] = useState<"api" | "local">("api");
  const [message, setMessage] = useState("");
  const previousCount = useRef(0);
  const joinUrl = `${window.location.origin}/student?roomId=${encodeURIComponent(roomId)}`;

  const refreshFishes = useCallback(async () => {
    const result = await listFishes(roomId);
    setDataSource(result.source);
    setFishes(result.fishes);
    if (soundEnabled && result.fishes.length > previousCount.current) {
      playFishAddedSound();
    }
    previousCount.current = result.fishes.length;
  }, [roomId, soundEnabled]);

  useEffect(() => {
    void refreshFishes();
    const intervalId = window.setInterval(() => void refreshFishes(), 2000);
    const localListener = () => void refreshFishes();
    window.addEventListener("aquarium-local-fishes-changed", localListener);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("aquarium-local-fishes-changed", localListener);
    };
  }, [refreshFishes]);

  async function handleReset() {
    const result = await clearFishes(roomId);
    previousCount.current = 0;
    setMessage(result.source === "api" ? "Tank reset for the next round." : "Demo mode: local tank reset.");
    await refreshFishes();
  }

  async function handleSharkFinished() {
    const result = await clearFishes(roomId);
    previousCount.current = 0;
    setMessage(
      result.source === "api"
        ? "The shark cleared the tank! Goal reset for the next round."
        : "Demo mode: the shark cleared the local tank.",
    );
    await refreshFishes();
  }

  return (
    <main className="screen-page">
      <header className="screen-header">
        <div>
          <span className="eyebrow">Room {roomId}</span>
          <h1>USYD Class Aquarium</h1>
          <p>Create a fish from your device and watch it join the aquarium.</p>
        </div>
        <div className="screen-controls">
          <FishCount count={fishes.length} />
          <ClassGoalProgress fishCount={fishes.length} />
          <SoundToggle enabled={soundEnabled} onEnable={() => setSoundEnabled(true)} />
          <button className="reset-button" onClick={() => void handleReset()} type="button">
            Reset tank
          </button>
        </div>
      </header>
      <div className="screen-content">
        <Aquarium fishes={fishes} onSharkFinished={() => void handleSharkFinished()} />
        <JoinQRCode joinUrl={joinUrl} />
      </div>
      <UnlockCreature />
      <footer className="screen-footer">
        {dataSource === "local" ? "Backend unavailable: running in local demo fallback mode." : "Live shared aquarium API connected."}
        {message ? <span>{message}</span> : null}
      </footer>
    </main>
  );
}
