"use client";
import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I've loaded your PDFs. Ask me anything!" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!input.trim() || isLoading) return;

  const userMsg = input.trim();
  setMessages(prev => [...prev, { role: "user", content: userMsg }]);
  setInput("");
  setIsLoading(true);

  try {
    const res = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: userMsg }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // THIS IS THE FIX: Extract only the real answer text
    let answerText = "";

    if (typeof data.answer === "string") {
      answerText = data.answer;
    }
    // LangChain AIMessage object
    else if (data.answer?.kwargs?.content) {
      answerText = data.answer.kwargs.content;
    }
    // LangChain new format
    else if (data.answer?.content) {
      answerText = data.answer.content;
    }
    // Fallback
    else {
      answerText = "I got a response but couldn't read it.";
    }

    setMessages(prev => [...prev, {
      role: "assistant",
      content: answerText,
      sources: data.sources
    }]);

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Connection failed";
    setMessages(prev => [...prev, {
      role: "assistant",
      content: `Error: ${errorMessage}`
    }]);
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-bold">PDF Chat Assistant</h1>
          <div className="bg-white/20 px-4 py-2 rounded-full text-sm">
            Ready to answer
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-3xl rounded-3xl px-6 py-4 shadow-md ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                <p className="whitespace-pre-wrap text-lg leading-relaxed">
                  {msg.content}
                </p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-300/50 text-sm opacity-90">
                    <strong>Sources:</strong> {msg.sources.join(" • ")}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-3xl px-6 py-4 shadow-md">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

           {/* Input */}
      <div className="border-t bg-white shadow-2xl">
        <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your PDFs..."
              className="
                flex-1 px-6 py-4 text-lg
                bg-gray-50 border-2 border-gray-300
                rounded-full
                focus:outline-none focus:border-blue-500
                focus:ring-4 focus:ring-blue-500/20
                shadow-inner
                text-gray-800 placeholder-gray-500
              "
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="
                px-10 py-4
                bg-gradient-to-r from-blue-600 to-purple-600
                text-white font-bold text-lg
                rounded-full
                shadow-lg hover:shadow-2xl
                transform hover:scale-105 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              "
            >
              {isLoading ? "Thinking..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
