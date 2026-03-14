"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const starterQuestions = [
  "What is our current security risk?",
  "Which vulnerabilities are most critical?",
  "How can we improve our security score?",
];

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I can answer questions about your current risk score, incidents, compliance posture, vendor risk, and recommended next steps.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const nextUserMessage: ChatMessage = { role: "user", content: trimmed };
    const history = messages.slice(-8);

    setMessages((current) => [...current, nextUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      const payload = (await response.json()) as { reply?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "The AI assistant is unavailable right now.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: payload.reply ?? "No response was returned by the AI assistant.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The AI assistant could not process your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-teal-300/30 bg-gradient-to-br from-teal-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(45,212,191,0.22)] transition hover:scale-[1.02]"
      >
        {isOpen ? "Close assistant" : "AI assistant"}
      </button>

      {isOpen ? (
        <section className="glass-panel fixed bottom-24 right-6 z-40 flex h-[min(42rem,calc(100vh-8rem))] w-[min(26rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-[32px] border border-white/10">
          <div className="border-b border-white/8 px-5 py-4">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-teal-300">
              AI cybersecurity assistant
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Ask about risk, incidents, compliance, or vendors
            </h3>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message, index) => (
              <article
                key={`${message.role}-${index}`}
                className={`max-w-[90%] rounded-[24px] px-4 py-3 text-sm leading-6 ${
                  message.role === "user"
                    ? "ml-auto border border-teal-300/20 bg-teal-300/12 text-teal-50"
                    : "border border-white/8 bg-white/[0.04] text-slate-200"
                }`}
              >
                {message.content}
              </article>
            ))}

            {isLoading ? (
              <div className="max-w-[90%] rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300 [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-teal-300 [animation-delay:240ms]" />
                </span>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/8 px-5 py-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {starterQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:border-teal-300/30 hover:bg-teal-300/10"
                >
                  {question}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(input);
              }}
              className="flex items-end gap-3"
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={3}
                placeholder="Ask about your current cyber posture..."
                className="surface-input min-h-[5.5rem] flex-1 resize-none rounded-2xl px-4 py-3 text-sm text-white"
              />
              <button
                type="submit"
                disabled={isLoading || input.trim().length === 0}
                className="rounded-2xl bg-teal-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Send
              </button>
            </form>
          </div>
        </section>
      ) : null}
    </>
  );
}
