"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Trade } from "@/lib/api";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number, digits = 2) {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

interface EquityPoint {
  trade: number;
  date: string;
  cumPnl: number;
  tradePnl: number;
}

interface Metrics {
  sharpe: number | null;
  maxDrawdown: number;
  maxDrawdownPct: number;
  profitFactor: number | null;
  equityCurve: EquityPoint[];
  totalClosed: number;
}

function computeMetrics(trades: Trade[]): Metrics {
  const closed = trades
    .filter((t) => t.status !== "open" && t.pnl !== null && t.closed_at)
    .sort(
      (a, b) =>
        new Date(a.closed_at!).getTime() - new Date(b.closed_at!).getTime()
    );

  const totalClosed = closed.length;

  // Equity curve
  let cum = 0;
  const equityCurve: EquityPoint[] = [
    { trade: 0, date: "", cumPnl: 0, tradePnl: 0 },
  ];
  for (let i = 0; i < closed.length; i++) {
    cum += Number(closed[i].pnl!);
    equityCurve.push({
      trade: i + 1,
      date: new Date(closed[i].closed_at!).toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
      }),
      cumPnl: parseFloat(cum.toFixed(2)),
      tradePnl: parseFloat(Number(closed[i].pnl!).toFixed(2)),
    });
  }

  // Sharpe ratio (per-trade, using ROE as return)
  let sharpe: number | null = null;
  if (closed.length >= 2) {
    const roe = closed.map((t) => Number(t.pnl!) / Number(t.margin));
    const mean = roe.reduce((a, b) => a + b, 0) / roe.length;
    const variance =
      roe.reduce((a, b) => a + (b - mean) ** 2, 0) / (roe.length - 1);
    const std = Math.sqrt(variance);
    sharpe = std > 0 ? parseFloat((mean / std).toFixed(2)) : null;
  }

  // Max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningPnl = 0;
  for (const t of closed) {
    runningPnl += Number(t.pnl!);
    if (runningPnl > peak) peak = runningPnl;
    const dd = peak - runningPnl;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  const maxDrawdownPct = peak > 0 ? (maxDrawdown / peak) * 100 : 0;

  // Profit factor
  let grossWin = 0;
  let grossLoss = 0;
  for (const t of closed) {
    if (Number(t.pnl!) > 0) grossWin += Number(t.pnl!);
    else grossLoss += Math.abs(Number(t.pnl!));
  }
  const profitFactor =
    grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : null;

  return {
    sharpe,
    maxDrawdown,
    maxDrawdownPct,
    profitFactor,
    equityCurve,
    totalClosed,
  };
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  payload: EquityPoint;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.trade === 0) return null;
  const pnlColor = d.cumPnl >= 0 ? "#4ade80" : "#f87171";
  const tradeColor = d.tradePnl >= 0 ? "#4ade80" : "#f87171";
  return (
    <div className="bg-[#0d1420] border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">
        Сделка #{d.trade}
        {d.date ? ` · ${d.date}` : ""}
      </p>
      <p style={{ color: tradeColor }}>
        PnL: {d.tradePnl >= 0 ? "+" : ""}${fmt(d.tradePnl)}
      </p>
      <p style={{ color: pnlColor }} className="font-semibold">
        Кумулятивно: {d.cumPnl >= 0 ? "+" : ""}${fmt(d.cumPnl)}
      </p>
    </div>
  );
}

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
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

// ── Main component ─────────────────────────────────────────────────────────────

