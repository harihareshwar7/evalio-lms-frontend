import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaCheck, FaChevronLeft, FaChevronRight, FaArrowLeft, FaBrain, FaGoogle, FaFilePdf } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import { API_BASE_URL } from "../constants/api";
import { Dialog } from "@headlessui/react"; // for modal, or use your own modal component
import { Pie, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// Move QuizCreationForm outside of the Quiz component to avoid re-creation on every render
function QuizCreationForm({
  quizTopic,
  setQuizTopic,
  numQuestions,
  setNumQuestions,
  difficulty,
  setDifficulty,
  isGenerating,
  generateQuiz
}) {
  // Add states for dropdown visibility
  const [isNumQuestionsOpen, setIsNumQuestionsOpen] = useState(false);
  const [isDifficultyOpen, setIsDifficultyOpen] = useState(false);

  // Add refs for handling outside clicks
  const numQuestionsRef = useRef(null);
  const difficultyRef = useRef(null);

  // Handle outside clicks for Number of Questions dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (numQuestionsRef.current && !numQuestionsRef.current.contains(event.target)) {
        setIsNumQuestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle outside clicks for Difficulty dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (difficultyRef.current && !difficultyRef.current.contains(event.target)) {
        setIsDifficultyOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers for keyboard navigation
  const handleNumQuestionsKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsNumQuestionsOpen(false);
    } else if (e.key === "ArrowDown" && !isNumQuestionsOpen) {
      setIsNumQuestionsOpen(true);
    }
  };

  const handleDifficultyKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsDifficultyOpen(false);
    } else if (e.key === "ArrowDown" && !isDifficultyOpen) {
      setIsDifficultyOpen(true);
    }
  };

  // Option selection handlers
  const selectNumQuestions = (value) => {
    setNumQuestions(value);
    setIsNumQuestionsOpen(false);
  };

  const selectDifficulty = (value) => {
    setDifficulty(value);
    setIsDifficultyOpen(false);
  };

  // Mapping for difficulty level display names
  const difficultyLabels = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard"
  };

  // Available options
  const numQuestionsOptions = [3, 5, 7, 10];
  const difficultyOptions = ["easy", "medium", "hard"];

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-3">
          Create a Quiz
        </h1>
        <p className="text-gray-400">Generate quiz questions on any topic of your choice</p>
      </div>

      <motion.div
        className="bg-gradient-to-br from-[#18182f] to-[#1a1a2e] p-8 rounded-3xl shadow-2xl border border-purple-500/30 backdrop-blur-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <form onSubmit={generateQuiz} className="space-y-6">
          <div>
            <label
              htmlFor="topic"
              className="block text-sm font-semibold text-purple-400 mb-2"
            >
              Quiz Topic
            </label>
            <input
              type="text"
              id="topic"
              value={quizTopic}
              onChange={(e) => setQuizTopic(e.target.value)}
              required
              className="w-full p-4 rounded-lg bg-[#1e293b] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-gray-600"
              placeholder="Enter topic (e.g. Python Programming)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="numQuestions"
                className="block text-sm font-semibold text-pink-400 mb-2"
              >
                Number of Questions
              </label>
              <div className="relative" ref={numQuestionsRef}>
                {/* Custom dropdown trigger button for Number of Questions */}
                <button
                  type="button"
                  id="numQuestions"
                  className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1e293b] to-[#172033] text-white border border-pink-500/40
                    hover:border-pink-400/70 focus:border-pink-400 focus:ring-2 focus:ring-pink-500/50 focus:outline-none
                    shadow-inner shadow-pink-900/20 appearance-none transition-all duration-200 font-medium text-left flex items-center justify-between"
                  onClick={() => setIsNumQuestionsOpen(!isNumQuestionsOpen)}
                  onKeyDown={handleNumQuestionsKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={isNumQuestionsOpen}
                >
                  <span className="text-white">{numQuestions} Questions</span>
                  <svg className={`w-5 h-5 text-pink-400 transition-transform duration-200 ${isNumQuestionsOpen ? "transform rotate-180" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Custom dropdown menu for Number of Questions */}
                {isNumQuestionsOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a2a5a] to-[#23234a] rounded-lg shadow-xl border border-pink-500/40 overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-pink-500/30 scrollbar-track-gray-800/30">
                    <ul className="py-2" role="listbox">
                      {numQuestionsOptions.map((num, i) => (
                        <li
                          key={num}
                          role="option"
                          aria-selected={numQuestions === num}
                          className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                            ${numQuestions === num
                              ? "bg-pink-600/30 text-white"
                              : "text-gray-200 hover:bg-pink-500/20"}
                            ${i !== numQuestionsOptions.length - 1 ? "border-b border-pink-500/10" : ""}`}
                          onClick={() => selectNumQuestions(num)}
                        >
                          <span className="flex-1">{num} Questions</span>
                          {numQuestions === num && (
                            <svg className="w-5 h-5 text-pink-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
              <label
                htmlFor="difficulty"
                className="block text-sm font-semibold text-blue-400 mb-2"
              >
                Difficulty Level
              </label>
              <div className="relative" ref={difficultyRef}>
                {/* Custom dropdown trigger button for Difficulty */}
                <button
                  type="button"
                  id="difficulty"
                  className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1e293b] to-[#172033] text-white border border-blue-500/40
                    hover:border-blue-400/70 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none
                    shadow-inner shadow-blue-900/20 appearance-none transition-all duration-200 font-medium text-left flex items-center justify-between"
                  onClick={() => setIsDifficultyOpen(!isDifficultyOpen)}
                  onKeyDown={handleDifficultyKeyDown}
                  aria-haspopup="listbox"
                  aria-expanded={isDifficultyOpen}
                >
                  <span className="text-white">{difficultyLabels[difficulty]}</span>
                  <svg className={`w-5 h-5 text-blue-400 transition-transform duration-200 ${isDifficultyOpen ? "transform rotate-180" : ""}`}
                    viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Custom dropdown menu for Difficulty */}
                {isDifficultyOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a2a5a] to-[#23234a] rounded-lg shadow-xl border border-blue-500/40 overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500/30 scrollbar-track-gray-800/30">
                    <ul className="py-2" role="listbox">
                      {difficultyOptions.map((diff, i) => (
                        <li
                          key={diff}
                          role="option"
                          aria-selected={difficulty === diff}
                          className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                            ${difficulty === diff
                              ? "bg-blue-600/30 text-white"
                              : "text-gray-200 hover:bg-blue-500/20"}
                            ${i !== difficultyOptions.length - 1 ? "border-b border-blue-500/10" : ""}`}
                          onClick={() => selectDifficulty(diff)}
                        >
                          <span className="flex-1">{difficultyLabels[diff]}</span>
                          {difficulty === diff && (
                            <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
            <motion.button
              type="submit"
              disabled={!quizTopic.trim() || isGenerating}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-4 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/10 text-lg gap-2"
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
                  Generating Quiz...
                </>
              ) : (
                <>
                  <FaBrain className="mr-2" />
                  Generate Quiz
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>

      <div className="mt-8 bg-[#141428]/50 p-6 rounded-xl border border-gray-700/50">
        <h3 className="text-xl font-bold text-gray-300 mb-4">Quiz Tips</h3>
        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>Be specific with your topic for more targeted questions</li>
          <li>Higher difficulty means more challenging questions and options</li>
          <li>You can also generate quizzes from your saved flashcards</li>
        </ul>
      </div>
    </div>
  );
}

// Helper to generate a short random community ID
function generateCommunityID() {
  return Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
}

function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Quiz taking states
  const [quizData, setQuizData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Quiz creation states
  const [quizTopic, setQuizTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(true);

  // New states for Google Form and displaying all questions
  const [googleFormUrl, setGoogleFormUrl] = useState(null);
  const [isGeneratingForm, setIsGeneratingForm] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);

  // New states for PDF generation
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [quizPdfUrl, setQuizPdfUrl] = useState(null);

  // Community selection for Google Form
  const [showCommunityModal, setShowCommunityModal] = useState(false);
  // Store array of { id, name } for dropdown
  const [communityOptions, setCommunityOptions] = useState([]);
  const [selectedCommunityID, setSelectedCommunityID] = useState("");

  // Track if quiz is in progress for navigation/reload warning
  const isQuizInProgress = quizData && !quizCompleted;
  const unblockRef = useRef(null);

  // Determine if quiz was started from flashcards or notes
  const fromFlashcards = location.state && location.state.fromFlashcards;
  const fromNotes = location.state && location.state.fromNotes;

  // Add state for answer breakdown
  const [answerBreakdown, setAnswerBreakdown] = useState({ correct: [], incorrect: [] });

  useEffect(() => {
    // Check if we're coming from flashcards with quiz data
    if (location.state && location.state.quizData) {
      setQuizData(location.state.quizData);
      setUserAnswers(new Array(location.state.quizData.questions.length).fill(null));
      setShowQuizForm(false); // Hide the form since we already have quiz data
    }
    setLoading(false);
  }, [location.state]);

  // Sync selectedOption with userAnswers when currentQuestionIndex changes
  useEffect(() => {
    setSelectedOption(userAnswers[currentQuestionIndex] ?? null);
    // eslint-disable-next-line
  }, [currentQuestionIndex]);

  // Warn on browser reload/close
  useEffect(() => {
    if (!isQuizInProgress) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Show browser's default confirmation dialog
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isQuizInProgress]);

  // Warn on in-app navigation (react-router-dom v6+)
  useEffect(() => {
    if (!isQuizInProgress) return;
    const handler = (event) => {
      // Show a custom confirmation dialog
      const confirmLeave = window.confirm(
        "You have an ongoing quiz. Are you sure you want to leave? Your progress will be lost."
      );
      if (!confirmLeave) {
        event.preventDefault();
      }
    };
    // Listen for navigation events
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [isQuizInProgress]);

  // Fetch user's subscribed communities (array of {id, name})
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

  // Open modal and fetch communities
  const openCommunityModal = async () => {
    await fetchUserCommunities();
    setShowCommunityModal(true);
  };

  // Generate Google Form with selected community
  const generateGoogleFormWithCommunity = async (communityID) => {
    if (!quizData || !quizData.questions) {
      toast.error("No quiz data available");
      return;
    }
    if (!communityID) {
      toast.error("Please select a community");
      return;
    }
    setIsGeneratingForm(true);
    try {
      // First API call to create the Google Form
      const response = await fetch(`${API_BASE_URL}/quiz-gform/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions: quizData.questions,
          quizTitle: quizData.title || "Quiz Assessment",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate Google Form");
      }

      const formData = await response.json();
      setGoogleFormUrl(formData.formUrl);

      // Second API call to save the form details (now with communityID)
      try {
        const saveBody = {
          createdAt: new Date().toISOString(),
          email: user?.email || "anonymous",
          formId: formData.formId || formData.id || "",
          formUrl: formData.formUrl,
          quizTitle: quizData.title || "Quiz Assessment",
          spreadsheetId: formData.spreadsheetId || "",
          spreadsheetUrl: formData.spreadsheetUrl || "",
          uid: user?.uid || "guest",
          communityID: communityID,
        };
        console.log("Saving Google Form details body:", saveBody);
        const saveResponse = await fetch(`${API_BASE_URL}/quiz-gform/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(saveBody),
        });

        if (!saveResponse.ok) {
          console.warn("Form saved successfully, but failed to save form details");
        }
      } catch (saveError) {
        console.error("Error saving form details:", saveError);
      }

      toast.success("Google Form created successfully! Go to All Quizzes to view it.");
    } catch (error) {
      console.error("Error generating Google Form:", error);
      toast.error("Failed to generate Google Form. Please try again.");
    } finally {
      setIsGeneratingForm(false);
    }
  };

  // Modified generateGoogleForm to open modal
  const generateGoogleForm = async () => {
    await openCommunityModal();
  };

  // Manually generate a quiz by topic
  const generateQuiz = async (e) => {
    e.preventDefault();

    if (!quizTopic.trim()) {
      toast.error("Please enter a quiz topic");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: quizTopic,
          numQuestions: numQuestions,
          difficulty: difficulty,
          userId: user?.uid || 'guest'
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate quiz");
      }

      const questions = await response.json();

      // Format quiz data
      const generatedQuizData = {
        title: `Quiz: ${quizTopic}`,
        description: `Test your knowledge of ${quizTopic} with this ${difficulty} difficulty quiz.`,
        questions: questions
      };

      setQuizData(generatedQuizData);
      setUserAnswers(new Array(questions.length).fill(null));
      setShowQuizForm(false);
      toast.success("Quiz generated successfully!");

    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error("Failed to generate quiz. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex);

    // Save the answer
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setUserAnswers(newAnswers);
  };

  const goToNextQuestion = () => {
    if (selectedOption === null) {
      toast.error("Please select an answer");
      return;
    }

    if (currentQuestionIndex < quizData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // selectedOption will be set by useEffect
    } else {
      // This is the last question, calculate score
      calculateScore();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // selectedOption will be set by useEffect
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    const correct = [];
    const incorrect = [];

    quizData.questions.forEach((question, index) => {
      const userAnswer = userAnswers[index];
      const correctOptionIndex = question.options.findIndex(
        option => option === question.correctOption
      );
      if (userAnswer !== null && userAnswer === correctOptionIndex) {
        correctCount++;
        correct.push({
          question: question.question,
          userAnswer: question.options[userAnswer],
          correctAnswer: question.correctOption,
          index,
        });
      } else {
        incorrect.push({
          question: question.question,
          userAnswer: userAnswer !== null ? question.options[userAnswer] : "No answer",
          correctAnswer: question.correctOption,
          index,
        });
      }
    });

    setAnswerBreakdown({ correct, incorrect });

    const finalScore = Math.round((correctCount / quizData.questions.length) * 100);
    setScore(finalScore);
    setQuizCompleted(true);
  };

  const returnToFlashcards = () => {
    navigate("/flashcards");
  };

  const retakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setUserAnswers(new Array(quizData.questions.length).fill(null));
    setQuizCompleted(false);
  };

  // New function to generate and save quiz PDF
  const generateQuizPdf = async () => {
    if (!quizData || !quizData.questions) {
      toast.error("No quiz data available");
      return;
    }

    setIsGeneratingPdf(true);
    try {
      // First API call to generate PDF
      const response = await fetch(`${API_BASE_URL}/quiz-gform/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email:user.email,
          quizTitle: quizData.title || "Quiz Assessment",
          questionAnswers: quizData.questions
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      const pdfData = await response.json();
      setQuizPdfUrl(pdfData.url);

      // Second API call to save PDF URL to Firebase
      try {
        const saveResponse = await fetch(`${API_BASE_URL}/quiz-gform/save-pdf-url`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uid: user?.uid || "guest",
            pdfurl: pdfData.url,
            quizTitle: quizData.title || "Quiz Assessment",
          }),
        });
 console.log(saveResponse)
        if (!saveResponse.ok) {
          console.warn("PDF generated successfully, but failed to save PDF URL");
        }
      } catch (saveError) {
        console.error("Error saving PDF URL:", saveError);
        // Don't throw here - we still want to show success for the PDF generation
      }

      toast.success("Quiz PDF generated and saved successfully!");
    } catch (error) {
      console.error("Error generating Quiz PDF:", error);
      toast.error("Failed to generate Quiz PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Toggle between quiz modes
  const toggleQuizDisplay = () => {
    setShowAllQuestions(!showAllQuestions);
  };

  // Replace the inline QuizCreationForm with the component and pass state/handlers as props
  if (showQuizForm) {
    return (
      <QuizCreationForm
        quizTopic={quizTopic}
        setQuizTopic={setQuizTopic}
        numQuestions={numQuestions}
        setNumQuestions={setNumQuestions}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        isGenerating={isGenerating}
        generateQuiz={generateQuiz}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-400 mb-4">Quiz Not Available</h2>
        <p className="text-gray-400 mb-6">There was a problem loading the quiz.</p>
        <button
          onClick={() => setShowQuizForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg mr-4"
        >
          Create New Quiz
        </button>
        <button
          onClick={() => navigate('/flashcards')}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg"
        >
          Go to Flashcards
        </button>
      </div>
    );
  }

  if (quizCompleted) {
    // Chart data
    const total = quizData.questions.length;
    const correctNum = answerBreakdown.correct.length;
    const incorrectNum = answerBreakdown.incorrect.length;

    const pieData = {
      labels: ["Correct", "Incorrect"],
      datasets: [
        {
          data: [correctNum, incorrectNum],
          backgroundColor: ["#10B981", "#EF4444"],
          borderColor: ["#10B981", "#EF4444"],
          borderWidth: 2,
        },
      ],
    };

    const barData = {
      labels: ["Correct", "Incorrect"],
      datasets: [
        {
          label: "Questions",
          data: [correctNum, incorrectNum],
          backgroundColor: ["#10B981", "#EF4444"],
          borderRadius: 8,
          barThickness: 40,
        },
      ],
    };

    const chartOptions = {
      plugins: {
        legend: {
          display: true,
          position: "bottom",
          labels: {
            color: "#fff",
            font: { size: 14 }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#fff", font: { size: 14 } },
          grid: { color: "#374151" },
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#fff", font: { size: 14 }, stepSize: 1 },
          grid: { color: "#374151" },
        },
      },
    };

    return (
      <div className="w-full max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-[#18182f] to-[#1a1a2e] p-8 rounded-2xl shadow-xl border border-purple-500/30"
        >
          <h2 className="text-2xl font-bold text-center text-purple-400 mb-6">Quiz Results</h2>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <Pie data={pieData} options={chartOptions} />
              <div className="text-lg text-gray-300 mt-4">
                <span className="text-green-400 font-semibold">{correctNum}</span> correct /
                <span className="text-red-400 font-semibold"> {incorrectNum}</span> incorrect
              </div>
            </div>
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <Bar data={barData} options={chartOptions} />
              <div className="text-5xl font-bold mb-2 text-blue-200 mt-4">
                {score}%
              </div>
              <div className="mt-2">
                {score >= 80 ? (
                  <span className="text-green-400 font-semibold">Excellent! You have a strong understanding of this topic.</span>
                ) : score >= 60 ? (
                  <span className="text-yellow-400 font-semibold">Good job! You're on the right track, but there's room for improvement.</span>
                ) : (
                  <span className="text-red-400 font-semibold">You might want to review this topic more thoroughly.</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-lg font-bold text-green-300 mb-2">Correct Answers</h3>
              {answerBreakdown.correct.length === 0 ? (
                <div className="text-gray-400">No correct answers.</div>
              ) : (
                <ul className="list-disc list-inside text-green-200 space-y-2">
                  {answerBreakdown.correct.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">Q:</span> {item.question}
                      <br />
                      <span className="font-semibold">Your Answer:</span> {item.userAnswer}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-300 mb-2">Incorrect Answers</h3>
              {answerBreakdown.incorrect.length === 0 ? (
                <div className="text-gray-400">No incorrect answers.</div>
              ) : (
                <ul className="list-disc list-inside text-red-200 space-y-2">
                  {answerBreakdown.incorrect.map((item, idx) => (
                    <li key={idx}>
                      <span className="font-semibold">Q:</span> {item.question}
                      <br />
                      <span className="font-semibold">Your Answer:</span> {item.userAnswer}
                      <br />
                      <span className="font-semibold">Correct Answer:</span> {item.correctAnswer}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={retakeQuiz}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg flex items-center gap-2"
            >
              Retake Quiz
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowQuizForm(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded-lg flex items-center gap-2"
            >
              Create New Quiz
            </motion.button>

            {fromFlashcards && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={returnToFlashcards}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg flex items-center gap-2"
              >
                <FaArrowLeft className="h-3 w-3" />
                Back to Flashcards
              </motion.button>
            )}

            {fromNotes && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/notes")}
                className="bg-green-600 hover:bg-green-700 text-white py-2 px-6 rounded-lg flex items-center gap-2"
              >
                <FaArrowLeft className="h-3 w-3" />
                Back to Notes
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Modal for selecting a community with custom styled dropdown
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

    const selectCommunity = (id, name) => {
      setSelectedCommunityID(id);
      setIsOpen(false);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-gradient-to-br from-[#23234a] to-[#1e1e3f] p-7 rounded-2xl shadow-2xl border border-purple-500/40 w-full max-w-sm">
          <h2 className="text-xl font-bold text-center bg-gradient-to-r from-purple-300 to-blue-300 text-transparent bg-clip-text mb-5">Select Community</h2>
          {communityOptions.length > 0 ? (
            <>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-purple-300 mb-2">Choose a community:</label>
                <div className="relative" ref={dropdownRef}>
                  {/* Custom dropdown trigger button */}
                  <button
                    type="button"
                    className="w-full p-4 pl-5 pr-10 rounded-lg bg-gradient-to-b from-[#1c1c38] to-[#18182f] text-white border border-purple-500/40
                      hover:border-purple-400/70 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 focus:outline-none
                      shadow-inner shadow-purple-900/20 transition-all duration-200 font-medium text-left flex items-center justify-between"
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
                    <svg className={`w-5 h-5 text-purple-400 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
                      viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 111.414 1.414l-4 4a1 1 01-1.414 0l-4-4a1 1 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Custom dropdown menu */}
                  {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-gradient-to-b from-[#2a2a5a] to-[#23234a] rounded-lg shadow-xl border border-purple-500/40 overflow-hidden max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-gray-800/30">
                      <ul className="py-2" role="listbox">
                        {communityOptions.map(opt => (
                          <li
                            key={opt.id}
                            role="option"
                            aria-selected={selectedCommunityID === opt.id}
                            className={`px-5 py-3 cursor-pointer flex items-center transition-colors
                              ${selectedCommunityID === opt.id
                                ? "bg-purple-600/30 text-white"
                                : "text-gray-200 hover:bg-purple-500/20"}
                              ${communityOptions.indexOf(opt) !== communityOptions.length - 1 ? "border-b border-purple-500/10" : ""}`}
                            onClick={() => selectCommunity(opt.id, opt.name)}
                          >
                            <span className="flex-1">{opt.name}</span>
                            {selectedCommunityID === opt.id && (
                              <svg className="w-5 h-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-purple-300/70 italic">The quiz will be shared with members of this community</p>
              </div>
              <div className="flex gap-3">
                <button
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white px-4 py-3 rounded-lg font-semibold flex-1 transition-all shadow-lg shadow-purple-700/20 disabled:opacity-50 disabled:pointer-events-none"
                  disabled={!selectedCommunityID || isGeneratingForm}
                  onClick={async () => {
                    setShowCommunityModal(false);
                    await generateGoogleFormWithCommunity(selectedCommunityID);
                  }}
                >
                  {isGeneratingForm ? 'Generating...' : 'Generate Form'}
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
              <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30 mb-5">
                <p className="text-sm">No communities found. You must join or create a community first.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/communities"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-semibold flex-1 transition-all shadow-lg shadow-purple-700/20"
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

  if (!showAllQuestions && quizData) {
    // Calculate progress: only count answered questions (userAnswers not null)
    const answeredCount = userAnswers.filter(ans => ans !== null).length;
    const progress = quizData.questions.length === 0 ? 0 : Math.round((answeredCount / quizData.questions.length) * 100);

    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-3">
            {quizData.title}
          </h1>
          <p className="text-gray-400">{quizData.description}</p>

          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <button
              onClick={generateGoogleForm}
              disabled={isGeneratingForm}
              className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg
                ${isGeneratingForm ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isGeneratingForm ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Form...
                </>
              ) : (
                <>
                  <FaGoogle />
                  Generate Google Form
                </>
              )}
            </button>

            <button
              onClick={generateQuizPdf}
              disabled={isGeneratingPdf}
              className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg
                ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isGeneratingPdf ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving as PDF...
                </>
              ) : (
                <>
                  <FaFilePdf className="text-sm" />
                  Save as PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Show Go Take Quiz button if googleFormUrl is available */}
        {googleFormUrl && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={googleFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              Go Take Quiz
            </a>
          </div>
        )}

        {/* Show View PDF button if quizPdfUrl is available */}
        {quizPdfUrl && (
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href={quizPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <FaFilePdf className="text-sm" />
              View PDF
            </a>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-purple-400 font-medium">
              Question {currentQuestionIndex + 1}/{quizData.questions.length}
            </span>
            <span className="text-gray-400 text-sm">
              {progress}% completed
            </span>
          </div>
          <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-[#18182f] to-[#1a1a2e] p-6 rounded-2xl shadow-xl border border-purple-500/30 mb-6"
        >
          <h2 className="text-xl font-medium text-white mb-6">{quizData.questions[currentQuestionIndex].question}</h2>

          <div className="space-y-3 mb-6">
            {quizData.questions[currentQuestionIndex].options.map((option, index) => (
              <div
                key={index}
                onClick={() => handleOptionSelect(index)}
                className={`p-4 rounded-xl cursor-pointer transition-all border
                  ${selectedOption === index
                    ? "bg-purple-600/30 border-purple-500"
                    : "bg-gray-800/50 border-gray-700 hover:bg-gray-700/50"}`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-5 h-5 flex items-center justify-center rounded-full mr-3
                      ${selectedOption === index ? "bg-purple-500" : "bg-gray-700"}`}
                  >
                    {selectedOption === index && <FaCheck className="text-xs text-white" />}
                  </div>
                  <div className="text-gray-200">{option}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-between mt-6">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={goToPreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg flex items-center gap-1
              ${currentQuestionIndex === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaChevronLeft className="h-3 w-3" />
            Previous
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={goToNextQuestion}
            disabled={selectedOption === null}
            className={`bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg flex items-center gap-2
              ${selectedOption === null ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {currentQuestionIndex === quizData.questions.length - 1 ? "Finish Quiz" : "Next"}
            <FaChevronRight className="h-3 w-3" />
          </motion.button>
        </div>
        {showCommunityModal && <CommunityModal />}
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text mb-3">
          {quizData ? quizData.title : "Quiz"}
        </h1>
        <p className="text-gray-400 mb-4">{quizData ? quizData.description : ""}</p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={toggleQuizDisplay}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg"
          >
            Take Quiz
          </button>

          <button
            onClick={generateGoogleForm}
            disabled={isGeneratingForm}
            className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg
              ${isGeneratingForm ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isGeneratingForm ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Form...
              </>
            ) : (
              <>
                <FaGoogle />
                Generate Google Form
              </>
            )}
          </button>

          <button
            onClick={generateQuizPdf}
            disabled={isGeneratingPdf}
            className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg
              ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isGeneratingPdf ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving as PDF...
              </>
            ) : (
              <>
                <FaFilePdf className="text-sm" />
                Save as PDF
              </>
            )}
          </button>
        </div>

        {googleFormUrl && (
          <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 mb-3">
              Google Form created successfully! You can take the assessment now or
              <Link to="/all-quizzes" className="ml-1 underline font-medium">
                view it in All Quizzes
              </Link>.
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <a
                href={googleFormUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
              >
                Go Take Assessment
              </a>
              <Link
                to="/all-quizzes"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
              >
                View in All Quizzes
              </Link>
            </div>
          </div>
        )}

        {quizPdfUrl && (
          <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-green-300 mb-3">
              PDF saved successfully!
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <a
                href={quizPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
              >
                <FaFilePdf className="h-4 w-4" /> View PDF
              </a>
              <Link
                to="/activity"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold inline-flex items-center gap-2"
              >
                Go to Activity
              </Link>
            </div>
          </div>
        )}
      </div>

      {quizData && quizData.questions && (
        <div className="space-y-8">
          {quizData.questions.map((question, qIndex) => (
            <motion.div
              key={qIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: qIndex * 0.1 }}
              className="bg-gradient-to-br from-[#18182f] to-[#1a1a2e] p-6 rounded-2xl shadow-xl border border-purple-500/30"
            >
              <h2 className="text-xl font-medium text-white mb-4">
                {qIndex + 1}. {question.question}
              </h2>

              <div className="space-y-3 mb-3">
                {question.options.map((option, oIndex) => {
                  const isCorrect = option === question.correctOption;
                  return (
                    <div
                      key={oIndex}
                      className={`p-4 rounded-xl border ${
                        isCorrect
                          ? "bg-green-600/20 border-green-500"
                          : "bg-gray-800/50 border-gray-700"
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 flex items-center justify-center rounded-full mr-3 ${
                          isCorrect ? "bg-green-500" : "bg-gray-700"
                        }`}>
                          {isCorrect && <FaCheck className="text-xs text-white" />}
                        </div>
                        <div className={`${isCorrect ? "text-green-300" : "text-gray-300"}`}>{option}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-xs text-purple-300">
                <span className="font-semibold">Correct answer:</span> {question.correctOption}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Quiz;
