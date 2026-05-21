import { FormEvent, useState } from "react";

type NameEntryProps = {
  onSave: (name: string) => void;
};

export function NameEntry({ onSave }: NameEntryProps) {
  const [name, setName] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      onSave(trimmedName);
    }
  }

  return (
    <main className="student-shell name-entry-shell">
      <form className="student-card name-entry" onSubmit={handleSubmit}>
        <span className="eyebrow">USYD Class Aquarium</span>
        <h1>What name should appear under your fish?</h1>
        <p>Your name is stored only in this browser using localStorage. No login required.</p>
        <label>
          Your name
          <input
            autoFocus
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Alex"
            value={name}
          />
        </label>
        <button type="submit" disabled={!name.trim()}>
          Start creating fish
        </button>
      </form>
    </main>
  );
}
