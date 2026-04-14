"use client";

import { useState } from "react";
import TradingViewChart from "@/components/tradingViewChart";
import TradingPanel from "@/components/TradingPanel";
import PositionsList from "@/components/PositionsList";
import WalletBalance from "@/components/WalletBalance";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { useTrades } from "@/hooks/useTrades";
import { useGetMeQuery } from "@/lib/apiSlice";

export default function Home() {
  const { data: me, isLoading } = useGetMeQuery();
  const userId = me?.id ?? null;

  const [symbol, setSymbol] = useState("BTCUSDT");

  const { price } = useBinancePrice(symbol);
  const { openTrades, closedTrades, balance, reservedBalance, refresh } = useTrades(userId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col text-white">
      <div className="flex gap-4 p-4 flex-1 min-h-0">
        {/* Left: Chart */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden min-h-0">
            <TradingViewChart ticket={symbol} />
          </div>
          <PositionsList
            openTrades={openTrades}
            closedTrades={closedTrades}
            onClose={refresh}
          />
        </div>

        {/* Right: Panel */}
        <div className="w-72 flex flex-col gap-4 flex-shrink-0">
          <WalletBalance balance={balance} reservedBalance={reservedBalance} />
          <TradingPanel
            symbol={symbol}
            onSymbolChange={setSymbol}
            currentPrice={price}
            balance={balance}
            onTradeOpened={refresh}
          />
        </div>
      </div>
    </div>
  );
}
