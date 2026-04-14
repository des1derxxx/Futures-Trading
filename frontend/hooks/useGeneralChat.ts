"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ChatMessage } from "@/lib/api";
import { getEcho } from "@/lib/echo";

export function useGeneralChat(userId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const subscribedRef = useRef(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.chat.messages();
      setMessages(res.messages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!userId || subscribedRef.current) return;
    subscribedRef.current = true;

    const echoInstance = getEcho();
    const channel = echoInstance
      .private("chat.general")
      .listen(".message.sent", (payload: ChatMessage) => {
        // Дедупликация: не добавляем сообщение, если оно уже в списке (оптимистично добавлено)
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.id)) return prev;
          return [...prev, payload];
        });
      });

    return () => {
      channel.stopListening(".message.sent");
      echoInstance.leave("chat.general");
      subscribedRef.current = false;
    };
  }, [userId]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Оптимистичное добавление: добавляем своё сообщение сразу из ответа API
    const msg = await api.chat.send(trimmed);
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  return { messages, loading, sendMessage };
}
