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
    <div
      className="inline-block rounded-[14px] border-[3px] border-white bg-white p-3 shadow-[0_4px_0_rgb(0_0_0/0.35)]"
      aria-label="Kod QR do pokoju"
    >
      <QRCodeSVG value={url} size={size} bgColor="#ffffff" fgColor="#2A1758" level="M" />
    </div>
  );
}
