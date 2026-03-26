"use client";

import { useCallback, useEffect, useState } from "react";
import { api, Trade } from "@/lib/api";
import { getEcho } from "@/lib/echo";

interface TradeUpdatedPayload {
  trade: Trade;
  user_balance: number;
  user_reserved_balance: number;
}

export function useTrades(userId: number | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [reservedBalance, setReservedBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await api.trades.list();
      setTrades(res.trades);
      setBalance(res.balance);
      setReservedBalance(res.reserved_balance);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  // Real-time updates via private WebSocket channel
  useEffect(() => {
    if (!userId) return;

    const echoInstance = getEcho();
    const channel = echoInstance
      .private(`trades.${userId}`)
      .listen(".trade.updated", (payload: TradeUpdatedPayload) => {
        const updated = payload.trade;

        setTrades((prev) => {
          const exists = prev.find((t) => t.id === updated.id);
          if (exists) {
            return prev.map((t) => (t.id === updated.id ? updated : t));
          }
          return [updated, ...prev];
        });

        setBalance(payload.user_balance);
        setReservedBalance(payload.user_reserved_balance);
      });

    return () => {
      channel.stopListening(".trade.updated");
      echoInstance.leave(`trades.${userId}`);
    };
  }, [userId]);

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status !== "open");

  return {
    trades,
    openTrades,
    closedTrades,
    balance,
    reservedBalance,
    loading,
    refresh: fetchTrades,
  };
}
