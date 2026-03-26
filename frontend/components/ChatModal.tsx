"use client";
import { useState, useRef, useEffect } from "react";
import { Modal, Input, Button, Loader } from "@mantine/core";
import { Send } from "@deemlol/next-icons";

interface Message {
  id: number;
  text: string;
  sender: "user" | "ai";
}

interface ChatModalProps {
  opened: boolean;
  onClose: () => void;
}

const CHAT_API_URL = "/api/chat";

const ChatModal = ({ opened, onClose }: ChatModalProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now(), text, sender: "user" };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const chatMessages = newMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      }));

      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const aiText = data.message?.content || "Нет ответа";

      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: aiText, sender: "ai" },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: "Ошибка подключения к Ollama. Убедитесь что Ollama запущена (ollama serve).",
          sender: "ai",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="AI Trading Analyst"
      size="lg"
      centered
      styles={{
        header: {
          background: "#0d1420",
          borderBottom: "1px solid rgba(63,63,70,0.4)",
        },
        title: {
          color: "#fff",
          fontWeight: 700,
        },
        body: {
          background: "#0d1420",
          padding: 0,
        },
        content: {
          background: "#0d1420",
          border: "1px solid rgba(63,63,70,0.4)",
          borderRadius: 12,
        },
        close: {
          color: "#a1a1aa",
        },
        overlay: {
          backdropFilter: "blur(4px)",
        },
      }}
    >
      <div className="flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
              Напишите сообщение, чтобы начать диалог
            </div>
          )}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-lime-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-200 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                <Loader size="xs" color="lime" type="dots" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-zinc-800/60 p-3 flex gap-3">
          <Input
            placeholder="Введите сообщение..."
            value={input}
            onChange={(e) => setInput(e.currentTarget.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
            disabled={loading}
            styles={{
              input: {
                background: "#080d14",
                border: "1px solid rgba(63,63,70,0.4)",
                color: "#fff",
              },
            }}
          />
          <Button
            variant="outline"
            color="lime"
            size="md"
            onClick={handleSend}
            loading={loading}
          >
            <Send />
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ChatModal;
