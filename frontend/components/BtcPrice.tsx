"use client";

import { useBinancePrice } from "@/hooks/useBinancePrice";

export default function BtcPrice() {
  const { price, connected } = useBinancePrice("BTCUSDT");

  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-zinc-500"}`}
      />
      <span className="text-zinc-400">BTCUSDT</span>
      <span className="font-mono text-white">
        {price !== null ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—"}
      </span>
    </div>
  );
}
