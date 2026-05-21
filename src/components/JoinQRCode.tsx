import { hashString } from "../utils/id";

type JoinQRCodeProps = {
  joinUrl: string;
};

export function JoinQRCode({ joinUrl }: JoinQRCodeProps) {
  const seed = hashString(joinUrl);
  const cells = Array.from({ length: 81 }, (_, index) => (seed + index * 17 + index * index) % 5 !== 0);

  return (
    <aside className="join-card">
      <div className="qr-art" aria-hidden="true">
        {cells.map((filled, index) => (
          <span className={filled ? "qr-cell filled" : "qr-cell"} key={index} />
        ))}
      </div>
      <div>
        <span className="eyebrow">Join from your device</span>
        <strong>{joinUrl}</strong>
      </div>
    </aside>
  );
}
