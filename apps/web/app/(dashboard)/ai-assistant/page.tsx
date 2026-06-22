"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send } from "lucide-react";
import { CONFIG } from "@/lib/config";
import { T } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "ai"; text: string };

export default function AIAssistantPage() {
  const { assistant } = CONFIG;
  const [messages, setMessages] = useState<Msg[]>([
    { role: "ai", text: assistant.greeting },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text: string) => {
    if (!text.trim()) return;
    // Ganti balasan AI di sini dengan integrasi LLM API
    const reply = `Anda bertanya: "${text}". Sambungkan ke API LLM untuk respons nyata.`;
    setMessages((m) => [...m, { role: "user", text }, { role: "ai", text: reply }]);
    setInput("");
  };

  return (
    <div className="bg-card border border-border relative overflow-hidden rounded-[var(--radius)] flex flex-col" style={{ height: "calc(100vh - 180px)" }}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div
          className="w-8 h-8 flex items-center justify-center border rounded-sm"
          style={{ borderColor: `${T.info}40`, background: `${T.info}12` }}
        >
          <MessageSquare size={14} style={{ color: T.info }} />
        </div>
        <div>
          <p className="font-mono font-bold text-foreground text-sm">{assistant.name}</p>
          <p className="font-mono text-[10px] text-muted-foreground">Siap membantu</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
            <div
              className="w-7 h-7 flex-shrink-0 flex items-center justify-center border font-mono text-[9px] font-bold rounded-sm"
              style={
                m.role === "ai"
                  ? { borderColor: `${T.info}40`, background: `${T.info}12`, color: T.info }
                  : { borderColor: `${T.primary}40`, background: `${T.primary}12`, color: T.primary }
              }
            >
              {m.role === "ai" ? "AI" : "U"}
            </div>
            <div
              className="max-w-[80%] p-3 border text-xs font-sans leading-relaxed rounded-sm"
              style={
                m.role === "ai"
                  ? { borderColor: "var(--border)", background: "var(--secondary)" }
                  : { borderColor: `${T.primary}25`, background: `${T.primary}08` }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {assistant.quickPrompts.map((q) => (
          <button
            key={q}
            onClick={() => send(q)}
            className="font-mono text-[10px] border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors rounded-sm"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border flex gap-2">
        <input
          className="flex-1 bg-secondary border border-border px-4 py-2.5 font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 rounded-sm"
          placeholder="Ketik pertanyaan..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
        />
        <button
          onClick={() => send(input)}
          className="px-4 py-2.5 flex items-center gap-2 font-mono text-xs rounded-sm transition-opacity hover:opacity-90"
          style={{ background: T.info, color: "#fff" }}
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
