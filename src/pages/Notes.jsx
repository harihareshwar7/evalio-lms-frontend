import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";
import { API_BASE_URL } from "../constants/api";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import { useNavigate, useLocation } from "react-router-dom";

function Notes() {
  const [topic, setTopic] = useState("");
  const [noteLength, setNoteLength] = useState("medium");
  const [focus, setFocus] = useState("comprehensive");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState([]);
  const [runningIndex, setRunningIndex] = useState(null);
  const [runResults, setRunResults] = useState({});
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [viewingNotes, setViewingNotes] = useState(null);
  const [viewingNotesLoading, setViewingNotesLoading] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Add states for dropdown visibility
  const [isNoteLengthOpen, setIsNoteLengthOpen] = useState(false);
  const [isFocusOpen, setIsFocusOpen] = useState(false);

  // Add refs for handling outside clicks
  const noteLengthRef = useRef(null);
  const focusRef = useRef(null);

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If navigated with notes content, display directly
    if (
      location.state &&
      location.state.notes &&
      Array.isArray(location.state.notes)
    ) {
      setViewingNotes({
        notes: location.state.notes,
        topic: location.state.topic || "",
      });
      setViewingNotesLoading(false);
      return;
    }
    // If navigated with url (legacy), fetch and render them
    if (
      location.state &&
      location.state.url &&
      !location.state.notes
    ) {
      const { url, topic } = location.state;
      setViewingNotesLoading(true);
      setViewingNotes(null);
      setRunResults({});
      fetch(`${API_BASE_URL}/notes/json-from-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setViewingNotes({ notes: data, topic });
          }
        })
        .catch(() => {
          toast.error("Failed to load notes. Please try again.");
        })
        .finally(() => setViewingNotesLoading(false));
    }
    // eslint-disable-next-line
  }, [location.state]);

  // Handle outside clicks for Note Length dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (noteLengthRef.current && !noteLengthRef.current.contains(event.target)) {
        setIsNoteLengthOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle outside clicks for Focus Area dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (focusRef.current && !focusRef.current.contains(event.target)) {
        setIsFocusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers for keyboard navigation
  const handleNoteLengthKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsNoteLengthOpen(false);
    } else if (e.key === "ArrowDown" && !isNoteLengthOpen) {
      setIsNoteLengthOpen(true);
    }
  };

  const handleFocusKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsFocusOpen(false);
    } else if (e.key === "ArrowDown" && !isFocusOpen) {
      setIsFocusOpen(true);
    }
  };

  // Option selection handlers
  const selectNoteLength = (value) => {
    setNoteLength(value);
    setIsNoteLengthOpen(false);
  };

  const selectFocus = (value) => {
    setFocus(value);
    setIsFocusOpen(false);
  };

  // Maps for display labels
  const noteLengthLabels = {
    "short": "Short Summary",
    "medium": "Medium Length",
    "detailed": "Detailed Explanation"
  };

  const focusLabels = {
    "comprehensive": "Comprehensive Overview",
    "key-concepts": "Key Concepts",
    "examples": "Examples & Applications",
    "facts": "Facts & Figures"
  };

  // Available options
  const noteLengthOptions = ["short", "medium", "detailed"];
  const focusOptions = ["comprehensive", "key-concepts", "examples", "facts"];

  // Helper to detect language from code (simple heuristic)
  const detectLanguage = (code) => {
    if (/^\s*#include\b/m.test(code) || /\bprintf\s*\(/.test(code)) return "cpp";
    if (/^\s*def\b/.test(code) || /\blambda\b/.test(code) || /\bprint\b/.test(code)) return "python";
    if (/^\s*function\b/.test(code) || /\bconsole\.log\b/.test(code)) return "javascript";
    if (/^\s*public\s+class\b/.test(code)) return "java";
    return "plaintext";
  };

  // Map detected language to Piston API language and version
  const mapToPistonLang = (lang) => {
    if (lang === "python") return { language: "python", version: "3.10.0", filename: "main.py" };
    if (lang === "cpp") return { language: "cpp", version: "10.2.0", filename: "main.cpp" };
    if (lang === "javascript") return { language: "javascript", version: "16.3.0", filename: "main.js" };
    if (lang === "java") return { language: "java", version: "15.0.2", filename: "Main.java" };
    return null;
  };

  // Run code using Piston API
  const handleRunCode = async (code, index) => {
    setRunningIndex(index);
    setRunResults((prev) => ({ ...prev, [index]: { status: "running", output: "" } }));

    const detected = detectLanguage(code);
    const langInfo = mapToPistonLang(detected);

    if (!langInfo) {
      setRunResults((prev) => ({
        ...prev,
        [index]: { status: "error", output: "Language not supported for execution." },
      }));
      setRunningIndex(null);
      return;
    }

    try {
      const res = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: langInfo.language,
          version: langInfo.version,
          files: [{ name: langInfo.filename, content: code }],
        }),
      });
      const result = await res.json();

      setRunResults((prev) => ({
        ...prev,
        [index]: {
          status: result.run?.stderr ? "error" : "success",
          output:
            result.run?.stderr?.trim()
              ? result.run.stderr
              : result.run?.output?.trim()
              ? result.run.output
              : "No output.",
        },
      }));
    } catch (err) {
      setRunResults((prev) => ({
        ...prev,
        [index]: { status: "error", output: "Execution failed." },
      }));
    }
    setRunningIndex(null);
  };

  const handleGenerateNotes = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setPdfUrl(null);
    setIsSaved(false); // Reset saved state when generating new notes
    setGeneratedNotes([]); // Clear previous notes immediately
    setRunResults({}); // Clear previous run results
    setViewingNotes(null); // Hide any viewed notes from history
    setViewingNotesLoading(false);
    try {
      const response = await fetch(`${API_BASE_URL}/notes/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, focus, noteLength }),
      });
      if (!response.ok) throw new Error("Failed to fetch notes from the backend API");
      const notes = await response.json();
      if (!Array.isArray(notes)) throw new Error("Invalid response structure from the backend API");
      setGeneratedNotes(notes);
      toast.success("Notes generated successfully!");
    } catch (error) {
      console.error("Error generating notes:", error);
      toast.error("Failed to generate notes. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsPdf = async () => {
    if (!generatedNotes.length || !user) {
      toast.error("No notes to save or user not logged in.");
      return;
    }
    setIsSavingPdf(true);
    try {
      const response = await fetch(`${API_BASE_URL}/notes/make-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: generatedNotes,
          topic,
          username: user.displayName || user.email || "user",
        }),
      });
      if (!response.ok) throw new Error("Failed to save notes as PDF");
      const data = await response.json();
      setPdfUrl(data.url);

      // Immediately save to firebase
      const saveDbRes = await fetch(`${API_BASE_URL}/notes/save-db`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          pdfUrl: data.url,
          userId: user.uid,
        }),
      });
      if (!saveDbRes.ok) throw new Error("Failed to save PDF URL to database");
      setIsSaved(true);
      toast.success("Notes saved as PDF and stored!");
    } catch (error) {
      console.error("Error saving notes as PDF:", error);
      toast.error("Failed to save notes as PDF.");
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleCreateQuizFromNotes = async () => {
    if (!generatedNotes.length) {
      toast.error("Generate notes first to create a quiz.");
      return;
    }
    setIsGeneratingQuiz(true);
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/generate-from-notes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: generatedNotes }),
      });
      if (!response.ok) throw new Error("Failed to generate quiz from notes");
      const quizQuestions = await response.json();
      if (!Array.isArray(quizQuestions)) throw new Error("Invalid quiz response");
      navigate("/quiz", {
        state: {
          quizData: {
            questions: quizQuestions,
            title: `Quiz from Notes: ${topic}`,
            description: `Test your knowledge of ${topic} with this quiz generated from your notes.`,
          },
          fromNotes: true,
        },
      });
    } catch (error) {
      console.error("Error generating quiz from notes:", error);
      toast.error("Failed to generate quiz from notes.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-300 mb-4">AI Study Notes ✍️</h1>
        <p className="text-gray-400">Generate comprehensive notes and summaries on any topic</p>
      </div>

      <div className="bg-gray-800/80 p-8 rounded-xl shadow-lg border border-green-500/30 backdrop-blur-sm">
        <form onSubmit={handleGenerateNotes} className="space-y-6">
          <div>
            <label htmlFor="topic" className="block text-sm font-semibold text-green-400 mb-2">
              Topic
            </label>
            <input
              type="text"
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, JavaScript Basics, Quantum Physics"
              required
              className="w-full p-4 rounded-lg bg-[#1e293b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600 hover:border-green-400 transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="noteLength" className="block text-sm font-semibold text-green-400 mb-2">
                Note Length
              </label>
              <div className="relative" ref={noteLengthRef}>
                {/* Custom dropdown trigger button for Note Length */}
                <button
                  type="button"
                  id="noteLength"
                  className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1e2e24] to-[#172a1c] text-white border border-green-500/40
                    hover:border-green-400/70 focus:border-green-400 focus:ring-2 focus:ring-green-500/50 focus:outline-none
                    shadow-inner shadow-green-900/20 appearance-none transition-all duration-200 font-medium text-left flex items-center justify-between"
                  onClick={() => setIsNoteLengthOpen(!isNoteLengthOpen)}
                  onKeyDown={handleNoteLengthKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={isNoteLengthOpen}
                >
                  <span className="text-white">{noteLengthLabels[noteLength]}</span>
                  <svg className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isNoteLengthOpen ? "transform rotate-180" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Custom dropdown menu for Note Length */}
                {isNoteLengthOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a3e32] to-[#1e2e22] rounded-lg shadow-xl border border-green-500/40 overflow-hidden max-h-60 overflow-y-auto">
                    <ul className="py-2" role="listbox">
                      {noteLengthOptions.map((option, i) => (
                        <li
                          key={option}
                          role="option"
                          aria-selected={noteLength === option}
                          className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                            ${noteLength === option
                              ? "bg-green-600/30 text-white"
                              : "text-gray-200 hover:bg-green-500/20"}
                            ${i !== noteLengthOptions.length - 1 ? "border-b border-green-500/10" : ""}`}
                          onClick={() => selectNoteLength(option)}
                        >
                          <span className="flex-1">{noteLengthLabels[option]}</span>
                          {noteLength === option && (
                            <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="focus" className="block text-sm font-semibold text-green-400 mb-2">
                Focus Area
              </label>
              <div className="relative" ref={focusRef}>
                {/* Custom dropdown trigger button for Focus Area */}
                <button
                  type="button"
                  id="focus"
                  className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1e2e24] to-[#172a1c] text-white border border-green-500/40
                    hover:border-green-400/70 focus:border-green-400 focus:ring-2 focus:ring-green-500/50 focus:outline-none
                    shadow-inner shadow-green-900/20 appearance-none transition-all duration-200 font-medium text-left flex items-center justify-between"
                  onClick={() => setIsFocusOpen(!isFocusOpen)}
                  onKeyDown={handleFocusKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={isFocusOpen}
                >
                  <span className="text-white">{focusLabels[focus]}</span>
                  <svg className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isFocusOpen ? "transform rotate-180" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Custom dropdown menu for Focus Area */}
                {isFocusOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a3e32] to-[#1e2e22] rounded-lg shadow-xl border border-green-500/40 overflow-hidden max-h-60 overflow-y-auto">
                    <ul className="py-2" role="listbox">
                      {focusOptions.map((option, i) => (
                        <li
                          key={option}
                          role="option"
                          aria-selected={focus === option}
                          className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                            ${focus === option
                              ? "bg-green-600/30 text-white"
                              : "text-gray-200 hover:bg-green-500/20"}
                            ${i !== focusOptions.length - 1 ? "border-b border-green-500/10" : ""}`}
                          onClick={() => selectFocus(option)}
                        >
                          <span className="flex-1">{focusLabels[option]}</span>
                          {focus === option && (
                            <svg className="w-5 h-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!topic || isGenerating}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-4 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Notes...
                </>
              ) : (
                "Generate Notes"
              )}
            </button>
          </div>
        </form>
      </div>

      {viewingNotesLoading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      )}
      {viewingNotes && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 bg-gray-800/80 p-6 rounded-xl shadow-lg border border-green-500/30 backdrop-blur-sm"
        >
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold opacity-70 cursor-not-allowed select-none">
              Saved
            </div>
            {/* View PDF button if pdfUrl is available in navigation state */}
            {location.state && location.state.url && (
              <a
                href={location.state.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                View PDF
              </a>
            )}
            <button
              onClick={() => window.location.href = "/activity"}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              Go to Activity
            </button>
          </div>
          <h2 className="text-xl font-bold text-green-300 mb-4">{viewingNotes.topic} 📚</h2>
          <div className="text-gray-300 space-y-6">
            {viewingNotes.notes.map((note, index) =>
              note.isCode ? (
                <div key={index} className="rounded-xl border border-green-700/40 bg-[#181f2a] p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-semibold text-sm">Code Example</span>
                    <button
                      onClick={() => handleRunCode(note.code, index)}
                      disabled={runningIndex === index}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                    >
                      {runningIndex === index ? "Running..." : "Run Code"}
                    </button>
                  </div>
                  <div className="mb-2 rounded overflow-hidden border border-green-900/30">
                    <Editor
                      height="180px"
                      defaultLanguage={detectLanguage(note.code)}
                      value={note.code}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        fontSize: 15,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        lineNumbers: "on",
                        padding: { top: 8, bottom: 8 },
                        fontLigatures: true,
                        fontFamily: "Fira Mono, Menlo, Monaco, Consolas, monospace",
                      }}
                    />
                  </div>
                  {runResults[index] && (
                    <div
                      className={`mt-2 rounded-lg px-4 py-2 text-sm font-mono ${
                        runResults[index].status === "error"
                          ? "bg-red-900/60 text-red-300 border border-red-700"
                          : "bg-gray-900/80 text-green-200 border border-green-700"
                      }`}
                    >
                      <span className="font-semibold">
                        {runResults[index].status === "error"
                          ? "Error"
                          : "Output"}
                        :
                      </span>
                      <pre className="whitespace-pre-wrap break-words mt-1">{runResults[index].output}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <p key={index} className="leading-relaxed text-gray-300">
                  {note.content}
                </p>
              )
            )}
          </div>
        </motion.div>
      )}

      {generatedNotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 bg-gray-800/80 p-6 rounded-xl shadow-lg border border-green-500/30 backdrop-blur-sm"
        >
          <div className="flex flex-wrap gap-4 mb-4">
            {!isSaved ? (
              <button
                onClick={handleSaveAsPdf}
                disabled={isSavingPdf}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
              >
                {isSavingPdf ? "Saving as PDF..." : "Save as PDF"}
              </button>
            ) : (
              <>
                <div className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold opacity-70 cursor-not-allowed select-none">
                  Saved
                </div>
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    View PDF
                  </a>
                )}
                <button
                  onClick={() => window.location.href = "/activity"}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                >
                  Go to Activity
                </button>
              </>
            )}
            <button
              onClick={handleCreateQuizFromNotes}
              disabled={isGeneratingQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50"
            >
              {isGeneratingQuiz ? "Generating Quiz..." : "Create Quiz from Notes"}
            </button>
          </div>
          <h2 className="text-xl font-bold text-green-300 mb-4">Generated Notes 📚</h2>
          <div className="text-gray-300 space-y-6">
            {generatedNotes.map((note, index) =>
              note.isCode ? (
                <div key={index} className="rounded-xl border border-green-700/40 bg-[#181f2a] p-3 shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-semibold text-sm">Code Example</span>
                    <button
                      onClick={() => handleRunCode(note.code, index)}
                      disabled={runningIndex === index}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium transition disabled:opacity-50"
                    >
                      {runningIndex === index ? "Running..." : "Run Code"}
                    </button>
                  </div>
                  <div className="mb-2 rounded overflow-hidden border border-green-900/30">
                    <Editor
                      height="180px"
                      defaultLanguage={detectLanguage(note.code)}
                      value={note.code}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        fontSize: 15,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        lineNumbers: "on",
                        padding: { top: 8, bottom: 8 },
                        fontLigatures: true,
                        fontFamily: "Fira Mono, Menlo, Monaco, Consolas, monospace",
                      }}
                    />
                  </div>
                  {runResults[index] && (
                    <div
                      className={`mt-2 rounded-lg px-4 py-2 text-sm font-mono ${
                        runResults[index].status === "error"
                          ? "bg-red-900/60 text-red-300 border border-red-700"
                          : "bg-gray-900/80 text-green-200 border border-green-700"
                      }`}
                    >
                      <span className="font-semibold">
                        {runResults[index].status === "error"
                          ? "Error"
                          : "Output"}
                        :
                      </span>
                      <pre className="whitespace-pre-wrap break-words mt-1">{runResults[index].output}</pre>
                    </div>
                  )}
                </div>
              ) : (
                <p key={index} className="leading-relaxed text-gray-300">
                  {note.content}
                </p>
              )
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Notes;
