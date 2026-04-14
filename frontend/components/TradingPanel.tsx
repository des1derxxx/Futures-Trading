"use client";

import { useState } from "react";
import { api, ApiError, OpenTradeBody } from "@/lib/api";
import { FormInput } from "@/components/FormInput";

export const SYMBOLS = [
  { value: "BTCUSDT", label: "BTC" },
  { value: "ETHUSDT", label: "ETH" },
  { value: "BNBUSDT", label: "BNB" },
  { value: "XRPUSDT", label: "XRP" },
  { value: "SOLUSDT", label: "SOL" },
];

interface TradingPanelProps {
  currentPrice: number | null;
  balance: number;
  onTradeOpened: (balance: number, reservedBalance: number) => void;
  tournamentId?: number;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
}

export default function TradingPanel({
  currentPrice,
  balance,
  onTradeOpened,
  tournamentId,
  symbol,
  onSymbolChange,
}: TradingPanelProps) {
  const [margin, setMargin] = useState("");
  const [leverage, setLeverage] = useState(10);
  const [takeProfit, setTakeProfit] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positionSize = parseFloat(margin || "0") * leverage;

  const liqPrice = (direction: "long" | "short") => {
    if (!currentPrice || !parseFloat(margin)) return null;
    if (direction === "long") return currentPrice * (1 - 1 / leverage);
    return currentPrice * (1 + 1 / leverage);
  };

  const open = async (direction: "long" | "short") => {
    if (!margin || parseFloat(margin) <= 0) {
      setError("Введите сумму маржи.");
      return;
    }
    if (parseFloat(margin) > balance) {
      setError("Недостаточно средств.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const body: OpenTradeBody = {
        symbol,
        direction,
        margin: parseFloat(margin),
        leverage,
        take_profit: takeProfit ? parseFloat(takeProfit) : null,
        stop_loss: stopLoss ? parseFloat(stopLoss) : null,
        tournament_id: tournamentId ?? null,
      };
      const res = await api.trades.open(body);
      onTradeOpened(res.balance, res.reserved_balance);
      setMargin("");
      setTakeProfit("");
      setStopLoss("");
    } catch (e) {
      const err = e as ApiError;
      setError(err.message ?? "Ошибка при открытии позиции.");
    } finally {
      setLoading(false);
    }
  };

  const leveragePresets = [2, 5, 10, 20, 50, 100];

  return (
    <div className="bg-[#0d1420] border border-zinc-800/60 rounded-xl p-4 flex flex-col gap-4">
      <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Открыть позицию</h3>

      {/* Symbol selector */}
      <div className="flex gap-1">
        {SYMBOLS.map((s) => (
          <button
            key={s.value}
            onClick={() => onSymbolChange(s.value)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              symbol === s.value
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-zinc-400">Цена входа</span>
        <span className="font-mono text-white">
          {currentPrice
            ? `$${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
            : "—"}
        </span>
      </div>

      <FormInput
        label="Маржа (USDT)"
        type="number"
        min="1"
        value={margin}
        onChange={(e) => setMargin(e.target.value)}
        placeholder="100"
      />

      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-500">Плечо: {leverage}x</label>
        <input
          type="range"
          min="1"
          max="125"
          value={leverage}
          onChange={(e) => setLeverage(parseInt(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div className="flex gap-1 flex-wrap">
          {leveragePresets.map((l) => (
            <button
              key={l}
              onClick={() => setLeverage(l)}
              className={`text-xs px-2 py-1 rounded ${
                leverage === l
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {l}x
            </button>
          ))}
        </div>
      </div>

      {positionSize > 0 && (
        <div className="text-xs text-zinc-400 bg-zinc-900/50 rounded-lg p-2 flex justify-between">
          <span>Размер позиции</span>
          <span className="text-white font-mono">
            ${positionSize.toLocaleString("en-US", { maximumFractionDigits: 2 })}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <FormInput
          label="Take Profit"
          type="number"
          min="0"
          value={takeProfit}
          onChange={(e) => setTakeProfit(e.target.value)}
          placeholder="Необязательно"
          focusBorderClass="focus:border-green-500"
          className="text-xs"
        />
        <FormInput
          label="Stop Loss"
          type="number"
          min="0"
          value={stopLoss}
          onChange={(e) => setStopLoss(e.target.value)}
          placeholder="Необязательно"
          focusBorderClass="focus:border-red-500"
          className="text-xs"
        />
      </div>

      {margin && parseFloat(margin) > 0 && currentPrice && (
        <div className="text-xs text-zinc-500 flex justify-between">
          <span>
            Ликвидация Long:{" "}
            <span className="text-red-400 font-mono">
              ${liqPrice("long")?.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          </span>
          <span>
            Short:{" "}
            <span className="text-red-400 font-mono">
              ${liqPrice("short")?.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => open("long")}
          disabled={loading || !currentPrice}
          className="py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          Long ↑
        </button>
        <button
          onClick={() => open("short")}
          disabled={loading || !currentPrice}
          className="py-3 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors"
        >
          Short ↓
        </button>
      </div>
    </div>
  );
}
