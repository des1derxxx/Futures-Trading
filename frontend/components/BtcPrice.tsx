"use client";

import { useBinancePrice } from "@/hooks/useBinancePrice";

const SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "SOLUSDT"];

function PriceTicker({ symbol, connected }: { symbol: string; connected: boolean }) {
  const { price } = useBinancePrice(symbol);
  const label = symbol.replace("USDT", "");

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-zinc-500">{label}</span>
      <span className="font-mono text-white">
        {price !== null
          ? `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: price < 10 ? 4 : 2 })}`
          : "—"}
      </span>
    </div>
  );
}

export default function PriceTickers() {
  const { connected } = useBinancePrice("BTCUSDT");

  return (
    <div className="flex items-center gap-4">
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${connected ? "bg-green-400" : "bg-zinc-500"}`} />
      {SYMBOLS.map((s) => (
        <PriceTicker key={s} symbol={s} connected={connected} />
      ))}
    </div>
  );
}
