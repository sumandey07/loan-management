import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! How can I help with your mortgage loan today?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(true);

  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const searchWeb = async (query) => {
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
      query,
    )}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;

    try {
      const res = await fetch(searchUrl, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) return [];

      const data = await res.json();
      const results = [];

      if (data?.AbstractText) {
        results.push(`${data.AbstractSource || "DuckDuckGo"}: ${data.AbstractText}`);
      }

      const topics = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
      topics.forEach((topic) => {
        if (topic?.Text) results.push(topic.Text);
        if (Array.isArray(topic?.Topics)) {
          topic.Topics.forEach((nestedTopic) => {
            if (nestedTopic?.Text) results.push(nestedTopic.Text);
          });
        }
      });

      return results.slice(0, 5);
    } catch (error) {
      console.error("Web search failed:", error);
      return [];
    }
  };

  async function sendMessage() {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    const userMessage = { sender: "user", text: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const webSearchResults = useWebSearch ? await searchWeb(trimmedInput) : [];

      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.text,
          web_search_results: webSearchResults,
        }),
      });

      const data = await res.json();
      const responseText =
        typeof data.response === "string"
          ? data.response
          : data.response?.[0]?.text || "Sorry, I could not process that.";

      const botMessage = {
        sender: "bot",
        text: responseText,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Unable to connect to the server." },
      ]);
    }

    setLoading(false);
  }

  const handleKey = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-sky-700 p-4 rounded-full shadow-xl hover:bg-sky-800 transition z-50">
          <ChatBubbleLeftRightIcon className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-6 right-6 w-100 h-[480px] bg-white rounded-lg shadow-2xl border z-50 flex flex-col animate-fadeIn">
          {/* Header */}
          <div className="bg-sky-700 p-4 flex justify-between items-center rounded-t-lg">
            <span className="text-white font-semibold">AI Loan Assistant</span>
            <button onClick={() => setOpen(false)}>
              <XMarkIcon className="text-white w-6 h-6" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex my-2 ${msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}>
                <div
                  className={`px-4 py-2 max-w-[75%] rounded-md shadow text-sm ${msg.sender === "user"
                      ? "bg-sky-700 text-white rounded-br-none"
                      : "bg-white text-gray-800 border rounded-bl-none"
                    }`}>
                  {msg.sender === "bot" ? (
                    <ReactMarkdown
                      components={{
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">
                            {children}
                          </strong>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1 mt-1">
                            {children}
                          </ol>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1 mt-1">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="ml-2">{children}</li>
                        ),
                        p: ({ children }) => (
                          <p className="mb-1 last:mb-0">{children}</p>
                        ),
                      }}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    // Plain text for user messages
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {loading && <p className="text-sm text-gray-400 px-1">Typing...</p>}

            <div ref={bottomRef}></div>
          </div>

          {/* Input Box */}
          <div className="p-3 border-t text-black flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setUseWebSearch((prev) => !prev)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${useWebSearch
                    ? "border-sky-600 bg-sky-100 text-sky-700"
                    : "border-slate-300 bg-white text-slate-600"
                  }`}>
                {useWebSearch ? "Web search on" : "Web search off"}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask something..."
                className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                onClick={sendMessage}
                className="bg-sky-700 text-white px-4 rounded-md hover:bg-sky-800">
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
