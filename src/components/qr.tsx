'use client';
import { QRCodeSVG } from 'qrcode.react';

/** High-contrast QR. Always dark-on-white with a quiet zone so phone cameras read it on any theme. */
export function QR({ value, size = 200, label }: { value: string; size?: number; label?: string }) {
  return (
    <div className="inline-block rounded-2xl bg-white p-3" role="img" aria-label={label ?? `QR code for ${value}`}>
      <QRCodeSVG value={value} size={size} level="M" marginSize={0} fgColor="#111111" bgColor="#ffffff" />
    </div>
  );
}
