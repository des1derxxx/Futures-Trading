"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, Tournament } from "@/lib/api";

function StatusBadge({ status }: { status: Tournament["status"] }) {
  const map = {
    upcoming: { label: "Скоро", cls: "bg-yellow-900/50 text-yellow-400" },
    active:   { label: "Активен", cls: "bg-green-900/50 text-green-400" },
    finished: { label: "Завершён", cls: "bg-zinc-800 text-zinc-400" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {label}
    </span>
  );
}

function fmt(n: number, digits = 0) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function TournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/auth");
      return;
    }
    api.tournaments
      .list()
      .then((data) => {
        setTournaments(data.tournaments);
        setHasActive(data.has_active_tournament);
      })
      .catch(() => {
        localStorage.removeItem("token");
        router.replace("/auth");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleJoin = async (id: number) => {
    setError(null);
    setJoiningId(id);
    try {
      await api.tournaments.join(id);
      const data = await api.tournaments.list();
      setTournaments(data.tournaments);
      setHasActive(data.has_active_tournament);
      router.push(`/tournaments/${id}`);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? "Ошибка при вступлении");
    } finally {
      setJoiningId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080d14] flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d14] text-white">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Турниры</h1>
          {hasActive && (
            <span className="text-xs text-green-400 bg-green-900/30 border border-green-800/50 px-3 py-1.5 rounded-lg">
              У вас есть активный турнир
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {tournaments.length === 0 ? (
          <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-10 text-center text-zinc-500 text-sm">
            Турниры не найдены
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tournaments.map((t) => {
              const startDate = new Date(t.start_date).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });
              const endDate = new Date(t.end_date).toLocaleDateString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              });

              const canJoin = t.status === "active" && !t.joined && !hasActive;

              return (
                <div
                  key={t.id}
                  className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="text-lg font-semibold hover:text-blue-400 transition-colors"
                        >
                          {t.name}
                        </Link>
                        <StatusBadge status={t.status} />
                        {t.joined && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400">
                            Участник
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-sm text-zinc-400">{t.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-zinc-500 mt-1">
                        <span>{startDate} — {endDate}</span>
                        <span>
                          {t.participants_count} участник
                          {t.max_participants ? ` / ${t.max_participants}` : ""}
                        </span>
                        {t.prize_pool !== null && (
                          <span className="text-yellow-400">
                            Призовой фонд: ${fmt(t.prize_pool, 2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {t.joined ? (
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="text-xs px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                        >
                          Смотреть
                        </Link>
                      ) : canJoin ? (
                        <button
                          onClick={() => handleJoin(t.id)}
                          disabled={joiningId === t.id}
                          className="text-xs px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white transition-colors"
                        >
                          {joiningId === t.id ? "Вступление..." : "Вступить"}
                        </button>
                      ) : t.status === "active" && hasActive && !t.joined ? (
                        <span className="text-xs text-zinc-500 px-4 py-2">
                          Уже в другом турнире
                        </span>
                      ) : t.status === "upcoming" ? (
                        <span className="text-xs text-zinc-500 px-4 py-2">
                          Ещё не начался
                        </span>
                      ) : t.status === "finished" ? (
                        <Link
                          href={`/tournaments/${t.id}`}
                          className="text-xs px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                        >
                          Результаты
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
