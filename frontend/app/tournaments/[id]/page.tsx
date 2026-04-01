"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  api,
  LeaderboardEntry,
  TournamentDetailResponse,
  TournamentTradesResponse,
  Trade,
} from "@/lib/api";

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    upcoming: { label: "Скоро",    cls: "bg-yellow-900/50 text-yellow-400" },
    active:   { label: "Активен",  cls: "bg-green-900/50 text-green-400" },
    finished: { label: "Завершён", cls: "bg-zinc-800 text-zinc-400" },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-zinc-800 text-zinc-400" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{label}</span>;
}

function CloseReasonBadge({ reason }: { reason: Trade["close_reason"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    manual:      { label: "Ручное",    cls: "bg-zinc-700 text-zinc-300" },
    take_profit: { label: "TP",        cls: "bg-green-900 text-green-300" },
    stop_loss:   { label: "SL",        cls: "bg-orange-900 text-orange-300" },
    liquidation: { label: "Ликвид.",   cls: "bg-red-900 text-red-300" },
  };
  if (!reason) return <span className="text-xs text-zinc-500">—</span>;
  const { label, cls } = map[reason] ?? { label: reason, cls: "bg-zinc-700 text-zinc-300" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

function TradesTable({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) {
    return <p className="text-zinc-500 text-sm text-center py-8">Сделок нет</p>;
  }
  return (
    <div className="overflow-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-zinc-500 border-b border-zinc-800 bg-[#0d1420]">
            <th className="text-left px-4 py-2">Символ</th>
            <th className="text-left px-4 py-2">Направление</th>
            <th className="text-right px-4 py-2">Маржа</th>
            <th className="text-right px-4 py-2">Плечо</th>
            <th className="text-right px-4 py-2">Размер</th>
            <th className="text-right px-4 py-2">Вход</th>
            <th className="text-right px-4 py-2">Закрытие</th>
            <th className="text-right px-4 py-2">PnL</th>
            <th className="text-left px-4 py-2">Статус</th>
            <th className="text-left px-4 py-2">Причина</th>
            <th className="text-right px-4 py-2">Дата</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => {
            const roe = trade.pnl !== null ? (trade.pnl / trade.margin) * 100 : null;
            return (
              <tr key={trade.id} className="border-b border-zinc-800/40 hover:bg-zinc-900/30 transition-colors">
                <td className="px-4 py-2.5 font-mono text-white font-medium">{trade.symbol}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${trade.direction === "long" ? "bg-green-900/50 text-green-400" : "bg-red-900/50 text-red-400"}`}>
                    {trade.direction === "long" ? "Long ↑" : "Short ↓"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-300">${fmt(trade.margin)}</td>
                <td className="px-4 py-2.5 text-right text-zinc-300">{trade.leverage}x</td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-400">${fmt(trade.position_size, 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-300">${fmt(trade.entry_price)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-zinc-400">
                  {trade.close_price ? `$${fmt(trade.close_price)}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-mono">
                  {trade.pnl !== null ? (
                    <span className={trade.pnl >= 0 ? "text-green-400" : "text-red-400"}>
                      {trade.pnl >= 0 ? "+" : ""}${fmt(trade.pnl)}
                      {roe !== null && (
                        <span className="text-zinc-500 ml-1">({roe >= 0 ? "+" : ""}{roe.toFixed(1)}%)</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    trade.status === "open" ? "bg-blue-900/50 text-blue-400"
                    : trade.status === "liquidated" ? "bg-red-900/50 text-red-400"
                    : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {trade.status === "open" ? "Открыта" : trade.status === "liquidated" ? "Ликвидирована" : "Закрыта"}
                  </span>
                </td>
                <td className="px-4 py-2.5"><CloseReasonBadge reason={trade.close_reason} /></td>
                <td className="px-4 py-2.5 text-right text-zinc-500">{fmtDate(trade.opened_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatsRow({ stats, label }: { stats: TournamentTradesResponse["stats"]; label: string }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        {
          label,
          value: `${stats.total_pnl >= 0 ? "+" : ""}$${fmt(stats.total_pnl)}`,
          color: stats.total_pnl >= 0 ? "text-green-400" : "text-red-400",
        },
        { label: "Всего сделок", value: String(stats.trade_count), color: "text-white" },
        { label: "Закрытых",     value: String(stats.closed_count), color: "text-white" },
        {
          label: "Win Rate",
          value: `${stats.win_rate}%`,
          color: stats.win_rate >= 50 ? "text-green-400" : "text-red-400",
        },
      ].map((s) => (
        <div key={s.label} className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-1">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</span>
          <span className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const tournamentId = Number(params.id);

  const [data, setData] = useState<TournamentDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [myTrades, setMyTrades] = useState<TournamentTradesResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "my-trades">("leaderboard");
  const [joiningId, setJoiningId] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Selected user in leaderboard
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null);
  const [selectedUserTrades, setSelectedUserTrades] = useState<TournamentTradesResponse | null>(null);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.replace("/auth"); return; }
    api.tournaments
      .get(tournamentId)
      .then((d) => {
        setData(d);
        if (d.joined) return api.tournaments.myTrades(tournamentId).then(setMyTrades);
      })
      .catch(() => router.replace("/tournaments"))
      .finally(() => setLoading(false));
  }, [router, tournamentId]);

  const handleJoin = async () => {
    setJoinError(null);
    setJoiningId(true);
    try {
      await api.tournaments.join(tournamentId);
      const [d, t] = await Promise.all([
        api.tournaments.get(tournamentId),
        api.tournaments.myTrades(tournamentId),
      ]);
      setData(d);
      setMyTrades(t);
    } catch (e: unknown) {
      setJoinError((e as { message?: string })?.message ?? "Ошибка при вступлении");
    } finally {
      setJoiningId(false);
    }
  };

  const handleSelectUser = async (entry: LeaderboardEntry) => {
    if (selectedUser?.user_id === entry.user_id) {
      setSelectedUser(null);
      setSelectedUserTrades(null);
      return;
    }
    setSelectedUser(entry);
    setSelectedUserTrades(null);
    setSelectedUserLoading(true);
    try {
      const trades = await api.tournaments.userTrades(tournamentId, entry.user_id);
      setSelectedUserTrades(trades);
    } catch {
      setSelectedUserTrades({ trades: [], stats: { total_pnl: 0, trade_count: 0, closed_count: 0, open_count: 0, win_rate: 0 } });
    } finally {
      setSelectedUserLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d14] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  if (!data) return null;

  const { tournament, leaderboard, joined } = data;

  const startDate = new Date(tournament.start_date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  const endDate   = new Date(tournament.end_date).toLocaleDateString("ru-RU",   { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#080d14] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">

        {/* Header */}
        <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{tournament.name}</h1>
                <StatusBadge status={tournament.status} />
                {joined && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">Вы участник</span>}
              </div>
              {tournament.description && <p className="text-sm text-zinc-400">{tournament.description}</p>}
              <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1 flex-wrap">
                <span>{startDate} — {endDate}</span>
                <span>{tournament.participants_count} участников</span>
                <span className="text-zinc-400">
                  Стартовый баланс: <span className="text-white font-mono">${fmt(tournament.starting_balance, 0)}</span>
                </span>
                {tournament.prize_pool !== null && (
                  <span className="text-yellow-400">Призовой фонд: ${fmt(tournament.prize_pool)}</span>
                )}
              </div>
              {joined && data.tournament_balance !== null && data.tournament_balance !== undefined && (
                <div className="flex items-center gap-4 text-xs mt-1 flex-wrap">
                  <span className="text-zinc-500">
                    Мой баланс:{" "}
                    <span className="text-white font-mono font-semibold">
                      ${fmt(data.tournament_balance + (data.tournament_reserved_balance ?? 0))}
                    </span>
                  </span>
                  <span className="text-zinc-600">
                    Доступно: <span className="text-zinc-300 font-mono">${fmt(data.tournament_balance)}</span>
                    {" · "}В позициях:{" "}
                    <span className="text-yellow-400 font-mono">${fmt(data.tournament_reserved_balance ?? 0)}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              {joined && tournament.status === "active" && (
                <Link
                  href={`/tournaments/${tournamentId}/trade`}
                  className="text-sm px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors font-semibold"
                >
                  Торговать →
                </Link>
              )}
              {!joined && tournament.status === "active" && (
                <>
                  <button
                    onClick={handleJoin}
                    disabled={joiningId}
                    className="text-sm px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white transition-colors"
                  >
                    {joiningId ? "Вступление..." : "Вступить в турнир"}
                  </button>
                  {joinError && <span className="text-xs text-red-400">{joinError}</span>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        {joined && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${activeTab === "leaderboard" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              Турнирная таблица
            </button>
            <button
              onClick={() => setActiveTab("my-trades")}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${activeTab === "my-trades" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"}`}
            >
              Мои сделки
            </button>
          </div>
        )}

        {/* Leaderboard tab */}
        {(activeTab === "leaderboard" || !joined) && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-800">
                <h2 className="font-semibold text-sm">Турнирная таблица</h2>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-zinc-500 text-sm text-center py-10">Нет участников</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-zinc-500 border-b border-zinc-800 bg-[#0d1420]">
                      <th className="text-left px-4 py-3 w-10">#</th>
                      <th className="text-left px-4 py-3">Участник</th>
                      <th className="text-right px-4 py-3">Прибыль</th>
                      <th className="text-right px-4 py-3">Сделок</th>
                      <th className="text-right px-4 py-3">Win Rate</th>
                      <th className="text-right px-4 py-3">Вступил</th>
                      <th className="text-right px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, idx) => {
                      const isSelected = selectedUser?.user_id === entry.user_id;
                      const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                      return (
                        <tr
                          key={entry.user_id}
                          className={`border-b border-zinc-800/40 transition-colors ${isSelected ? "bg-zinc-800/60" : "hover:bg-zinc-900/30"}`}
                        >
                          <td className="px-4 py-3 text-zinc-500 font-mono">
                            {medal ? <span className="text-base">{medal}</span> : <span className="text-zinc-600">{idx + 1}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                                {entry.user_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-white">{entry.user_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            <span className={entry.total_pnl >= 0 ? "text-green-400" : "text-red-400"}>
                              {entry.total_pnl >= 0 ? "+" : ""}${fmt(entry.total_pnl)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-400">{entry.trade_count}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={entry.win_rate >= 50 ? "text-green-400" : "text-zinc-400"}>
                              {entry.win_rate}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-zinc-500">
                            {new Date(entry.joined_at).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleSelectUser(entry)}
                              className={`text-xs transition-colors ${isSelected ? "text-blue-400 hover:text-blue-300" : "text-zinc-500 hover:text-white"}`}
                            >
                              {isSelected ? "Скрыть ▲" : "Статистика ▼"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Selected user panel */}
            {selectedUser && (
              <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {selectedUser.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{selectedUser.user_name}</span>
                    <span className="text-xs text-zinc-500 ml-2">— статистика и сделки в турнире</span>
                  </div>
                </div>

                {selectedUserLoading ? (
                  <p className="text-zinc-500 text-sm text-center py-8">Загрузка...</p>
                ) : selectedUserTrades ? (
                  <div className="flex flex-col gap-0">
                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-zinc-800/40">
                      {[
                        {
                          label: "Прибыль",
                          value: `${selectedUserTrades.stats.total_pnl >= 0 ? "+" : ""}$${fmt(selectedUserTrades.stats.total_pnl)}`,
                          color: selectedUserTrades.stats.total_pnl >= 0 ? "text-green-400" : "text-red-400",
                        },
                        { label: "Всего сделок", value: String(selectedUserTrades.stats.trade_count), color: "text-white" },
                        { label: "Закрытых / Открытых", value: `${selectedUserTrades.stats.closed_count} / ${selectedUserTrades.stats.open_count ?? 0}`, color: "text-white" },
                        {
                          label: "Win Rate",
                          value: `${selectedUserTrades.stats.win_rate}%`,
                          color: selectedUserTrades.stats.win_rate >= 50 ? "text-green-400" : "text-red-400",
                        },
                      ].map((s) => (
                        <div key={s.label} className="bg-[#0d1420] p-4 flex flex-col gap-1">
                          <span className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</span>
                          <span className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                    {/* Trades */}
                    <TradesTable trades={selectedUserTrades.trades} />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* My trades tab */}
        {activeTab === "my-trades" && joined && (
          <div className="flex flex-col gap-4">
            {myTrades ? (
              <>
                <StatsRow stats={myTrades.stats} label="Моя прибыль" />
                <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-zinc-800">
                    <h2 className="font-semibold text-sm">Мои сделки в турнире</h2>
                  </div>
                  <TradesTable trades={myTrades.trades} />
                </div>
              </>
            ) : (
              <p className="text-zinc-500 text-sm text-center py-10">Загрузка...</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
