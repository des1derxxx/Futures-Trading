"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TradingViewChart from "@/components/tradingViewChart";
import TradingPanel from "@/components/TradingPanel";
import PositionsList from "@/components/PositionsList";
import WalletBalance from "@/components/WalletBalance";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { useTrades } from "@/hooks/useTrades";
import { api } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const { price } = useBinancePrice("BTCUSDT");
  console.log(price);
  const { openTrades, closedTrades, balance, reservedBalance, refresh } =
    useTrades(userId);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
      return;
    }

    api
      .me()
      .then((user) => {
        setUserId(user.id);
        setAuthReady(true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.replace("/auth");
      });
  }, [router]);

  const handleTradeChange = (newBalance: number, newReserved: number) => {
    refresh();
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#080d14] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d14] text-white">
      {/* Main layout */}
      <div className="flex gap-4 p-4" style={{ height: "calc(100vh - 57px)" }}>
        {/* Left: Chart */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden min-h-0">
            <TradingViewChart ticket="BTCUSDT" />
          </div>
          <PositionsList
            openTrades={openTrades}
            closedTrades={closedTrades}
            currentPrice={price}
            onClose={handleTradeChange}
          />
        </div>

        {/* Right: Panel */}
        <div className="w-72 flex flex-col gap-4 flex-shrink-0">
          <WalletBalance balance={balance} reservedBalance={reservedBalance} />
          <TradingPanel
            currentPrice={price}
            balance={balance}
            onTradeOpened={handleTradeChange}
          />
        </div>
      </div>
    </div>
  );
}
