import { useMemo, useState } from "react";
import { FishCreator } from "../components/FishCreator";
import { NameEntry } from "../components/NameEntry";
import { USERNAME_STORAGE_KEY } from "../constants";
import { getRoomIdFromUrl } from "../utils/room";

export function StudentPage() {
  const roomId = useMemo(() => getRoomIdFromUrl(), []);
  const [creatorName, setCreatorName] = useState(() => localStorage.getItem(USERNAME_STORAGE_KEY) ?? "");

  function saveName(name: string) {
    localStorage.setItem(USERNAME_STORAGE_KEY, name);
    setCreatorName(name);
  }

  function changeName() {
    localStorage.removeItem(USERNAME_STORAGE_KEY);
    setCreatorName("");
  }

  if (!creatorName) {
    return <NameEntry onSave={saveName} />;
  }

  return (
    <main className="student-shell">
      <button className="change-name-button" onClick={changeName} type="button">
        Change name
      </button>
      <FishCreator creatorName={creatorName} roomId={roomId} />
    </main>
  );
}
