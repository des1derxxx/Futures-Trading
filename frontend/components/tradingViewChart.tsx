"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: object) => void;
    };
  }
}

interface TradingViewChartProps {
  ticket: string | null;
}

let scriptLoaded = false;
let scriptLoading = false;
const onLoadCallbacks: Array<() => void> = [];

function loadTradingViewScript(onLoad: () => void) {
  if (scriptLoaded) { onLoad(); return; }
  onLoadCallbacks.push(onLoad);
  if (scriptLoading) return;
  scriptLoading = true;
  const s = document.createElement("script");
  s.src = "https://s3.tradingview.com/tv.js";
  s.async = true;
  s.onload = () => {
    scriptLoaded = true;
    onLoadCallbacks.forEach((cb) => cb());
    onLoadCallbacks.length = 0;
  };
  document.head.appendChild(s);
}

const TradingViewChart = ({ ticket }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ticket || !containerRef.current) return;

    // Clear previous widget
    containerRef.current.innerHTML = "";
    const inner = document.createElement("div");
    inner.id = "tv_widget_" + ticket;
    inner.style.width = "100%";
    inner.style.height = "100%";
    containerRef.current.appendChild(inner);

    loadTradingViewScript(() => {
      if (!window.TradingView || !containerRef.current) return;
      new window.TradingView.widget({
        container_id: inner.id,
        autosize: true,
        symbol: ticket,
        interval: "1D",
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",
        locale: "ru",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        studies: ["STD;RSI"],
      });
    });
  }, [ticket]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
};

export default TradingViewChart;
