"use client";

import { Trade, api } from "@/lib/api";
import { useState } from "react";

interface PositionsListProps {
  openTrades: Trade[];
  closedTrades: Trade[];
  currentPrice: number | null;
  onClose: (balance: number, reservedBalance: number) => void;
}

function calcPnl(trade: Trade, price: number): number {
  const { direction, entry_price, position_size } = trade;
  if (direction === "long") {
    return ((price - entry_price) / entry_price) * position_size;
  }
  return ((entry_price - price) / entry_price) * position_size;
}

function fmtPrice(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CloseReasonBadge({ reason }: { reason: Trade["close_reason"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    manual:      { label: "Ручное",     cls: "bg-zinc-700 text-zinc-300" },
    take_profit: { label: "Take Profit", cls: "bg-green-900 text-green-300" },
    stop_loss:   { label: "Stop Loss",  cls: "bg-orange-900 text-orange-300" },
    liquidation: { label: "Ликвидация", cls: "bg-red-900 text-red-300" },
  };
  if (!reason) return null;
  const { label, cls } = map[reason] ?? { label: reason, cls: "bg-zinc-700 text-zinc-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function PositionsList({ openTrades, closedTrades, currentPrice, onClose }: PositionsListProps) {
  const [tab, setTab] = useState<"open" | "closed">("open");
  const [closing, setClosing] = useState<number | null>(null);

  const handleClose = async (id: number) => {
    setClosing(id);
    try {
      const res = await api.trades.close(id);
      onClose(res.balance, res.reserved_balance);
    } finally {
      setClosing(null);
    }
  };

  return (
    <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        {(["open", "closed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === t ? "text-white border-b-2 border-blue-500" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t === "open" ? `Открытые (${openTrades.length})` : `История (${closedTrades.length})`}
          </button>
        ))}
      </div>

      <div className="overflow-auto max-h-80">
        {tab === "open" && (
          <>
            {openTrades.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">Нет открытых позиций</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left px-4 py-2">Символ</th>
                    <th className="text-left px-4 py-2">Направление</th>
                    <th className="text-right px-4 py-2">Маржа</th>
                    <th className="text-right px-4 py-2">Плечо</th>
                    <th className="text-right px-4 py-2">Вход</th>
                    <th className="text-right px-4 py-2">Ликвидация</th>
                    <th className="text-right px-4 py-2">PnL</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {openTrades.map((trade) => {
                    const pnl = currentPrice ? calcPnl(trade, currentPrice) : null;
                    const roe = pnl !== null ? (pnl / trade.margin) * 100 : null;
                    return (
                      <tr key={trade.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                        <td className="px-4 py-3 font-mono text-white">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold ${
                            trade.direction === "long" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                          }`}>
                            {trade.direction === "long" ? "Long ↑" : "Short ↓"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">${fmtPrice(trade.margin)}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{trade.leverage}x</td>
                        <td className="px-4 py-3 text-right font-mono text-zinc-300">${fmtPrice(trade.entry_price)}</td>
                        <td className="px-4 py-3 text-right font-mono text-red-400">${fmtPrice(trade.liquidation_price)}</td>
                        <td className="px-4 py-3 text-right">
                          {pnl !== null ? (
                            <span className={pnl >= 0 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                              {pnl >= 0 ? "+" : ""}${fmtPrice(pnl)}
                              <span className="text-zinc-500 ml-1">({roe! >= 0 ? "+" : ""}{roe!.toFixed(1)}%)</span>
                            </span>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleClose(trade.id)}
                            disabled={closing === trade.id}
                            className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-zinc-300 transition-colors"
                          >
                            Закрыть
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        )}

        {tab === "closed" && (
          <>
            {closedTrades.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-8">История пуста</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800">
                    <th className="text-left px-4 py-2">Символ</th>
                    <th className="text-left px-4 py-2">Направление</th>
                    <th className="text-right px-4 py-2">Маржа</th>
                    <th className="text-right px-4 py-2">Плечо</th>
                    <th className="text-right px-4 py-2">Вход</th>
                    <th className="text-right px-4 py-2">Закрытие</th>
                    <th className="text-right px-4 py-2">PnL</th>
                    <th className="text-left px-4 py-2">Причина</th>
                  </tr>
                </thead>
                <tbody>
                  {closedTrades.map((trade) => (
                    <tr key={trade.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                      <td className="px-4 py-3 font-mono text-white">{trade.symbol}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          trade.direction === "long" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"
                        }`}>
                          {trade.direction === "long" ? "Long ↑" : "Short ↓"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">${fmtPrice(trade.margin)}</td>
                      <td className="px-4 py-3 text-right text-zinc-300">{trade.leverage}x</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">${fmtPrice(trade.entry_price)}</td>
                      <td className="px-4 py-3 text-right font-mono text-zinc-300">
                        {trade.close_price ? `$${fmtPrice(trade.close_price)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {trade.pnl !== null ? (
                          <span className={trade.pnl >= 0 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                            {trade.pnl >= 0 ? "+" : ""}${fmtPrice(trade.pnl)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <CloseReasonBadge reason={trade.close_reason} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
}