export function AnalyticsSection({ trades }: { trades: Trade[] }) {
  const m = computeMetrics(trades);

  if (m.totalClosed < 2) {
    return (
      <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-8 text-center text-zinc-500 text-sm">
        Нужно минимум 2 закрытых сделки для аналитики
      </div>
    );
  }

  const lastPnl = m.equityCurve[m.equityCurve.length - 1]?.cumPnl ?? 0;
  const isPositive = lastPnl >= 0;

  // Compute gradient split point so area fills green above zero and red below
  const values = m.equityCurve.map((d) => d.cumPnl);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal;
  // percentage (0–100) at which cumPnl=0 sits in the chart's Y range
  const zeroOffset =
    range > 0 ? `${((maxVal / range) * 100).toFixed(1)}%` : "50%";

  const sharpeColor =
    m.sharpe === null
      ? "text-zinc-400"
      : m.sharpe >= 2
        ? "text-emerald-400"
        : m.sharpe >= 1
          ? "text-green-400"
          : m.sharpe >= 0
            ? "text-yellow-400"
            : "text-red-400";

  const pfColor =
    m.profitFactor === null
      ? "text-zinc-400"
      : m.profitFactor >= 2
        ? "text-emerald-400"
        : m.profitFactor >= 1.5
          ? "text-green-400"
          : m.profitFactor >= 1
            ? "text-yellow-400"
            : "text-red-400";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
        Аналитика
      </h2>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Sharpe Ratio"
          value={m.sharpe !== null ? String(m.sharpe) : "—"}
          color={sharpeColor}
          sub={
            m.sharpe !== null
              ? m.sharpe >= 2
                ? "отлично"
                : m.sharpe >= 1
                  ? "хорошо"
                  : m.sharpe >= 0
                    ? "нейтрально"
                    : "плохо"
              : "недостаточно данных"
          }
        />
        <MetricCard
          label="Макс. просадка"
          value={m.maxDrawdown > 0 ? `-$${fmt(m.maxDrawdown)}` : "$0"}
          color={
            m.maxDrawdown === 0
              ? "text-white"
              : m.maxDrawdownPct < 10
                ? "text-yellow-400"
                : m.maxDrawdownPct < 25
                  ? "text-orange-400"
                  : "text-red-400"
          }
          sub={
            m.maxDrawdown > 0 ? `${fmt(m.maxDrawdownPct, 1)}% от пика` : undefined
          }
        />
        <MetricCard
          label="Profit Factor"
          value={m.profitFactor !== null ? String(m.profitFactor) : "—"}
          color={pfColor}
          sub={
            m.profitFactor !== null
              ? m.profitFactor >= 2
                ? "отлично"
                : m.profitFactor >= 1.5
                  ? "хорошо"
                  : m.profitFactor >= 1
                    ? "в плюсе"
                    : "в минусе"
              : "нет прибыльных сделок"
          }
        />
        <MetricCard
          label="Итого PnL"
          value={`${lastPnl >= 0 ? "+" : ""}$${fmt(lastPnl)}`}
          color={isPositive ? "text-emerald-400" : "text-red-400"}
          sub={`за ${m.totalClosed} закрытых сделок`}
        />
      </div>

      {/* Equity curve */}
      <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold">Кривая доходности</h3>
          <span className="text-xs text-zinc-500">кумулятивный PnL ($)</span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={m.equityCurve}
            margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" stopOpacity={0.25} />
                <stop
                  offset={zeroOffset}
                  stopColor="#4ade80"
                  stopOpacity={0.05}
                />
                <stop
                  offset={zeroOffset}
                  stopColor="#f87171"
                  stopOpacity={0.05}
                />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset={zeroOffset} stopColor="#4ade80" />
                <stop offset={zeroOffset} stopColor="#f87171" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1f2937"
              vertical={false}
            />
            <XAxis
              dataKey="trade"
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v === 0 ? "" : `#${v}`)}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#71717a", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v >= 0 ? "" : ""}${fmt(v, 0)}`}
              width={70}
            />
            <Tooltip content={<ChartTooltip />} />
            <ReferenceLine
              y={0}
              stroke="#3f3f46"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="cumPnl"
              stroke="url(#lineGradient)"
              strokeWidth={2}
              fill="url(#equityGradient)"
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? "#4ade80" : "#f87171", strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
