"use client";

import { useEffect, useRef, useState } from "react";
import { useGeneralChat } from "@/hooks/useGeneralChat";
import { useGetMeQuery } from "@/lib/apiSlice";

export default function ChatPage() {
  const { data: me } = useGetMeQuery();
  const { messages, loading, sendMessage } = useGeneralChat(me?.id ?? null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  }

  const grouped: { date: string; items: typeof messages }[] = [];
  for (const msg of messages) {
    const date = formatDate(msg.created_at);
    const last = grouped[grouped.length - 1];
    if (last && last.date === date) {
      last.items.push(msg);
    } else {
      grouped.push({ date, items: [msg] });
    }
  }

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto w-full px-4 py-4">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-white">Общий чат</h1>
        <p className="text-xs text-zinc-500">Общайтесь с другими трейдерами</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-4 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-zinc-500 text-sm">Загрузка...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-zinc-500 text-sm">
              Будьте первым, кто напишет сообщение
            </span>
          </div>
        ) : (
          grouped.map(({ date, items }) => (
            <div key={date}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-600">{date}</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <div className="space-y-3">
                {items.map((msg) => {
                  const isOwn = msg.user_id === me?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1"
                        style={{
                          background: `hsl(${(msg.user_id * 47) % 360}, 60%, 35%)`,
                        }}
                      >
                        {msg.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div
                        className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}
                      >
                        {!isOwn && (
                          <span className="text-xs text-zinc-500 mb-1 px-1">
                            {msg.user_name}
                          </span>
                        )}
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm wrap-break-word ${
                            isOwn
                              ? "bg-lime-600/20 text-lime-100 rounded-tr-sm border border-lime-700/30"
                              : "bg-zinc-800 text-zinc-100 rounded-tl-sm border border-zinc-700/40"
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-[10px] text-zinc-600 mt-1 px-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение... (Enter для отправки)"
          disabled={!me || sending}
          rows={1}
          className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 resize-none focus:outline-none focus:border-lime-600/60 transition-colors disabled:opacity-50"
          style={{ maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || !me || sending}
          className="px-4 py-3 bg-lime-600/20 border border-lime-700/40 text-lime-400 rounded-xl text-sm font-medium hover:bg-lime-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
