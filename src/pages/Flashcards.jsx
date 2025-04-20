import { useState, useContext, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaBrain, FaSync, FaCheck, FaTimes, FaChevronLeft, FaChevronRight, FaSave, FaQuestionCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import styles from "../styles/flashcard.module.css";
import { generateMockFlashcards } from "../utils/mockFlashcardApi";
import { API_BASE_URL } from "../constants/api";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import { useLocation } from "react-router-dom";

function Flashcards() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isViewingFromSaved, setIsViewingFromSaved] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isNumCardsOpen, setIsNumCardsOpen] = useState(false);
  const numCardsRef = useRef(null);

  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Check if we're viewing saved flashcards passed via navigation
  useEffect(() => {
    if (location.state && location.state.savedFlashcards) {
      const { url, savedFlashcards, subject: savedSubject, topic: savedTopic } = location.state;

      setFlashcards(savedFlashcards);
      setSubject(savedSubject || "Saved");
      setTopic(savedTopic || "Flashcards");
      setCurrentCardIndex(0);
      setFlipped(false);
      setShowCards(true);
      setIsSaved(true);
      setIsViewingFromSaved(true);
      setPdfUrl(url);
      setJustSaved(true); // Show buttons for saved flashcards
    }
  }, [location.state]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (numCardsRef.current && !numCardsRef.current.contains(event.target)) {
        setIsNumCardsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsNumCardsOpen(false);
    } else if (e.key === "ArrowDown" && !isNumCardsOpen) {
      setIsNumCardsOpen(true);
    }
  };

  const selectNumCards = (num) => {
    setNumCards(num);
    setIsNumCardsOpen(false);
  };

  const generateFlashcards = async (e) => {
    e.preventDefault();

    setIsGenerating(true);
    setShowCards(false);
    setIsSaved(false);
    setIsViewingFromSaved(false);

    try {
      const response = await fetch(`${API_BASE_URL}/flashcards/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subject, topic, numCards }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch flashcards from the backend API");
      }

      const cards = await response.json();
      console.log(cards);
      if (!Array.isArray(cards) || cards.length === 0 || !cards[0].front || !cards[0].back) {
        throw new Error("Invalid response structure from the backend API");
      }

      setFlashcards(cards);
      setCurrentCardIndex(0);
      setFlipped(false);
      toast.success(`Generated ${cards.length} flashcards successfully!`);
      setShowCards(true);
    } catch (error) {
      console.error("Error generating flashcards:", error);
      toast.error("API error. Using mock flashcards instead.");
      const mockCards = generateMockFlashcards(subject, topic, numCards);
      setFlashcards(mockCards);
      setCurrentCardIndex(0);
      setFlipped(false);
      setShowCards(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setFlipped(false);
    }
  };

  const flipCard = () => {
    setFlipped(!flipped);
  };

  const saveFlashcards = async () => {
    if (!user || !flashcards.length) {
      toast.error("You must be logged in to save flashcards");
      return;
    }

    setIsSaving(true);

    try {
      const savePdfResponse = await fetch(`${API_BASE_URL}/flashcards/save-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flashcards,
          userEmail: user.email,
          username: user.displayName || "user",
          topic,
        }),
      });

      if (!savePdfResponse.ok) {
        throw new Error("Failed to generate PDF");
      }

      const { url } = await savePdfResponse.json();

      setPdfUrl(url);

      const saveToDbResponse = await fetch(`${API_BASE_URL}/flashcards/save-db`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          subject,
          userid: user.uid,
          pdfurl: url,
        }),
      });

      if (!saveToDbResponse.ok) {
        throw new Error("Failed to save to database");
      }

      setIsSaved(true);
      setJustSaved(true); // Show buttons after save
      toast.success("Flashcards saved successfully!");
    } catch (error) {
      console.error("Error saving flashcards:", error);
      toast.error("Failed to save flashcards");
    } finally {
      setIsSaving(false);
    }
  };

  const generateQuizFromFlashcards = async () => {
    if (!user) {
      toast.error("You must be logged in to generate a quiz");
      return;
    }

    if (!isSaved || !pdfUrl) {
      toast.error("Please save flashcards first to generate a quiz");
      return;
    }

    setIsGeneratingQuiz(true);

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/generate-from-flashcard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfurl: pdfUrl,
          topic,
          userId: user.uid,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz from flashcards");
      }

      const quizQuestions = await response.json();

      // Navigate to the Quiz page with the quiz data
      navigate("/quiz", {
        state: {
          quizData: {
            questions: quizQuestions,
            title: `${subject} Quiz: ${topic}`,
            description: `Test your knowledge of ${topic} with this quiz generated from your flashcards.`,
          },
          fromFlashcards: true,
        },
      });

      toast.success("Quiz generated successfully!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleCreateNew = () => {
    if (isViewingFromSaved) {
      setSubject("");
      setTopic("");
      setIsViewingFromSaved(false);
    }
    setShowCards(false);
    setJustSaved(false);
    setPdfUrl(null);
    setIsSaved(false);
  };

  return (
    <div className="w-full max-w-5xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 text-transparent bg-clip-text mb-4">
          {isViewingFromSaved ? "Saved Flashcards" : "Create Flashcards"}
        </h1>
        <p className="text-gray-400">
          {isViewingFromSaved
            ? `Reviewing your saved flashcards for ${topic}`
            : "Generate study flashcards powered by AI to memorize key concepts"}
        </p>
      </div>

      {!showCards ? (
        <motion.div
          className="bg-gradient-to-br from-[#18182f] to-[#1a1a2e] p-10 rounded-3xl shadow-2xl border border-blue-500/30 backdrop-blur-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <form onSubmit={generateFlashcards} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-blue-400 mb-2"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full p-4 rounded-lg bg-[#1e293b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-600"
                  placeholder="Enter Subject"
                />
              </div>
              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-semibold text-cyan-400 mb-2"
                >
                  Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  required
                  className="w-full p-4 rounded-lg bg-[#1e293b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
                  placeholder="Enter Topic"
                />
              </div>
              <div>
                <label
                  htmlFor="numCards"
                  className="block text-sm font-semibold text-purple-400 mb-2"
                >
                  Number of Cards
                </label>
                <div className="relative" ref={numCardsRef}>
                  {/* Custom dropdown trigger button */}
                  <button
                    type="button"
                    className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1e293b] to-[#17203a] text-white border border-purple-500/40
                      hover:border-purple-400/70 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none
                      shadow-inner shadow-purple-900/20 transition-all duration-200 font-medium text-left flex items-center justify-between"
                    onClick={() => setIsNumCardsOpen(!isNumCardsOpen)}
                    onKeyDown={handleKeyDown}
                    aria-haspopup="listbox"
                    aria-expanded={isNumCardsOpen}
                  >
                    <span className="text-white">{numCards} Cards</span>
                    <svg className={`w-5 h-5 text-purple-400 transition-transform duration-200 ${isNumCardsOpen ? "transform rotate-180" : ""}`}
                      viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Custom dropdown menu */}
                  {isNumCardsOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a2a5a] to-[#23234a] rounded-lg shadow-xl border border-purple-500/40 overflow-hidden py-2">
                      {[5, 10, 15, 20].map((num) => (
                        <div
                          key={num}
                          role="option"
                          aria-selected={numCards === num}
                          className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                            ${numCards === num
                              ? "bg-purple-600/30 text-white"
                              : "text-gray-200 hover:bg-purple-500/20"}
                            ${num !== 20 ? "border-b border-purple-500/10" : ""}`}
                          onClick={() => selectNumCards(num)}
                        >
                          <span className="flex-1">{num} Cards</span>
                          {numCards === num && (
                            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4">
              <motion.button
                type="submit"
                disabled={!subject || !topic || isGenerating}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-4 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/10 text-lg gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating Flashcards...
                  </>
                ) : (
                  <>
                    <FaBrain className="mr-2" />
                    Generate Flashcards
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      ) : (
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-blue-300">
                {subject}: {topic}
              </h2>
              <div className="text-sm text-gray-400">
                Card {currentCardIndex + 1} of {flashcards.length}
              </div>
            </div>

            <div className={`flex justify-center w-full ${styles.perspective}`}>
              <div
                className={`w-full max-w-lg h-64 cursor-pointer relative ${styles.card} ${flipped ? styles.cardFlipped : ""}`}
                onClick={flipCard}
              >
                <div className={`bg-gradient-to-br from-blue-900/50 to-cyan-900/30 p-6 rounded-2xl border border-blue-500/30 shadow-xl ${styles.cardFace}`}>
                  <div className="text-xl text-white font-medium">
                    {flashcards[currentCardIndex]?.front || "Question not available"}
                  </div>
                  <div className="mt-4 text-sm text-blue-300">Click to reveal answer</div>
                </div>

                <div className={`bg-gradient-to-br from-cyan-900/50 to-blue-900/30 p-6 rounded-2xl border border-cyan-500/30 shadow-xl ${styles.cardFace} ${styles.cardBack}`}>
                  <div className="text-xl text-white">
                    {flashcards[currentCardIndex]?.back || "Answer not available"}
                  </div>
                  <div className="mt-4 text-sm text-cyan-300">Click to see question</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center mt-8 space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentCardIndex === 0}
                onClick={prevCard}
                className="bg-gray-800 text-white py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                <FaChevronLeft className="h-4 w-4" />
                Previous
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={flipCard}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center gap-1"
              >
                <FaSync className="h-4 w-4" />
                Flip
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={currentCardIndex === flashcards.length - 1}
                onClick={nextCard}
                className="bg-gray-800 text-white py-2 px-4 rounded-lg disabled:opacity-50 flex items-center gap-1"
              >
                Next
                <FaChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="flex flex-wrap justify-center mt-6 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                className="text-blue-400 hover:text-blue-300 py-2 px-4 rounded-lg flex items-center gap-1 border border-blue-500/30"
              >
                {isViewingFromSaved ? "Create New Flashcards" : "Create New Flashcards"}
              </motion.button>

              {!isViewingFromSaved && (
                <>
                  <motion.button
                    whileHover={{ scale: isSaved ? 1 : 1.02 }}
                    whileTap={{ scale: isSaved ? 1 : 0.98 }}
                    onClick={saveFlashcards}
                    disabled={isSaving || isSaved || !user}
                    className={`
                      py-2 px-4 rounded-lg flex items-center gap-2 border
                      ${isSaved
                        ? "bg-green-500/20 text-green-400 border-green-500/30 cursor-default"
                        : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30"}
                      ${(!user || isSaving) ? "opacity-60 cursor-not-allowed" : ""}
                    `}
                  >
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Saving...
                      </>
                    ) : isSaved ? (
                      <>
                        <FaCheck />
                        Saved
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Save Cards
                      </>
                    )}
                  </motion.button>
                  {/* Show View PDF and Go to Activity after save */}
                  {justSaved && isSaved && pdfUrl && (
                    <>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        View PDF
                      </a>
                      <button
                        onClick={() => navigate("/activity")}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        Go to Activity
                      </button>
                    </>
                  )}
                </>
              )}

              {isViewingFromSaved && (
                <>
                  <div className="py-2 px-4 rounded-lg flex items-center gap-2 border bg-green-500/20 text-green-400 border-green-500/30">
                    <FaCheck />
                    Saved
                  </div>
                  {/* Show View PDF and Go to Activity for saved flashcards */}
                  {pdfUrl && (
                    <>
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        View PDF
                      </a>
                      <button
                        onClick={() => navigate("/activity")}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                      >
                        Go to Activity
                      </button>
                    </>
                  )}
                </>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generateQuizFromFlashcards}
                disabled={isGeneratingQuiz || !isSaved || !user}
                className={`
                  py-2 px-4 rounded-lg flex items-center gap-2 border
                  bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30
                  ${(isGeneratingQuiz || !isSaved || !user) ? "opacity-60 cursor-not-allowed" : ""}
                `}
              >
                {isGeneratingQuiz ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <FaQuestionCircle />
                    Generate Quiz
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>


        </div>
      )}

      <div className="mt-8 bg-[#141428]/50 p-6 rounded-xl border border-gray-700/50">
        <h3 className="text-xl font-bold text-gray-300 mb-4">Flashcard Study Tips</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>Review cards regularly to strengthen memory retention</li>
          <li>Try to recall the answer before flipping the card</li>
          <li>Focus on cards you find difficult</li>
          <li>Study in short, focused sessions rather than long marathons</li>
        </ul>
      </div>
    </div>
  );
}

export default Flashcards;
