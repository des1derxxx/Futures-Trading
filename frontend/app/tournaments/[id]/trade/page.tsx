"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import TradingViewChart from "@/components/tradingViewChart";
import TradingPanel from "@/components/TradingPanel";
import PositionsList from "@/components/PositionsList";
import WalletBalance from "@/components/WalletBalance";
import { useBinancePrice } from "@/hooks/useBinancePrice";
import { useTournamentTrades } from "@/hooks/useTrades";
import { useGetMeQuery, useGetTournamentQuery } from "@/lib/apiSlice";

export default function TournamentTradePage() {
  const params = useParams<{ id: string }>();
  const tournamentId = Number(params.id);

  const { data: me, isLoading: meLoading } = useGetMeQuery();
  const { data: tournament, isLoading: tournamentLoading } = useGetTournamentQuery(tournamentId);
  const userId = me?.id ?? null;

  const { price } = useBinancePrice("BTCUSDT");
  const { openTrades, closedTrades, balance, reservedBalance, refresh } =
    useTournamentTrades(userId, tournamentId);

  if (meLoading || tournamentLoading || !tournament) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  const t = tournament.tournament;

  return (
    <div className="flex-1 flex flex-col text-white">
      {/* Tournament bar */}
      <div className="border-b border-zinc-800/60 px-6 py-2 flex items-center gap-4 bg-[#0a1018]">
        <Link
          href={`/tournaments/${tournamentId}`}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Назад
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 bg-green-900/30 border border-green-800/40 px-2 py-0.5 rounded-full">
            Турнир
          </span>
          <span className="text-sm font-semibold text-white">{t.name}</span>
        </div>
        <div className="ml-auto flex items-center gap-6 text-xs text-zinc-500">
          <span>
            Баланс:{" "}
            <span className="text-white font-mono font-semibold">
              ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
          <span>
            В позициях:{" "}
            <span className="text-yellow-400 font-mono">
              ${reservedBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
          <span>
            Всего:{" "}
            <span className="text-white font-mono">
              ${(balance + reservedBalance).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
          <span>
            Старт:{" "}
            <span className="text-zinc-300 font-mono">
              ${t.starting_balance.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </span>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex gap-4 p-4 flex-1 min-h-0">
        {/* Left: Chart + Positions */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          <div className="flex-1 bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden min-h-0">
            <TradingViewChart ticket="BTCUSDT" />
          </div>
          <PositionsList
            openTrades={openTrades}
            closedTrades={closedTrades}
            currentPrice={price}
            onClose={refresh}
          />
        </div>

        {/* Right: Panel */}
        <div className="w-72 flex flex-col gap-4 flex-shrink-0">
          <WalletBalance balance={balance} reservedBalance={reservedBalance} />
          <TradingPanel
            currentPrice={price}
            balance={balance}
            onTradeOpened={refresh}
            tournamentId={tournamentId}
          />
        </div>
      </div>
    </div>
  );
}
