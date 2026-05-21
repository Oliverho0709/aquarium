import { useEffect, useState } from "react";
import QRCode from "qrcode";

type JoinQRCodeProps = {
  joinUrl: string;
};

export function JoinQRCode({ joinUrl }: JoinQRCodeProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(joinUrl, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#0b1f3a", light: "#ffffff" },
    })
      .then((svg) => {
        if (!cancelled) setSvgMarkup(svg);
      })
      .catch((err) => {
        console.error("[QR] Failed to generate QR code:", err);
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  return (
    <aside className="join-card">
      <div
        className="qr-art"
        aria-label={`QR code linking to ${joinUrl}`}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
      <div>
        <span className="eyebrow">Join from your device</span>
        <strong>{joinUrl}</strong>
      </div>
    </aside>
  );
}
