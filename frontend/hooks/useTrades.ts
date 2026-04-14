"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { api, Trade } from "@/lib/api";
import { getEcho } from "@/lib/echo";
import { notifications } from "@mantine/notifications";
import { addNotification, type NotificationColor } from "@/lib/notificationsSlice";
import type { AppDispatch } from "@/lib/store";

interface TradeNotificationConfig {
  title: string;
  message: string;
  color: NotificationColor;
  autoClose: number;
}

function buildTradeNotification(trade: Trade): TradeNotificationConfig | null {
  const symbol = trade.symbol ?? "BTC";
  const dir = trade.direction === "long" ? "Long ↑" : "Short ↓";
  const pnl =
    trade.pnl !== null
      ? ` · PnL: ${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`
      : "";

  switch (trade.close_reason) {
    case "liquidation":
      return { title: "Ликвидация", message: `${symbol} ${dir}${pnl}`, color: "red", autoClose: 8000 };
    case "stop_loss":
      return { title: "Stop Loss сработал", message: `${symbol} ${dir}${pnl}`, color: "orange", autoClose: 7000 };
    case "take_profit":
      return { title: "Take Profit достигнут", message: `${symbol} ${dir}${pnl}`, color: "teal", autoClose: 7000 };
    default:
      return null;
  }
}

function fireNotification(dispatch: AppDispatch, trade: Trade) {
  const cfg = buildTradeNotification(trade);
  if (!cfg) return;
  notifications.show({ title: cfg.title, message: cfg.message, color: cfg.color, autoClose: cfg.autoClose });
  dispatch(addNotification({ title: cfg.title, message: cfg.message, color: cfg.color }));
}

interface TradeUpdatedPayload {
  trade: Trade;
  user_balance: number;
  user_reserved_balance: number;
  tournament_balance: number | null;
  tournament_reserved_balance: number | null;
}

export function useTrades(userId: number | null) {
  const dispatch = useDispatch<AppDispatch>();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [reservedBalance, setReservedBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const prevStatuses = useRef<Map<number, string>>(new Map());

  const fetchTrades = useCallback(async () => {
    try {
      const res = await api.trades.list();
      for (const t of res.trades) prevStatuses.current.set(t.id, t.status);
      setTrades(res.trades);
      setBalance(res.balance);
      setReservedBalance(res.reserved_balance);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    if (!userId) return;

    const echoInstance = getEcho();
    const channel = echoInstance
      .private(`trades.${userId}`)
      .listen(".trade.updated", (payload: TradeUpdatedPayload) => {
        const updated = payload.trade;

        if (updated.tournament_id) return;

        const prev = prevStatuses.current.get(updated.id);
        if (prev === "open" && (updated.status === "closed" || updated.status === "liquidated")) {
          fireNotification(dispatch, updated);
        }
        prevStatuses.current.set(updated.id, updated.status);

        setTrades((prev) => {
          const exists = prev.find((t) => t.id === updated.id);
          if (exists) return prev.map((t) => (t.id === updated.id ? updated : t));
          return [updated, ...prev];
        });

        setBalance(payload.user_balance);
        setReservedBalance(payload.user_reserved_balance);
      });

    return () => {
      channel.stopListening(".trade.updated");
      echoInstance.leave(`trades.${userId}`);
    };
  }, [userId, dispatch]);

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status !== "open");

  return { trades, openTrades, closedTrades, balance, reservedBalance, loading, refresh: fetchTrades };
}

export function useTournamentTrades(userId: number | null, tournamentId: number) {
  const dispatch = useDispatch<AppDispatch>();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [reservedBalance, setReservedBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const prevStatuses = useRef<Map<number, string>>(new Map());

  const fetchTrades = useCallback(async () => {
    try {
      const res = await api.trades.list(tournamentId);
      for (const t of res.trades) prevStatuses.current.set(t.id, t.status);
      setTrades(res.trades);
      setBalance(res.balance);
      setReservedBalance(res.reserved_balance);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  useEffect(() => {
    if (!userId) return;

    const echoInstance = getEcho();
    const channel = echoInstance
      .private(`trades.${userId}`)
      .listen(".trade.updated", (payload: TradeUpdatedPayload) => {
        const updated = payload.trade;

        if (updated.tournament_id !== tournamentId) return;

        const prev = prevStatuses.current.get(updated.id);
        if (prev === "open" && (updated.status === "closed" || updated.status === "liquidated")) {
          fireNotification(dispatch, updated);
        }
        prevStatuses.current.set(updated.id, updated.status);

        setTrades((prev) => {
          const exists = prev.find((t) => t.id === updated.id);
          if (exists) return prev.map((t) => (t.id === updated.id ? updated : t));
          return [updated, ...prev];
        });

        if (payload.tournament_balance !== null) setBalance(payload.tournament_balance);
        if (payload.tournament_reserved_balance !== null) setReservedBalance(payload.tournament_reserved_balance);
      });

    return () => {
      channel.stopListening(".trade.updated");
      echoInstance.leave(`trades.${userId}`);
    };
  }, [userId, tournamentId, dispatch]);

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status !== "open");

  return { trades, openTrades, closedTrades, balance, reservedBalance, loading, refresh: fetchTrades };
}
