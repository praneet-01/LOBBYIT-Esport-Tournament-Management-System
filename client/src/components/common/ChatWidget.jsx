import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Send, X } from "lucide-react";
import api from "../../services/api";

const QUICK_QUESTIONS = [
  "How do I register my team?",
  "How do I join the match room?",
  "Which tournaments are open?",
];

const INITIAL_MESSAGE = {
  role: "assistant",
  content:
    "Namaste! I am Kriti, the KRĪḌ ITAM assistant. Ask me about tournaments, registration or match rooms.",
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  async function sendMessage(text = input) {
    const content = text.trim();

    if (!content || isLoading) return;

    const updatedMessages = [...messages, { role: "user", content }];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setIsLoading(true);

    try {
      // Send the latest 10 messages to the backend.
      const payload = updatedMessages.slice(-10).map(({ role, content }) => ({
        role,
        content: content.slice(0, 1000),
      }));

      const response = await api.post("/assistant", {
        messages: payload,
      });

      const reply = response.data?.reply;

      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("The assistant returned an empty response.");
      }

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: reply.trim(),
        },
      ]);
    } catch (err) {
      console.error("Kriti assistant request failed:", err);

      setError(
        err.response?.data?.message ||
          "I couldn't connect right now. Please try again.",
      );
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <>
      {/* Floating assistant button */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={handleKeyDown}
        aria-label={isOpen ? "Close Kriti assistant" : "Open Kriti assistant"}
        aria-expanded={isOpen}
        className="fixed bottom-5 right-5 z-[1000] flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        {isOpen ? <X size={25} /> : <MessageCircle size={26} />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <section
          role="dialog"
          aria-label="Kriti AI Assistant"
          className="fixed bottom-24 right-4 z-[1000] flex h-[min(600px,calc(100dvh-8rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        >
          {/* Header: intentionally uses no new logo */}
          <header className="flex items-center justify-between gap-3 bg-indigo-600 px-4 py-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Bot size={23} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-base font-semibold">
                  Kriti Assistant
                </h2>
                <p className="text-xs text-indigo-100">KRĪḌ ITAM support</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-2 transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white"
            >
              <X size={20} />
            </button>
          </header>

          {/* Messages */}
          <div
            className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-md bg-indigo-600 text-white"
                      : "rounded-bl-md border border-gray-200 bg-white text-gray-800 shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm"
                  role="status"
                >
                  Kriti is thinking…
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() =>
                    sendMessage(messages[messages.length - 1]?.content)
                  }
                  disabled={
                    isLoading || messages[messages.length - 1]?.role !== "user"
                  }
                  className="mt-2 font-semibold underline disabled:opacity-50"
                >
                  Try again
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length === 1 && (
            <div className="space-y-2 border-t border-gray-100 bg-white px-3 py-3">
              <p className="text-xs font-medium text-gray-500">
                Suggested questions
              </p>

              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => sendMessage(question)}
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 border-t border-gray-200 bg-white p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Kriti something..."
              aria-label="Message Kriti"
              maxLength={1000}
              disabled={isLoading}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
            />

            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || isLoading}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
