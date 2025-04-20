import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FaFilePdf, FaRegClock, FaEye, FaStickyNote, FaQuestionCircle, FaShare } from "react-icons/fa";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import { API_BASE_URL } from "../constants/api";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";

function UserActivity() {
  const [savedFlashcards, setSavedFlashcards] = useState([]);
  const [savedNotes, setSavedNotes] = useState([]);
  const [savedQuizzes, setSavedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [viewingNotes, setViewingNotes] = useState(null); // { notes: [], topic: "" }
  const [viewingNotesLoading, setViewingNotesLoading] = useState(false);
  const [runResults, setRunResults] = useState({});
  const [runningIndex, setRunningIndex] = useState(null);

  // Add new state variables for community sharing
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  const [communityOptions, setCommunityOptions] = useState([]);
  const [selectedCommunityID, setSelectedCommunityID] = useState("");
  const [selectedNoteToShare, setSelectedNoteToShare] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const fetchSavedFlashcards = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/flashcards/saved`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userid: user.uid }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch saved flashcards");
        }

        let data = await response.json();
        data = data.flashcards;
        // Process the data into a more usable format with placeholders for missing fields
        const processedData = data.map((item, index) => ({
          ...item,
          id: item.id || `saved-${index}`,
          topic: item.topic || `Saved Flashcards ${index + 1}`,
          subject: item.subject || "Study Material",
        }));

        setSavedFlashcards(processedData);
      } catch (error) {
        console.error("Error fetching saved flashcards:", error);
        toast.error("Failed to load your saved flashcards");
      } finally {
        setLoading(false);
      }
    };

    const fetchSavedNotes = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_BASE_URL}/notes/saved`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid }),
        });
        if (!response.ok) throw new Error("Failed to fetch saved notes");
        let data = await response.json();
        data = data.notes;
        const processedNotes = data.map((item, index) => ({
          ...item,
          id: item.id || `note-${index}`,
          topic: item.topic || `Saved Notes ${index + 1}`,
        }));
        setSavedNotes(processedNotes);
      } catch (error) {
        console.error("Error fetching saved notes:", error);
        toast.error("Failed to load your saved notes");
      }
    };

    const fetchSavedQuizzes = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${API_BASE_URL}/quiz-gform/user-pdf-urls`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid }),
        });
        if (!response.ok) throw new Error("Failed to fetch saved quizzes");
        const data = await response.json();
        if (data && data["saved-quizes"]) {
          // Process and format the saved quizzes
          const processedQuizzes = data["saved-quizes"].map((item, index) => ({
            ...item,
            id: `quiz-${index}`,
            topic: item.quizTitle ? item.quizTitle.replace(/^"|"$/g, '') : `Saved Quiz ${index + 1}`, // Remove quotes if present
          }));
          setSavedQuizzes(processedQuizzes);
        }
      } catch (error) {
        console.error("Error fetching saved quizzes:", error);
        toast.error("Failed to load your saved quizzes");
      }
    };

    fetchSavedFlashcards();
    fetchSavedNotes();
    fetchSavedQuizzes();
  }, [user]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";

    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchAndViewFlashcards = async (item) => {
    try {
      // Show loading toast
      const loadingToast = toast.loading("Loading flashcards...");

      // Make API call to get flashcards data using the PDF URL
      const response = await fetch(`${API_BASE_URL}/flashcards/json-from-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: item.pdfurl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to retrieve flashcards");
      }

      const data = await response.json();
      toast.dismiss(loadingToast);
      console.log(data);
      if (!data || !Array.isArray(data)) {
        toast.error("Invalid flashcards data received");
        return;
      }

      // Navigate to flashcards page with the data
      navigate("/flashcards", {
        state: {
          savedFlashcards: data,
          topic: item.topic,
          subject: item.subject || "Study Material",
          fromSaved: true,
          url: item.pdfurl,
        },
      });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast.error("Failed to load flashcards. Please try again.");
    }
  };

  const detectLanguage = (code) => {
    if (/^\s*#include\b/m.test(code) || /\bprintf\s*\(/.test(code)) return "cpp";
    if (/^\s*def\b/.test(code) || /\blambda\b/.test(code) || /\bprint\b/.test(code)) return "python";
    if (/^\s*function\b/.test(code) || /\bconsole\.log\b/.test(code)) return "javascript";
    if (/^\s*public\s+class\b/.test(code)) return "java";
    return "plaintext";
  };

  const mapToPistonLang = (lang) => {
    if (lang === "python") return { language: "python", version: "3.10.0", filename: "main.py" };
    if (lang === "cpp") return { language: "cpp", version: "10.2.0", filename: "main.cpp" };
    if (lang === "javascript") return { language: "javascript", version: "16.3.0", filename: "main.js" };
    if (lang === "java") return { language: "java", version: "15.0.2", filename: "Main.java" };
    return null;
  };

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

  // Function to fetch user's subscribed communities
  const fetchUserCommunities = async () => {
    if (!user?.uid) return;
    try {
      const res = await fetch(`${API_BASE_URL}/community/subscribed-communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      if (data["subscribed-communities"] && Array.isArray(data["subscribed-communities"])) {
        // For each communityID, fetch its name
        const arr = [];
        for (const cid of data["subscribed-communities"]) {
          const detRes = await fetch(`${API_BASE_URL}/community/fetch-community`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ communityID: cid }),
          });
          const detData = await detRes.json();
          if (detData.community) {
            arr.push({
              id: cid,
              name: detData.community.communityName || cid
            });
          }
        }
        setCommunityOptions(arr);
      } else {
        setCommunityOptions([]);
      }
    } catch (e) {
      toast.error("Failed to fetch communities");
      setCommunityOptions([]);
    }
  };

  // Open community modal for sharing a note
  const openShareModal = async (note) => {
    setSelectedNoteToShare(note);
    await fetchUserCommunities();
    setShowCommunityModal(true);
  };

  // Share note with selected community
  const shareNoteWithCommunity = async () => {
    if (!selectedNoteToShare || !selectedCommunityID || !user) {
      toast.error("Missing required information to share note");
      return;
    }

    setIsSharing(true);

    try {
      // Find the selected community name
      const community = communityOptions.find(c => c.id === selectedCommunityID);

      const response = await fetch(`${API_BASE_URL}/community/share-note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notePdfUrl: selectedNoteToShare.pdfUrl,
          topic: selectedNoteToShare.topic,
          communityId: selectedCommunityID,
          communityName: community ? community.name : "Community",
          userId: user.uid,
          username: user.displayName || user.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Note shared successfully!");
      } else {
        // If the note was already shared
        if (data.message === "Note already shared with the community.") {
          toast.error(data.message);
        } else {
          toast.error(data.message || "Failed to share note");
        }
      }
    } catch (error) {
      console.error("Error sharing note:", error);
      toast.error("Failed to share note. Please try again.");
    } finally {
      setIsSharing(false);
      setShowCommunityModal(false);
      setSelectedCommunityID("");
      setSelectedNoteToShare(null);
    }
  };

  // Community selection modal component with custom dropdown
  const CommunityModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      } else if (e.key === "ArrowDown" && !isOpen) {
        setIsOpen(true);
      }
    };

    const selectCommunity = (id) => {
      setSelectedCommunityID(id);
      setIsOpen(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-gradient-to-br from-[#1e2e20] to-[#1a2e1e] p-7 rounded-2xl shadow-2xl border border-green-500/40 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center bg-gradient-to-r from-green-300 to-teal-300 text-transparent bg-clip-text mb-5">Share Note with Community</h2>
          {communityOptions.length > 0 ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-green-300 mb-2">Choose a community:</label>
                <div className="relative" ref={dropdownRef}>
                  {/* Custom dropdown trigger button */}
                  <button
                    type="button"
                    className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1c2e24] to-[#162a1c] text-white border border-green-500/40
                      hover:border-green-400/70 focus:border-green-400 focus:ring-2 focus:ring-green-500/50 focus:outline-none
                      shadow-inner shadow-green-900/20 transition-all duration-200 font-medium text-left flex items-center justify-between"
                    onClick={() => setIsOpen(!isOpen)}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                  >
                    <span className={selectedCommunityID ? "text-white" : "text-gray-400"}>
                      {selectedCommunityID
                        ? communityOptions.find(opt => opt.id === selectedCommunityID)?.name
                        : "Select a community..."}
                    </span>
                    <svg className={`w-5 h-5 text-green-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
                      viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Custom dropdown menu */}
                  {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a3e32] to-[#1e2e22] rounded-lg shadow-xl border border-green-500/40 overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-green-500/30 scrollbar-track-gray-800/30">
                      <ul className="py-2" role="listbox">
                        {communityOptions.map((opt, index) => (
                          <li
                            key={opt.id}
                            role="option"
                            aria-selected={selectedCommunityID === opt.id}
                            className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                              ${selectedCommunityID === opt.id
                                ? "bg-green-600/30 text-white"
                                : "text-gray-200 hover:bg-green-500/20"}
                              ${index !== communityOptions.length - 1 ? "border-b border-green-500/10" : ""}`}
                            onClick={() => selectCommunity(opt.id)}
                          >
                            <span className="flex-1">{opt.name}</span>
                            {selectedCommunityID === opt.id && (
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
                <p className="mt-2 text-xs text-green-300/70 italic">This note will be shared with all members of the selected community</p>
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white px-4 py-3 rounded-lg font-semibold flex-1 transition-all shadow-lg shadow-green-700/20 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={!selectedCommunityID || isSharing}
                  onClick={shareNoteWithCommunity}
                >
                  {isSharing ? 'Sharing...' : 'Share Note'}
                </button>
                <button
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-3 rounded-lg font-semibold flex-1 transition-all shadow-lg shadow-gray-700/20"
                  onClick={() => setShowCommunityModal(false)}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-300 py-6 px-2">
              <div className="bg-green-900/20 rounded-xl p-4 border border-green-500/30 mb-5">
                <p className="text-sm">No communities found. You must join or create a community first.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/communities"
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white px-4 py-2 rounded-lg font-semibold flex-1 transition-all shadow-lg shadow-green-700/20"
                >
                  Go to Communities
                </Link>
                <button
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white px-4 py-2 rounded-lg font-semibold flex-1 transition-all"
                  onClick={() => setShowCommunityModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text mb-4">
          Your Activity
        </h1>
        <p className="text-gray-400">
          Track your learning journey and access your saved materials
        </p>
      </div>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-blue-300">Saved Flashcards</h2>
          <Link
            to="/flashcards"
            className="text-sm text-blue-400 hover:text-blue-300 transition"
          >
            Create New
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : savedFlashcards.length === 0 ? (
          <div className="text-center py-12 bg-[#141428]/50 rounded-xl border border-gray-700/50">
            <p className="text-gray-400 mb-4">
              You haven't saved any flashcards yet.
            </p>
            <Link
              to="/flashcards"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
            >
              Create Flashcards
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedFlashcards.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-br from-[#18182f] to-[#1a1a2e] p-6 rounded-xl shadow-lg border border-blue-500/20"
              >
                <h3 className="text-2xl font-bold text-blue-300 mb-1">
                  {item.topic}
                </h3>
                <div className="text-sm text-blue-200 mb-2 font-medium">
                  {item.subject}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <FaRegClock />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <motion.a
                    href={item.pdfurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 px-4 rounded-md border border-purple-500/30"
                  >
                    <FaFilePdf />
                    View PDF
                  </motion.a>
                  <motion.button
                    onClick={() => fetchAndViewFlashcards(item)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 px-4 rounded-md border border-blue-500/30"
                  >
                    <FaEye />
                    View Flashcards
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-green-300 flex items-center gap-2">
            <FaStickyNote /> Saved Notes
          </h2>
          <Link
            to="/notes"
            className="text-sm text-green-400 hover:text-green-300 transition"
          >
            Create New
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : savedNotes.length === 0 ? (
          <div className="text-center py-12 bg-[#141428]/50 rounded-xl border border-gray-700/50">
            <p className="text-gray-400 mb-4">
              You haven't saved any notes yet.
            </p>
            <Link
              to="/notes"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
            >
              Create Notes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedNotes.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-br from-[#182f1e] to-[#1a2e1a] p-6 rounded-xl shadow-lg border border-green-500/20"
              >
                <h3 className="text-xl font-medium text-green-300 mb-2">
                  {item.topic}
                </h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <FaRegClock />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <motion.a
                    href={item.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 py-2 px-4 rounded-md border border-green-500/30"
                  >
                    <FaFilePdf />
                    View PDF
                  </motion.a>
                  <motion.button
                    onClick={() => openShareModal(item)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 px-4 rounded-md border border-blue-500/30"
                  >
                    <FaShare />
                    Share with Community
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-purple-300 flex items-center gap-2">
            <FaQuestionCircle /> Saved Quizzes
          </h2>
          <Link
            to="/quiz"
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            Create New
          </Link>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : savedQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-[#141428]/50 rounded-xl border border-gray-700/50">
            <p className="text-gray-400 mb-4">
              You haven't saved any quizzes yet.
            </p>
            <Link
              to="/quiz"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition"
            >
              Create Quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedQuizzes.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gradient-to-br from-[#271e3d] to-[#1e1a2e] p-6 rounded-xl shadow-lg border border-purple-500/20"
              >
                <h3 className="text-xl font-medium text-purple-300 mb-2">
                  {item.topic}
                </h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <FaRegClock />
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <motion.a
                    href={item.pdfurl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 py-2 px-4 rounded-md border border-purple-500/30"
                  >
                    <FaFilePdf />
                    View Quiz PDF
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

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

      <div className="mt-8 bg-[#141428]/50 p-6 rounded-xl border border-gray-700/50">
        <h3 className="text-xl font-bold text-gray-300 mb-4">Learning Tips</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>Regularly review your saved flashcards to reinforce learning</li>
          <li>Use spaced repetition for better memory retention</li>
          <li>Create your own flashcards for personalized learning</li>
          <li>Share your study materials with peers for collaborative learning</li>
        </ul>
      </div>

      {/* Render community modal if open */}
      {showCommunityModal && <CommunityModal />}
    </div>
  );
}

export default UserActivity;
