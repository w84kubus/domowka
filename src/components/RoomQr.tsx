"use client";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

// QR z deep linkiem do pokoju (SPEC §4, §3.9). Skan → od razu ekran nicku z wpisanym kodem.
export function RoomQr({ code, size = 160 }: { code: string; size?: number }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    setUrl(`${window.location.origin}/p/${code}`);
  }, [code]);

  if (!url) return <div style={{ width: size, height: size }} aria-hidden />;

  return (
    <div className="inline-block rounded-xl bg-white p-3" aria-label="Kod QR do pokoju">
      <QRCodeSVG value={url} size={size} bgColor="#ffffff" fgColor="#0b0a12" level="M" />
    </div>
  );
}
