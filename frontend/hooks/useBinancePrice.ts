"use client";

import { useEffect, useRef, useState } from "react";
import { getEcho } from "@/lib/echo";

interface PriceData {
  symbol: string;
  price: number;
  timestamp: number;
}

const STALE_THRESHOLD_MS = 5000; // считаем цену устаревшей если нет обновлений 5с

async function fetchRestPrice(symbol: string): Promise<number | null> {
  try {
    const r = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
    const d = await r.json();
    return d.price ? parseFloat(d.price) : null;
  } catch {
    return null;
  }
}

export function useBinancePrice(symbol = "BTCUSDT") {
  const [price, setPrice] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const lastWsUpdateRef = useRef<number>(0);

  // Fetch initial price immediately
  useEffect(() => {
    fetchRestPrice(symbol).then((p) => {
      if (p !== null) setPrice(p);
    });
  }, [symbol]);

  // Fallback polling: если WS молчит дольше STALE_THRESHOLD_MS — берём REST
  useEffect(() => {
    const interval = setInterval(async () => {
      const msSinceLastUpdate = Date.now() - lastWsUpdateRef.current;
      if (msSinceLastUpdate > STALE_THRESHOLD_MS) {
        const p = await fetchRestPrice(symbol);
        if (p !== null) setPrice(p);
      }
    }, STALE_THRESHOLD_MS);

    return () => clearInterval(interval);
  }, [symbol]);

  // Real-time updates via Reverb WebSocket
  useEffect(() => {
    const echoInstance = getEcho();

    echoInstance.connector.pusher.connection.bind("connected", () =>
      setConnected(true),
    );
    echoInstance.connector.pusher.connection.bind("disconnected", () =>
      setConnected(false),
    );

    const channel = echoInstance
      .channel("binance.prices")
      .listen(".price.updated", (data: PriceData) => {
        if (data.symbol === symbol) {
          setPrice(data.price);
          setTimestamp(data.timestamp);
          lastWsUpdateRef.current = Date.now();
        }
      });

    return () => {
      channel.stopListening(".price.updated");
    };
  }, [symbol]);

  return { price, timestamp, connected };
}
