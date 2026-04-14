"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminTournament, AdminParticipant } from "@/lib/api";
import { FormInput } from "@/components/FormInput";
import {
  useGetAdminTournamentsQuery,
  useCreateTournamentMutation,
  useUpdateTournamentMutation,
  useDeleteTournamentMutation,
  useGetAdminParticipantsQuery,
} from "@/lib/apiSlice";

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

const STATUS_OPTIONS = [
  { value: "upcoming", label: "Скоро" },
  { value: "active", label: "Активен" },
  { value: "finished", label: "Завершён" },
];

const emptyForm = {
  name: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "upcoming",
  max_participants: "",
  prize_pool: "",
  starting_balance: "10000",
};

const statusLabel: Record<string, string> = {
  upcoming: "Скоро",
  active: "Активен",
  finished: "Завершён",
};
const statusColor: Record<string, string> = {
  upcoming: "text-yellow-400",
  active: "text-green-400",
  finished: "text-zinc-400",
};

export default function AdminPage() {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, isError, error: fetchError } = useGetAdminTournamentsQuery();
  const [createTournament] = useCreateTournamentMutation();
  const [updateTournament] = useUpdateTournamentMutation();
  const [deleteTournament] = useDeleteTournamentMutation();

  const { data: participantsData, isFetching: participantsLoading } =
    useGetAdminParticipantsQuery(selectedTournamentId!, {
      skip: selectedTournamentId === null,
    });

  useEffect(() => {
    if (isError && fetchError && "status" in fetchError && fetchError.status === 403) {
      router.replace("/");
    }
  }, [isError, fetchError, router]);

  const tournaments: AdminTournament[] = data?.tournaments ?? [];
  const participants: AdminParticipant[] | undefined = participantsData?.participants;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const body = {
      name: form.name,
      description: form.description || undefined,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      max_participants: form.max_participants ? Number(form.max_participants) : null,
      prize_pool: form.prize_pool ? Number(form.prize_pool) : null,
      starting_balance: form.starting_balance ? Number(form.starting_balance) : null,
    };

    try {
      if (editingId !== null) {
        await updateTournament({ id: editingId, body }).unwrap();
        setSuccess("Турнир обновлён");
      } else {
        await createTournament(body).unwrap();
        setSuccess("Турнир создан");
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as { message?: string; data?: { errors?: Record<string, string[]>; message?: string } };
      const firstError = err?.data?.errors
        ? Object.values(err.data.errors).flat()[0]
        : (err?.data?.message ?? err?.message);
      setError(firstError ?? "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: AdminTournament) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      description: t.description ?? "",
      start_date: t.start_date.slice(0, 16),
      end_date: t.end_date.slice(0, 16),
      status: t.status,
      max_participants: t.max_participants ? String(t.max_participants) : "",
      prize_pool: t.prize_pool ? String(t.prize_pool) : "",
      starting_balance: (t as { starting_balance?: number }).starting_balance
        ? String((t as { starting_balance?: number }).starting_balance)
        : "10000",
    });
    setShowForm(true);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Удалить турнир?")) return;
    try {
      await deleteTournament(id).unwrap();
      setSuccess("Турнир удалён");
      if (selectedTournamentId === id) setSelectedTournamentId(null);
    } catch {
      setError("Ошибка удаления");
    }
  };

  const toggleParticipants = (id: number) => {
    setSelectedTournamentId(selectedTournamentId === id ? null : id);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Админ панель</h1>
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              + Создать турнир
            </button>
          )}
        </div>

        {success && (
          <div className="bg-green-900/30 border border-green-800/50 text-green-400 text-sm px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-6">
            <h2 className="font-semibold mb-4">
              {editingId !== null ? "Редактировать турнир" : "Новый турнир"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Название *"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="Название турнира"
                />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-zinc-400">Статус *</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <FormInput
                  label="Дата начала *"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
                <FormInput
                  label="Дата окончания *"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  required
                />
                <FormInput
                  label="Макс. участников"
                  type="number"
                  min="2"
                  value={form.max_participants}
                  onChange={(e) => setForm({ ...form, max_participants: e.target.value })}
                  placeholder="Без ограничений"
                />
                <FormInput
                  label="Призовой фонд ($)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.prize_pool}
                  onChange={(e) => setForm({ ...form, prize_pool: e.target.value })}
                  placeholder="Нет призового фонда"
                />
                <FormInput
                  label="Стартовый баланс ($) *"
                  type="number"
                  min="100"
                  step="100"
                  value={form.starting_balance}
                  onChange={(e) => setForm({ ...form, starting_balance: e.target.value })}
                  placeholder="10000"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-zinc-400">Описание</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Описание турнира..."
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
                >
                  {saving ? "Сохранение..." : editingId !== null ? "Сохранить" : "Создать"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="text-sm px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-semibold text-sm">
              Все турниры ({tournaments.length})
            </h2>
          </div>

          {tournaments.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-10">
              Турниров нет. Создайте первый!
            </p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-500 border-b border-zinc-800 bg-[#0d1420]">
                  <th className="text-left px-4 py-3">Название</th>
                  <th className="text-left px-4 py-3">Статус</th>
                  <th className="text-right px-4 py-3">Начало</th>
                  <th className="text-right px-4 py-3">Конец</th>
                  <th className="text-right px-4 py-3">Участников</th>
                  <th className="text-right px-4 py-3">Призовой фонд</th>
                  <th className="text-right px-4 py-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => (
                  <React.Fragment key={t.id}>
                    <tr className="border-b border-zinc-800/40 hover:bg-zinc-900/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${statusColor[t.status] ?? "text-zinc-400"}`}>
                          {statusLabel[t.status] ?? t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">
                        {new Date(t.start_date).toLocaleDateString("ru-RU", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">
                        {new Date(t.end_date).toLocaleDateString("ru-RU", {
                          day: "2-digit", month: "2-digit", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">
                        {t.participants_count}
                        {t.max_participants ? ` / ${t.max_participants}` : ""}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-400">
                        {t.prize_pool !== null ? `$${fmt(t.prize_pool)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleParticipants(t.id)}
                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                          >
                            {selectedTournamentId === t.id ? "Скрыть" : "Участники"}
                          </button>
                          <button
                            onClick={() => handleEdit(t)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>

                    {selectedTournamentId === t.id && (
                      <tr key={`participants-${t.id}`} className="border-b border-zinc-800/40">
                        <td colSpan={7} className="px-4 py-4 bg-zinc-900/20">
                          {participantsLoading ? (
                            <p className="text-zinc-500 text-xs text-center py-2">Загрузка...</p>
                          ) : participants && participants.length === 0 ? (
                            <p className="text-zinc-500 text-xs text-center py-2">Нет участников</p>
                          ) : participants ? (
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-zinc-500">
                                  <th className="text-left py-2 pr-4">#</th>
                                  <th className="text-left py-2 pr-4">Имя</th>
                                  <th className="text-left py-2 pr-4">Email</th>
                                  <th className="text-right py-2 pr-4">Прибыль</th>
                                  <th className="text-right py-2 pr-4">Сделок</th>
                                  <th className="text-right py-2 pr-4">Win Rate</th>
                                  <th className="text-right py-2">Вступил</th>
                                </tr>
                              </thead>
                              <tbody>
                                {participants.map((p, idx) => (
                                  <tr key={p.participant_id} className="border-t border-zinc-800/30">
                                    <td className="py-2 pr-4 text-zinc-500">{idx + 1}</td>
                                    <td className="py-2 pr-4 font-medium text-white">{p.user_name}</td>
                                    <td className="py-2 pr-4 text-zinc-400">{p.user_email}</td>
                                    <td className="py-2 pr-4 text-right font-mono">
                                      <span className={p.total_pnl >= 0 ? "text-green-400" : "text-red-400"}>
                                        {p.total_pnl >= 0 ? "+" : ""}${fmt(p.total_pnl)}
                                      </span>
                                    </td>
                                    <td className="py-2 pr-4 text-right text-zinc-400">{p.trade_count}</td>
                                    <td className="py-2 pr-4 text-right">
                                      <span className={p.win_rate >= 50 ? "text-green-400" : "text-zinc-400"}>
                                        {p.win_rate}%
                                      </span>
                                    </td>
                                    <td className="py-2 text-right text-zinc-500">
                                      {new Date(p.joined_at).toLocaleDateString("ru-RU", {
                                        day: "2-digit", month: "2-digit", year: "numeric",
                                      })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
