import { NextRequest, NextResponse } from "next/server";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const OLLAMA_MODEL = "qwen3:4b";

interface Kline {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

interface TimeframeConfig {
  interval: string;
  limit: number;
  label: string;
}

function parseTimeframe(messages: { role: string; content: string }[]): TimeframeConfig {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content.toLowerCase() || "";

  // Match patterns like "за 1 день", "за 30 минут", "за 2 недели", "1h", "4h", "1d", "1w"
  const ruMatch = lastUserMsg.match(
    /за\s+(\d+)\s*(минут[уы]?|мин|час[аов]*|дн[яей]*|день|недел[юиь]|месяц[аев]*)/
  );
  const enMatch = lastUserMsg.match(/(\d+)\s*(m|min|h|hour|d|day|w|week)/i);

  let totalMinutes = 240; // default 4h

  if (ruMatch) {
    const n = parseInt(ruMatch[1]);
    const unit = ruMatch[2];
    if (/мин/.test(unit)) totalMinutes = n;
    else if (/час/.test(unit)) totalMinutes = n * 60;
    else if (/д|день/.test(unit)) totalMinutes = n * 1440;
    else if (/недел/.test(unit)) totalMinutes = n * 10080;
    else if (/месяц/.test(unit)) totalMinutes = n * 43200;
  } else if (enMatch) {
    const n = parseInt(enMatch[1]);
    const unit = enMatch[2].toLowerCase();
    if (unit.startsWith("m")) totalMinutes = n;
    else if (unit.startsWith("h")) totalMinutes = n * 60;
    else if (unit.startsWith("d")) totalMinutes = n * 1440;
    else if (unit.startsWith("w")) totalMinutes = n * 10080;
  }

  // Pick candle interval to get ~20-50 candles
  if (totalMinutes <= 60) return { interval: "1m", limit: totalMinutes, label: `${totalMinutes}m (1m candles)` };
  if (totalMinutes <= 240) return { interval: "5m", limit: Math.ceil(totalMinutes / 5), label: `${totalMinutes / 60}h (5m candles)` };
  if (totalMinutes <= 720) return { interval: "15m", limit: Math.ceil(totalMinutes / 15), label: `${totalMinutes / 60}h (15m candles)` };
  if (totalMinutes <= 2880) return { interval: "1h", limit: Math.ceil(totalMinutes / 60), label: `${totalMinutes / 60}h (1h candles)` };
  if (totalMinutes <= 14400) return { interval: "4h", limit: Math.ceil(totalMinutes / 240), label: `${totalMinutes / 1440}d (4h candles)` };
  return { interval: "1d", limit: Math.ceil(totalMinutes / 1440), label: `${Math.ceil(totalMinutes / 1440)}d (1d candles)` };
}

async function fetchBinanceKlines(interval: string, limit: number): Promise<Kline[]> {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`
    );
    const data = await res.json();
    type BinanceKlineRaw = [number, string, string, string, string, string, ...unknown[]];
    return (data as BinanceKlineRaw[]).map((k) => ({
      time: new Date(k[0]).toISOString().slice(0, 16).replace("T", " "),
      open: parseFloat(k[1]).toFixed(2),
      high: parseFloat(k[2]).toFixed(2),
      low: parseFloat(k[3]).toFixed(2),
      close: parseFloat(k[4]).toFixed(2),
      volume: parseFloat(k[5]).toFixed(2),
    }));
  } catch {
    return [];
  }
}

async function fetchCurrentPrice(): Promise<string | null> {
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"
    );
    const data = await res.json();
    return [
      `Price: $${parseFloat(data.lastPrice).toFixed(2)}`,
      `24h Change: ${data.priceChangePercent}%`,
      `24h High: $${parseFloat(data.highPrice).toFixed(2)}`,
      `24h Low: $${parseFloat(data.lowPrice).toFixed(2)}`,
      `24h Volume: ${parseFloat(data.volume).toFixed(2)} BTC`,
    ].join("\n");
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const tfConfig = parseTimeframe(messages);

    const [klines, ticker] = await Promise.all([
      fetchBinanceKlines(tfConfig.interval, tfConfig.limit),
      fetchCurrentPrice(),
    ]);

    let marketContext = "=== LIVE MARKET DATA (BTCUSDT) ===\n\n";
    if (ticker) marketContext += ticker + "\n\n";

    if (klines.length > 0) {
      marketContext += `Candle data — ${tfConfig.label}:\n`;
      marketContext += "Time             | Open     | High     | Low      | Close    | Volume\n";
      for (const k of klines) {
        marketContext += `${k.time} | $${k.open} | $${k.high} | $${k.low} | $${k.close} | ${k.volume}\n`;
      }
    }

    const systemPrompt = `You are a professional crypto trading analyst assistant. You have access to real-time market data which is provided below. Use this data to give informed analysis.

${marketContext}

Rules:
- Analyze the candle data to identify trends, patterns, support/resistance
- Be concise and actionable in your analysis
- Mention specific price levels from the data
- Respond in the same language the user writes in
- The user can request any timeframe (e.g. "за 1 час", "за 2 дня", "за неделю", "1h", "1d")
- If no timeframe specified, you have the default last 4 hours of data`;

    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ollama returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json({ message: data.message });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to Ollama" },
      { status: 502 }
    );
  }
}
