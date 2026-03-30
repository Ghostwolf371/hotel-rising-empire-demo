"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

export function RoomTimer({ endsAt, showWarning = false }: { endsAt: number; showWarning?: boolean }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = endsAt - now;
  const nearExpiry = left > 0 && left < 15 * 60 * 1000;
  const expired = left <= 0;

  return (
    <span
      className={`font-mono text-2xl font-semibold tabular-nums tracking-tight ${
        expired
          ? "text-red-500"
          : nearExpiry && showWarning
            ? "animate-pulse text-amber-500"
            : ""
      }`}
    >
      {formatCountdown(left)}
      {nearExpiry && showWarning && (
        <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
          Expiring
        </span>
      )}
    </span>
  );
}

export function useTimeLeft(endsAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, endsAt - now);
}
