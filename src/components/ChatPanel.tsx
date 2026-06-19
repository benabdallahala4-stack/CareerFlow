"use client";

import { useState } from "react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPanel() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next }),
    });
    const data = await res.json();
    setMessages([...next, { role: "assistant", content: data.text }]);
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3">
        {messages.length === 0 && (
          <p className="text-sm text-zinc-400">
            Ask anything about your job search. Add an AI key in Settings for smart answers.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user"
                ? "self-end bg-indigo-600 text-white"
                : "self-start bg-zinc-100 text-zinc-800"
            }`}
          >
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2 border-t border-zinc-100 pt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
