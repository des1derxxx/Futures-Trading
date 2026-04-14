"use client";

import { useState } from "react";
import { Trade } from "@/lib/api";
import { useGetProfileQuery } from "@/lib/apiSlice";
import dynamic from "next/dynamic";

const AnalyticsSection = dynamic(
  () => import("@/components/AnalyticsSection").then((m) => m.AnalyticsSection),
  { ssr: false }
);

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-zinc-500 uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-xl font-bold font-mono ${color ?? "text-white"}`}>
        {value}
      </span>
      {sub && <span className="text-xs text-zinc-500">{sub}</span>}
    </div>
  );
}

function CloseReasonBadge({ reason }: { reason: Trade["close_reason"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    manual: { label: "Ручное", cls: "bg-zinc-700 text-zinc-300" },
    take_profit: { label: "Take Profit", cls: "bg-green-900 text-green-300" },
    stop_loss: { label: "Stop Loss", cls: "bg-orange-900 text-orange-300" },
    liquidation: { label: "Ликвидация", cls: "bg-red-900 text-red-300" },
  };
  if (!reason) return <span className="text-xs text-zinc-500">—</span>;
  const { label, cls } = map[reason] ?? {
    label: reason,
    cls: "bg-zinc-700 text-zinc-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
  );
}

export default function ProfilePage() {
  const { data, isLoading } = useGetProfileQuery();
  const [filter, setFilter] = useState<"all" | "open" | "closed" | "liquidated">("all");
  const [sortField, setSortField] = useState<"opened_at" | "pnl" | "margin">("opened_at");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!data) return null;

  const { user, stats, trades } = data;

  const filteredTrades = trades
    .filter((t) => {
      if (filter === "all") return true;
      if (filter === "open") return t.status === "open";
      if (filter === "closed") return t.status === "closed";
      if (filter === "liquidated") return t.status === "liquidated";
      return true;
    })
    .sort((a, b) => {
      let av: number, bv: number;
      if (sortField === "pnl") {
        av = a.pnl ?? 0;
        bv = b.pnl ?? 0;
      } else if (sortField === "margin") {
        av = a.margin;
        bv = b.margin;
      } else {
        av = new Date(a.opened_at).getTime();
        bv = new Date(b.opened_at).getTime();
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  const totalEquity = user.balance + user.reserved_balance;
  const pnlColor = stats.total_pnl >= 0 ? "text-green-400" : "text-red-400";

  return (
    <div className="flex-1 text-white">
      <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-zinc-500">Общий баланс</p>
            <p className="text-2xl font-bold font-mono">${fmt(totalEquity)}</p>
            <p className="text-xs text-zinc-500">
              Доступно: <span className="text-white">${fmt(user.balance)}</span>
              {" · "}В позициях:{" "}
              <span className="text-yellow-400">
                ${fmt(user.reserved_balance)}
              </span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="col-span-2">
            <StatCard
              label="Общий PnL"
              value={`${stats.total_pnl >= 0 ? "+" : ""}$${fmt(stats.total_pnl)}`}
              color={pnlColor}
              sub={`Средний: ${stats.avg_pnl >= 0 ? "+" : ""}$${fmt(stats.avg_pnl)} / сделка`}
            />
          </div>
          <div className="col-span-2">
            <StatCard
              label="Win Rate"
              value={`${stats.win_rate}%`}
              color={stats.win_rate >= 50 ? "text-green-400" : "text-red-400"}
              sub={`${stats.winners} побед / ${stats.losers} убытков`}
            />
          </div>
          <StatCard
            label="Всего сделок"
            value={String(stats.total_trades)}
            sub={`Открытых: ${stats.open_trades}`}
          />
          <StatCard
            label="Ликвидации"
            value={String(stats.liquidations)}
            color={stats.liquidations > 0 ? "text-red-400" : "text-white"}
          />
          <StatCard
            label="Лучшая сделка"
            value={stats.best_trade_pnl !== null ? `+$${fmt(stats.best_trade_pnl)}` : "—"}
            color="text-green-400"
          />
          <StatCard
            label="Худшая сделка"
            value={stats.worst_trade_pnl !== null ? `$${fmt(stats.worst_trade_pnl)}` : "—"}
            color="text-red-400"
          />
          <StatCard
            label="Макс. серия побед"
            value={String(stats.max_win_streak)}
            sub="подряд"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Объём торгов"
            value={`$${stats.total_volume >= 1000 ? (stats.total_volume / 1000).toFixed(1) + "K" : fmt(stats.total_volume, 0)}`}
            sub="суммарный размер позиций"
          />
          <StatCard label="Среднее плечо" value={`${stats.avg_leverage}x`} />
          <StatCard
            label="Long / Short"
            value={`${stats.long_count} / ${stats.short_count}`}
            sub={
              stats.total_trades > 0
                ? `${Math.round((stats.long_count / stats.total_trades) * 100)}% long`
                : "—"
            }
          />
          <StatCard
            label="Закрытых сделок"
            value={String(stats.closed_trades)}
            sub={`из ${stats.total_trades} всего`}
          />
        </div>

        <AnalyticsSection trades={trades} />

        <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">История позиций</h2>
            <div className="flex gap-1">
              {(["all", "open", "closed", "liquidated"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                  }`}
                >
                  {{ all: "Все", open: "Открытые", closed: "Закрытые", liquidated: "Ликвидированные" }[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-auto">
            {filteredTrades.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-10">Нет сделок</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 sticky top-0 bg-[#0d1420]">
                    <th className="text-left px-4 py-3">Символ</th>
                    <th className="text-left px-4 py-3">Направление</th>
                    <th
                      className="text-right px-4 py-3 cursor-pointer hover:text-zinc-300"
                      onClick={() => toggleSort("margin")}
                    >
                      Маржа{SortIcon({ field: "margin" })}
                    </th>
                    <th className="text-right px-4 py-3">Плечо</th>
                    <th className="text-right px-4 py-3">Размер</th>
                    <th className="text-right px-4 py-3">Цена входа</th>
                    <th className="text-right px-4 py-3">Цена закрытия</th>
                    <th
                      className="text-right px-4 py-3 cursor-pointer hover:text-zinc-300"
                      onClick={() => toggleSort("pnl")}
                    >
                      PnL{SortIcon({ field: "pnl" })}
                    </th>
                    <th className="text-left px-4 py-3">Статус</th>
                    <th className="text-left px-4 py-3">Причина</th>
                    <th
                      className="text-right px-4 py-3 cursor-pointer hover:text-zinc-300"
                      onClick={() => toggleSort("opened_at")}
                    >
                      Открыта{SortIcon({ field: "opened_at" })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTrades.map((trade) => {
                    const roe =
                      trade.pnl !== null ? (trade.pnl / trade.margin) * 100 : null;
                    return (
                      <tr
                        key={trade.id}
                        className="border-b border-zinc-800/40 hover:bg-zinc-900/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-white font-medium">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            trade.direction === "long"
                              ? "bg-green-900/50 text-green-400"
                              : "bg-red-900/50 text-red-400"
                          }`}>
                            {trade.direction === "long" ? "Long ↑" : "Short ↓"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">${fmt(trade.margin)}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{trade.leverage}x</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-400">${fmt(trade.position_size, 0)}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">${fmt(trade.entry_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-400">
                          {trade.close_price ? `$${fmt(trade.close_price)}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {trade.pnl !== null ? (
                            <span className={trade.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                              {trade.pnl >= 0 ? "+" : ""}${fmt(trade.pnl)}
                              <span className="text-zinc-500 ml-1">
                                ({roe! >= 0 ? "+" : ""}{roe!.toFixed(1)}%)
                              </span>
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            trade.status === "open"
                              ? "bg-blue-900/50 text-blue-400"
                              : trade.status === "liquidated"
                                ? "bg-red-900/50 text-red-400"
                                : "bg-zinc-800 text-zinc-400"
                          }`}>
                            {trade.status === "open" ? "Открыта" : trade.status === "liquidated" ? "Ликвидирована" : "Закрыта"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <CloseReasonBadge reason={trade.close_reason} />
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-500">
                          {new Date(trade.opened_at).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
