"use client";

import { useEffect, useState } from "react";
import { getEcho } from "@/lib/echo";

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

const STALE_THRESHOLD_MS = 5000;

// Per-symbol shared state so any number of hook instances
// can subscribe to the same symbol without duplicating WS connections.
const priceBySymbol     = new Map<string, number>();
const connectedBySymbol = new Map<string, boolean>();
const priceListeners    = new Map<string, Set<(p: number) => void>>();
const connListeners     = new Map<string, Set<(c: boolean) => void>>();
const lastWsUpdate      = new Map<string, number>();
const pollIntervals     = new Map<string, ReturnType<typeof setInterval>>();
const initializedSymbols = new Set<string>(); // tracks which symbols had fetch+polling started
let channelSubscribed = false;

function getOrCreate<V>(map: Map<string, V>, key: string, factory: () => V): V {
  if (!map.has(key)) map.set(key, factory());
  return map.get(key)!;
}

function notifyPrice(symbol: string, price: number) {
  priceBySymbol.set(symbol, price);
  getOrCreate(priceListeners, symbol, () => new Set()).forEach((fn) => fn(price));
}

function notifyConnected(symbol: string, c: boolean) {
  connectedBySymbol.set(symbol, c);
  getOrCreate(connListeners, symbol, () => new Set()).forEach((fn) => fn(c));
}

async function fetchRestPrice(symbol: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const d = await r.json() as { price?: string };
    return d.price ? parseFloat(d.price) : null;
  } catch {
    return null;
  }
}

function ensureChannelSubscription() {
  if (channelSubscribed) return;
  channelSubscribed = true;

  const echo = getEcho();
  const conn = echo.connector.pusher.connection;

  const onConnected    = () => priceListeners.forEach((_, sym) => notifyConnected(sym, true));
  const onDisconnected = () => priceListeners.forEach((_, sym) => notifyConnected(sym, false));
  conn.bind("connected", onConnected);
  conn.bind("disconnected", onDisconnected);

  echo.channel("binance.prices").listen(".price.updated", (data: PriceData) => {
    lastWsUpdate.set(data.symbol, Date.now());
    notifyPrice(data.symbol, data.price);
  });
}

function subscribeSymbol(symbol: string) {
  ensureChannelSubscription();

  if (initializedSymbols.has(symbol)) return; // fetch + polling already started
  initializedSymbols.add(symbol);

  // Fetch initial price immediately
  fetchRestPrice(symbol).then((p) => {
    if (p !== null && !priceBySymbol.has(symbol)) notifyPrice(symbol, p);
  });

  // Fallback REST polling
  const interval = setInterval(async () => {
    const last = lastWsUpdate.get(symbol) ?? 0;
    if (Date.now() - last > STALE_THRESHOLD_MS) {
      const p = await fetchRestPrice(symbol);
      if (p !== null) notifyPrice(symbol, p);
    }
  }, STALE_THRESHOLD_MS);

  pollIntervals.set(symbol, interval);
}

function unsubscribeSymbol(symbol: string, onPrice: (p: number) => void, onConn: (c: boolean) => void) {
  priceListeners.get(symbol)?.delete(onPrice);
  connListeners.get(symbol)?.delete(onConn);

  // If no more listeners for this symbol, stop polling and reset initialization
  if ((priceListeners.get(symbol)?.size ?? 0) === 0) {
    const iv = pollIntervals.get(symbol);
    if (iv !== undefined) { clearInterval(iv); pollIntervals.delete(symbol); }
    priceBySymbol.delete(symbol);
    lastWsUpdate.delete(symbol);
    initializedSymbols.delete(symbol);
  }
}

export function useBinancePrice(symbol = "BTCUSDT") {
  const [price, setPrice] = useState<number | null>(priceBySymbol.get(symbol) ?? null);
  const [connected, setConnected] = useState(connectedBySymbol.get(symbol) ?? false);

  useEffect(() => {
    const onPrice = (p: number) => setPrice(p);
    const onConn  = (c: boolean) => setConnected(c);

    getOrCreate(priceListeners, symbol, () => new Set()).add(onPrice);
    getOrCreate(connListeners,  symbol, () => new Set()).add(onConn);

    subscribeSymbol(symbol);

    // Sync immediately if already known
    const p = priceBySymbol.get(symbol);
    if (p !== undefined) setPrice(p);

    return () => unsubscribeSymbol(symbol, onPrice, onConn);
  }, [symbol]);

  return { price, connected };
}
