import { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import toast from "react-hot-toast";
import { FaPlus, FaFilePdf, FaPaperPlane } from "react-icons/fa";
import { API_BASE_URL } from "../constants/api";

function Chatbot() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]); // [{documentId, documentName}]
  const [selectedDocs, setSelectedDocs] = useState([]);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const [pendingUserMessage, setPendingUserMessage] = useState(null);
  const [pendingBot, setPendingBot] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch chat history and document list on mount
  useEffect(() => {
    if (!user) return;
    fetchHistory();
    // eslint-disable-next-line
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/history/${user.uid}`);
      const data = await res.json();
      setHistory(data.messages || []);
    } catch {
      setHistory([]);
    }
    setHistoryLoading(false);
  };

  // Scroll to bottom when history or pendingUserMessage changes and not loading
  useEffect(() => {
    if (historyLoading) return;
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [history, pendingUserMessage, historyLoading]);

  // When documents change, always select all by default
  useEffect(() => {
    setSelectedDocs(documents.map(doc => doc.documentId));
  }, [documents]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() || !user || pendingBot) return;
    setPendingUserMessage({
      timestamp: new Date().toISOString(),
      userMessage: message,
    });
    setPendingBot(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/send-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          message,
          documentIds: selectedDocs
        }),
      });
      const data = await res.json();
      setHistory((prev) => [
        ...prev,
        {
          timestamp: data.timestamp || new Date().toISOString(),
          userMessage: message,
          botResponse: data.response,
        },
      ]);
    } catch {
      toast.error("Failed to send message");
    }
    setPendingUserMessage(null);
    setPendingBot(false);
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("userId", user.uid);
    formData.append("documentName", file.name);
    formData.append("pdfFile", file);
    try {
      const res = await fetch(`${API_BASE_URL}/chatbot/process-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.documentId) {
        setDocuments((prev) => [...prev, { documentId: data.documentId, documentName: file.name }]);
        toast.success("PDF processed and ready for RAG!");
      } else {
        toast.error("Failed to process PDF");
      }
    } catch {
      toast.error("Failed to upload PDF");
    }
    setUploading(false);
  };

  const handleClearHistory = async () => {
    if (!user) return;
    try {
      await fetch(`${API_BASE_URL}/chatbot/history/${user.uid}`, { method: "DELETE" });
      setHistory([]);
      toast.success("Chat history cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  // Modern GenZ name for the bot
  const botName = "chatbot";

  return (
    <div className="w-full min-h-screen py-8 px-0 bg-gradient-to-br from-[#0f172a] via-[#18182f] to-[#1e293b] relative">
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#0f172a] via-[#18182f] to-[#1e293b] animate-gradient-x opacity-80" />
      </div>
      <div className="relative z-10 max-w-full mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between mb-4 px-4">
          <p className="text-cyan-200 text-sm mb-2 text-left md:mb-0">
            Ask questions or chat with your uploaded PDFs.
          </p>
          <button
            onClick={handleClearHistory}
            className="text-xs font-semibold px-4 py-2 rounded bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-800 hover:to-blue-800 text-cyan-100 shadow transition"
            disabled={loading}
          >
            Clear Chat History
          </button>
        </div>
        <div
          className="bg-[#18182f]/90 rounded-xl border border-cyan-500/20 p-0 mb-6 min-h-[400px] max-h-[60vh] overflow-y-auto shadow-xl transition-all duration-300 w-full scrollbar-hide"
          ref={chatContainerRef}
        >
          <div className="flex flex-col gap-2 py-6 px-2 md:px-8">
            {historyLoading ? (
              <div className="flex justify-center items-center h-32">
                <span className="bubble-loader">
                  <span className="bubble-dot"></span>
                  <span className="bubble-dot"></span>
                  <span className="bubble-dot"></span>
                </span>
              </div>
            ) : history.length === 0 && !pendingUserMessage ? (
              <div className="text-gray-400 text-center animate-fade-in">No chat history yet.</div>
            ) : (
              <>
                {history.map((msg, idx) => (
                  <div key={idx} className="mb-2 animate-fade-in flex flex-col gap-1">
                    {/* User message right */}
                    <div className="flex items-end justify-end gap-2">
                      <div className="flex-1 max-w-[80%] flex flex-col items-end">
                        <div className="bg-cyan-900/40 rounded-lg p-3 mt-1 text-white shadow text-right relative">
                          {msg.userMessage}
                          <div className="text-xs text-cyan-200 mt-2 text-left opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Bot message left */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 max-w-[80%]">
                        <div className="bg-blue-900/30 rounded-lg p-3 mt-1 text-blue-100 shadow relative">
                          <ChatbotFormattedText text={msg.botResponse} />
                          <div className="text-xs text-cyan-300 mt-2 text-right opacity-70">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Pending user message and bot loading */}
                {pendingUserMessage && (
                  <div className="mb-2 animate-fade-in flex flex-col gap-1">
                    {/* User message right */}
                    <div className="flex items-end justify-end gap-2">
                      <div className="flex-1 max-w-[80%] flex flex-col items-end">
                        <div className="bg-cyan-900/40 rounded-lg p-3 mt-1 text-white shadow text-right relative">
                          {pendingUserMessage.userMessage}
                          <div className="text-xs text-cyan-200 mt-2 text-left opacity-70">
                            {new Date(pendingUserMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Bot bubble loading left */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 max-w-[80%]">
                        <div className="bg-blue-900/30 rounded-lg p-3 mt-1 text-blue-100 shadow relative flex items-center min-h-[32px]">
                          <span className="bubble-loader">
                            <span className="bubble-dot"></span>
                            <span className="bubble-dot"></span>
                            <span className="bubble-dot"></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 px-4 mb-2">
          {documents.length > 0 && documents.map(doc => (
            <div
              key={doc.documentId}
              className="flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-900/30 border border-cyan-500/30 text-cyan-200 text-sm font-medium animate-fade-in"
            >
              <FaFilePdf className="text-cyan-400" />
              <span className="truncate max-w-[120px]">{doc.documentName}</span>
              <span className="ml-1 text-xs bg-cyan-700/30 px-2 py-0.5 rounded text-cyan-300">Selected</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="flex gap-2 mb-4 items-center px-4 max-w-3xl mx-auto">
          {/* Add PDF button on the left */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-cyan-700 hover:bg-cyan-800 transition text-white shadow-lg focus:outline-none disabled:opacity-60"
            title="Upload PDF"
            tabIndex={-1}
          >
            {uploading ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaPlus className="h-5 w-5" />
            )}
          </button>
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            disabled={uploading}
            onChange={handleUploadPdf}
          />
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={`Message chatbot...`}
            className="flex-1 p-3 rounded-lg border border-cyan-500 bg-[#1e293b] text-white focus:outline-none shadow"
            disabled={loading || pendingBot}
          />
          <button
            type="submit"
            disabled={loading || !message.trim() || pendingBot}
            className="flex items-center justify-center w-11 h-11 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold shadow-lg transition disabled:opacity-50"
            title="Send"
          >
            {(loading || pendingBot) ? (
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <FaPaperPlane className="h-5 w-5" />
            )}
          </button>
        </form>
      </div>
      {/* Animations */}
      <style>{`
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease-in-out infinite;
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-fade-in {
          animation: fadeIn 0.7s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px);}
          to { opacity: 1; transform: none;}
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .bubble-loader {
          display: flex;
          gap: 0.3em;
          align-items: center;
          height: 1.5em;
        }
        .bubble-dot {
          width: 0.5em;
          height: 0.5em;
          background: #67e8f9;
          border-radius: 50%;
          display: inline-block;
          animation: bubble-bounce 1s infinite alternate;
        }
        .bubble-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .bubble-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes bubble-bounce {
          from { transform: translateY(0);}
          to { transform: translateY(-0.5em);}
        }
      `}</style>
    </div>
  );
}

function ChatbotFormattedText({ text }) {
  if (!text) return null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  let paragraphs = text.split(/\n\s*\n/);

  const formattedParagraphs = paragraphs.map((para, idx) => {
    let p = escapeHtml(para);

    p = p.replace(/^(\s*#+\s*)(.+)$/gm, (match, hashes, content) => {
      const level = Math.min(hashes.trim().length, 4);
      return `<h${level} class="text-cyan-200 font-bold mt-4 mb-2 text-lg">${content.trim()}</h${level}>`;
    });

    p = p.replace(/\*\*([^\*]+)\*\*/g, `<strong class="text-cyan-100 font-semibold">$1</strong>`);
    p = p.replace(/\*([^\*]+)\*/g, `<em class="text-cyan-300 italic">$1</em>`);
    p = p.replace(/`([^`]+)`/g, `<code class="bg-[#23234a] text-cyan-300 rounded px-1">$1</code>`);
    p = p.replace(/```([^`]+)```/g, `<pre class="bg-[#23234a] text-cyan-300 rounded p-2"><code>$1</code></pre>`);
    p = p.replace(/^\s*[-*]\s+(.+)$/gm, `<li class="text-cyan-100 ml-4 list-disc">$1</li>`);

    return `<p class="text-cyan-100 mb-4">${p}</p>`;
  });

  return <div dangerouslySetInnerHTML={{ __html: formattedParagraphs.join("") }} />;
}

export default Chatbot;
