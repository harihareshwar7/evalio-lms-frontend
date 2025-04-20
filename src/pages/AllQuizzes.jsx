import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaRegClock, FaChartBar, FaUser } from "react-icons/fa";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { Pie, Bar } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { API_BASE_URL } from "../constants/api";

Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function AllQuizzes() {
  const [quizForms, setQuizForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedScore, setSelectedScore] = useState(null);
  const [selectedMeta, setSelectedMeta] = useState(null);
  const [selectedInsights, setSelectedInsights] = useState(null);
  const [questions, setQuestions] = useState([]); // New state for questions
  const [checkingResult, setCheckingResult] = useState({});
  const [resultError, setResultError] = useState({});
  const [communityQuizzes, setCommunityQuizzes] = useState([]); // [{communityID, communityName, quizzes: []}]
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const { user } = useAuth();
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setCommunitiesLoading(true);
      try {
        // 1. Fetch all quizzes
        const quizRes = await fetch(`${API_BASE_URL}/quiz-gform/fetch-form-details`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!quizRes.ok) throw new Error("Failed to fetch quiz forms");
        const allQuizzes = await quizRes.json();

        // 2. Fetch user's subscribed communities
        if (!user?.uid) {
          setCommunityQuizzes([]);
          setLoading(false);
          setCommunitiesLoading(false);
          return;
        }
        const commRes = await fetch(`${API_BASE_URL}/community/subscribed-communities`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid })
        });
        if (!commRes.ok) throw new Error("Failed to fetch communities");
        const commData = await commRes.json();
        const commIDs = commData["subscribed-communities"] || [];
        if (commIDs.length === 0) {
          setCommunityQuizzes([]);
          setLoading(false);
          setCommunitiesLoading(false);
          return;
        }
        // 3. For each community, fetch its details
        const commDetails = {};
        for (const cid of commIDs) {
          try {
            const detRes = await fetch(`${API_BASE_URL}/community/fetch-community`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ communityID: cid })
            });
            const detData = await detRes.json();
            if (detData.community) {
              commDetails[cid] = detData.community.communityName || cid;
            } else {
              commDetails[cid] = cid;
            }
          } catch {
            commDetails[cid] = cid;
          }
        }
        // 4. Group quizzes by communityID, only for user's communities
        const grouped = commIDs.map(cid => {
          const quizzes = allQuizzes.filter(q => q.communityID === cid);
          return {
            communityID: cid,
            communityName: commDetails[cid],
            quizzes
          };
        });
        setCommunityQuizzes(grouped);
      } catch (error) {
        toast.error("Failed to load quizzes or communities");
        setCommunityQuizzes([]);
      } finally {
        setLoading(false);
        setCommunitiesLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line
  }, [user]);

  const handleViewResults = async (sheetId, communityID, formId, form) => {
    if (!user || !user.email) {
      toast.error("You must be logged in to view results");
      return;
    }

    const uniqueKey = `${communityID}-${formId}`;

    setCheckingResult(prev => ({ ...prev, [uniqueKey]: true }));
    setResultError(prev => ({ ...prev, [uniqueKey]: null }));
    try {
      const response = await fetch(`${API_BASE_URL}/quiz-gform/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId,
          email: user.email
        })
      });
      const data = await response.json();

      if (!data || !data.score || typeof data.score.correct !== "number") {
        setResultError(prev => ({ ...prev, [uniqueKey]: "complete quiz to view report" }));
        setSelectedScore(null);
        setSelectedMeta(null);
        setSelectedInsights(null);
        setQuestions([]); // Clear questions when no valid data
        return;
      }

      // Set questions array separately
      setQuestions(data.questions || []);

      let insights = null;
      try {
        const reviewRes = await fetch(`${API_BASE_URL}/quiz-gform/review-quiz`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const reviewData = await reviewRes.json();
        if (reviewData && reviewData.geminiInsights) {
          insights = reviewData.geminiInsights;
        }
      } catch (e) {
        insights = null;
      }

      setSelectedScore(data.score);
      setSelectedMeta({
        timestamp: form.createdAt,
        quizTitle: form.quizTitle,
      });
      setSelectedInsights(insights);
    } catch (err) {
      setResultError(prev => ({ ...prev, [uniqueKey]: "Something went wrong" }));
      setSelectedScore(null);
      setSelectedMeta(null);
      setSelectedInsights(null);
      setQuestions([]); // Clear questions on error
    } finally {
      setCheckingResult(prev => ({ ...prev, [uniqueKey]: false }));
    }
  };

  const closeReport = () => {
    setSelectedScore(null);
    setSelectedMeta(null);
    setSelectedInsights(null);
    setQuestions([]); // Clear questions when closing report
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    if (timestamp.seconds) {
      const date = new Date(timestamp.seconds * 1000);
      return formatDistanceToNow(date, { addSuffix: true });
    }
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const isCreatedByCurrentUser = (formEmail, formUid) => {
    if (!user) return false;
    return formUid === user.uid || formEmail === user.email;
  };

  // Helper to check and add page break if needed
  const ensureSpace = (doc, y, needed = 40) => {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      return 20;
    }
    return y;
  };

  // Helper to draw a dark background box for images/charts, centered
  const drawDarkBoxCentered = (doc, y, w, h) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const x = (pageWidth - w) / 2;
    doc.setFillColor(30, 41, 59); // Tailwind slate-800
    doc.roundedRect(x - 4, y - 4, w + 8, h + 8, 6, 6, "F");
    return x;
  };

  const handleSaveAsPdf = async () => {
    if (!selectedScore || !selectedMeta || !user) return;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    const heading = (text, y, color = "#3B82F6") => {
      doc.setFontSize(16);
      doc.setTextColor(color);
      doc.setFont(undefined, "bold");
      doc.text(text, pageWidth / 2, y, { align: "center" });
      doc.setFont(undefined, "normal");
      doc.setTextColor("#111827");
    };

    // Title
    doc.setFontSize(22);
    doc.setTextColor("#7C3AED");
    doc.setFont(undefined, "bold");
    doc.text(selectedMeta.quizTitle || "Quiz Report", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor("#374151");
    doc.setFont(undefined, "normal");
    doc.text(`Created: ${selectedMeta.timestamp ? formatDate(selectedMeta.timestamp) : ""}`, 14, 28);
    doc.text(`Score: ${selectedScore.percentage}%`, 14, 36);
    doc.text(`Correct: ${selectedScore.correct} / ${selectedScore.total}`, 14, 44);

    let y = 54;
    if (questions && questions.length > 0) {
      y = ensureSpace(doc, y, 24);
      heading("Question Review", y, "#3B82F6");
      y += 10;
      doc.setFontSize(11);
      doc.setTextColor("#111827");

      questions.forEach((q, idx) => {
        y = ensureSpace(doc, y, 32);

        // Question header with correctness indicator
        doc.setFillColor(q.isCorrect ? '#10b981' : '#ef4444');
        doc.setDrawColor(q.isCorrect ? '#10b981' : '#ef4444');
        doc.roundedRect(10, y - 4, 12, 12, 2, 2, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text(q.isCorrect ? '✓' : '✗', 16, y, { align: 'center' });

        // Question text - Split long questions into multiple lines
        doc.setFontSize(11);
        doc.setTextColor('#111827');
        doc.setFont(undefined, "bold");

        // Get available width (page width minus margins and indicator space)
        const availableWidth = pageWidth - 34; // 10px left margin + 14px indicator width + 10px right margin
        const questionLines = doc.splitTextToSize(`Q${q.questionNumber}: ${q.question}`, availableWidth);

        // Add each line of the question
        questionLines.forEach((line, lineIdx) => {
          y = ensureSpace(doc, y, 8);
          doc.text(line, 28, y);
          if (lineIdx < questionLines.length - 1) {
            y += 7; // Space between question lines
          }
        });

        doc.setFont(undefined, "normal");
        y += 10; // Extra space after question

        // User answer - handle potentially long answers
        y = ensureSpace(doc, y, 16);
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(14, y - 4, 180, 10, 1, 1, 'F');
        doc.setTextColor('#3B82F6');
        doc.text('Your Answer:', 18, y);

        doc.setTextColor('#111827');
        const userAnsLines = doc.splitTextToSize(String(q.userAnswer), 120); // Limit to available width

        if (userAnsLines.length > 1) {
          // For multi-line answers, add them below the label
          doc.text(userAnsLines[0], 60, y);
          y += 10;
          for (let i = 1; i < userAnsLines.length; i++) {
            y = ensureSpace(doc, y, 8);
            doc.text(userAnsLines[i], 18, y);
            y += 7;
          }
        } else {
          // Single line answer
          doc.text(userAnsLines[0], 60, y);
          y += 8;
        }

        // Correct answer - handle potentially long answers
        y = ensureSpace(doc, y, 16);
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(14, y - 4, 180, 10, 1, 1, 'F');
        doc.setTextColor('#10B981');
        doc.text('Correct Answer:', 18, y);

        doc.setTextColor('#111827');
        const correctAnsLines = doc.splitTextToSize(String(q.correctAnswer), 120);

        if (correctAnsLines.length > 1) {
          // For multi-line correct answers, add them below the label
          doc.text(correctAnsLines[0], 60, y);
          y += 10;
          for (let i = 1; i < correctAnsLines.length; i++) {
            y = ensureSpace(doc, y, 8);
            doc.text(correctAnsLines[i], 18, y);
            y += 7;
          }
        } else {
          // Single line answer
          doc.text(correctAnsLines[0], 60, y);
        }

        y += 18; // Extra space after each question
      });
    }

    // Pie Chart with dark box, centered, and gap after
    if (pieChartRef.current) {
      const pieUrl = pieChartRef.current.toBase64Image();
      y = ensureSpace(doc, y, 80);
      heading("Score Distribution (Pie Chart)", y, "#10B981");
      y += 10;
      const imgW = 60, imgH = 60;
      const x = drawDarkBoxCentered(doc, y, imgW, imgH);
      doc.addImage(pieUrl, "PNG", x, y, imgW, imgH);
      y += imgH + 18; // Add more gap after image
    }

    // Bar Chart with dark box, centered, and gap after
    if (barChartRef.current) {
      try {
        const barUrl = barChartRef.current.toBase64Image();
        y = ensureSpace(doc, y, 70);
        heading("Performance (Bar Chart)", y, "#6366F1");
        y += 10;
        const imgW = 90, imgH = 55;
        const x = drawDarkBoxCentered(doc, y, imgW, imgH);
        doc.addImage(barUrl, "PNG", x, y, imgW, imgH);
        y += imgH + 18;
      } catch (e) {
        // fallback: skip bar chart if error
      }
    }

    // Insights Images (if any) with dark box, centered, and gap after
    if (selectedInsights && selectedInsights.images && Array.isArray(selectedInsights.images)) {
      for (let idx = 0; idx < selectedInsights.images.length; idx++) {
        const imgUrl = selectedInsights.images[idx];
        y = ensureSpace(doc, y, 70);
        heading(`Analysis Image ${idx + 1}`, y, "#F59E42");
        y += 10;
        const imgW = 90, imgH = 55;
        const x = drawDarkBoxCentered(doc, y, imgW, imgH);
        doc.addImage(imgUrl, "PNG", x, y, imgW, imgH);
        y += imgH + 18;
      }
    }

    // AI Insights, with page breaks if needed and extra spacing
    if (selectedInsights) {
      if (selectedInsights.summary) {
        y = ensureSpace(doc, y, 24);
        heading("AI Analysis Summary", y, "#3B82F6");
        y += 10;
        doc.setFontSize(11);
        doc.setTextColor("#374151");
        const summaryLines = doc.splitTextToSize(selectedInsights.summary, 180);
        summaryLines.forEach(line => {
          y = ensureSpace(doc, y, 8);
          doc.text(line, 14, y);
          y += 7;
        });
        y += 6;
      }
      if (selectedInsights.overallPerformance) {
        y = ensureSpace(doc, y, 24);
        heading("Overall Performance", y, "#6366F1");
        y += 10;
        doc.setFontSize(11);
        doc.setTextColor("#374151");
        const perfLines = doc.splitTextToSize(selectedInsights.overallPerformance, 180);
        perfLines.forEach(line => {
          y = ensureSpace(doc, y, 8);
          doc.text(line, 14, y);
          y += 7;
        });
        y += 6;
      }
      const listSection = (title, arr, color) => {
        if (arr && arr.length > 0) {
          y = ensureSpace(doc, y, 24 + arr.length * 7);
          heading(title, y, color);
          y += 10;
          doc.setFontSize(11);
          doc.setTextColor("#374151");
          arr.forEach((item) => {
            y = ensureSpace(doc, y, 8);
            doc.text(`• ${item}`, 18, y);
            y += 7;
          });
          y += 6;
        }
      };
      listSection("Strengths", selectedInsights.strengths, "#10B981");
      listSection("Weaknesses", selectedInsights.weaknesses, "#EF4444");
      listSection("Pros", selectedInsights.pros, "#22D3EE");
      listSection("Cons", selectedInsights.cons, "#F87171");
      listSection("Recommended Focus Areas", selectedInsights.focusAreas, "#A78BFA");
      listSection("Insights", selectedInsights.insights, "#3B82F6");
      listSection("Recommendations", selectedInsights.recommendations, "#A78BFA");
    }

    // Question-by-question review


    // To get a File object:
    const pdfArrayBuffer = doc.output("arraybuffer");
    const pdfFile = new File([pdfArrayBuffer], `${selectedMeta.quizTitle ? selectedMeta.quizTitle.replace(/\s+/g, "_") : "quiz_report"}.pdf`, { type: "application/pdf" });

    // Save the file using pdfFile (download in browser)
    const url = URL.createObjectURL(pdfFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = pdfFile.name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);

    // Optionally, you can remove or comment out the doc.save() call
    // doc.save(
    //   `${selectedMeta.quizTitle ? selectedMeta.quizTitle.replace(/\s+/g, "_") : "quiz_report"}.pdf`
    // );

    // Now you have pdfFile as a File object if you need to upload or process it
  };

  const getPieData = (score) => ({
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        data: [score.correct, Math.max(0, score.total - score.correct)],
        backgroundColor: ["#10B981", "#EF4444"],
        borderColor: ["#10B981", "#EF4444"],
        borderWidth: 2,
      },
    ],
  });

  const pieOptions = {
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#fff",
          font: { size: 14 }
        }
      }
    }
  };

  const getBarData = (score) => ({
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        label: "Questions",
        data: [score.correct, Math.max(0, score.total - score.correct)],
        backgroundColor: ["#10B981", "#EF4444"],
        borderRadius: 8,
        barThickness: 40,
      },
    ],
  });

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
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

  // Helper to add bar chart with labels (define this before usage)
  const getBarDataWithLabels = (score) => ({
    labels: ["Correct", "Incorrect"],
    datasets: [
      {
        label: "Questions",
        data: [score.correct, Math.max(0, score.total - score.correct)],
        backgroundColor: ["#10B981", "#EF4444"],
        borderRadius: 8,
        barThickness: 40,
        datalabels: {
          anchor: "end",
          align: "start",
          color: "#fff",
          font: { weight: "bold", size: 16 }
        }
      },
    ],
  });

  // Bar chart options with axis labels and value labels (define before usage)
  const barOptionsWithLabels = {
    responsive: true,
    plugins: {
      legend: { display: false },
      datalabels: {
        display: true,
        color: "#fff",
        font: { weight: "bold", size: 16 }
      },
      title: {
        display: true,
        text: "Questions",
        color: "#fff",
        font: { size: 16 }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Type",
          color: "#fff",
          font: { size: 14 }
        },
        ticks: { color: "#fff", font: { size: 14 } },
        grid: { color: "#374151" },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Count",
          color: "#fff",
          font: { size: 14 }
        },
        ticks: { color: "#fff", font: { size: 14 }, stepSize: 1 },
        grid: { color: "#374151" },
      },
    },
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-4">
          All Quizzes
        </h1>
        <p className="text-gray-400">
          Browse and take quizzes created by the community
        </p>
      </div>

      {loading || communitiesLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : communityQuizzes.length === 0 ? (
        <div className="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700/50">
          <h2 className="text-xl font-medium text-gray-300 mb-4">No communities or quizzes found</h2>
          <p className="text-gray-400 mb-6">
            You are not subscribed to any communities or there are no quizzes available.<br />
            Join or create a community to get started!
          </p>
          <a
            href="/communities"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg transition"
          >
            Go to Communities
          </a>
        </div>
      ) : (
        <div className="space-y-12">
          {communityQuizzes.map(({ communityID, communityName, quizzes }) => (
            <div key={communityID}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-3xl font-extrabold text-purple-200 capitalize">
                  {communityName}
                </h2>
                <span className="ml-2 px-2 py-0.5 rounded bg-gray-800 border border-gray-600 text-xs text-gray-400 font-semibold" style={{marginTop: '6px'}}>
                  Community
                </span>
              </div>
              {quizzes.length === 0 ? (
                <div className="flex justify-center items-center mb-8" style={{minHeight: '60px'}}>
                  <span className="text-gray-400 text-center">No quizzes found for this community.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {quizzes.map((form, index) => {
                    const uniqueKey = `${communityID}-${form.id}`;

                    return (
                      <motion.div
                        key={form.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gradient-to-br from-[#1e2a3d] to-[#1a1e2e] p-6 rounded-xl shadow-lg border border-blue-500/20"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h2 className="text-xl font-bold text-blue-300">
                            {form.quizTitle || "Untitled Quiz"}
                          </h2>
                          <div className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-medium">
                            Google Form
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                          <FaUser className="text-xs" />
                          <span>
                            {isCreatedByCurrentUser(form.email, form.uid)
                              ? <span className="text-green-400 font-medium">Created by you</span>
                              : form.email || "Anonymous"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                          <FaRegClock className="text-xs" />
                          <span>{formatDate(form.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-3 mt-5">
                          <a
                            href={form.formUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            <FaGoogle />
                            Take Quiz
                          </a>
                          <button
                            onClick={() => handleViewResults(form.spreadsheetId, communityID, form.id, form)}
                            disabled={checkingResult[uniqueKey]}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors text-sm"
                          >
                            {checkingResult[uniqueKey] ? (
                              <>
                                <span className="w-3 h-3 border-t-2 border-white rounded-full animate-spin"></span>
                                Checking...
                              </>
                            ) : (
                              <>
                                <FaChartBar />
                                View Results
                              </>
                            )}
                          </button>
                          {resultError[uniqueKey] && (
                            <span className="text-red-400 text-xs ml-2">{resultError[uniqueKey]}</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedScore && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1e293b] rounded-xl shadow-2xl border border-blue-500/30 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-blue-300">Quiz Score Report</h2>
              <button
                onClick={closeReport}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="flex justify-end mb-4 gap-2">
              <button
                onClick={handleSaveAsPdf}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Save as PDF
              </button>
            </div>
            <div className="mb-8 text-center">
              <h3 className="text-xl font-semibold text-blue-200 mb-2">
                {selectedMeta?.quizTitle || "Quiz"}
              </h3>
              <div className="text-gray-400 mb-2">
                {selectedMeta?.timestamp && (
                  <>Created: {formatDate(selectedMeta.timestamp)}</>
                )}
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/2 flex justify-center">
                <Pie
                  data={getPieData(selectedScore)}
                  options={pieOptions}
                  ref={pieChartRef}
                />
              </div>
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
                <div className="text-5xl font-bold mb-2 text-blue-200">
                  {selectedScore.percentage}%
                </div>
                <div className="text-lg text-gray-300 mb-2">
                  Correct: <span className="text-green-400 font-semibold">{selectedScore.correct}</span> / <span className="text-gray-200">{selectedScore.total}</span>
                </div>
                <div className="mt-4">
                  {selectedScore.percentage >= 80 ? (
                    <span className="text-green-400 font-semibold">Excellent! 🏆</span>
                  ) : selectedScore.percentage >= 60 ? (
                    <span className="text-yellow-400 font-semibold">Good job! Keep practicing.</span>
                  ) : (
                    <span className="text-red-400 font-semibold">Needs improvement. Review the material!</span>
                  )}
                </div>
              </div>
            </div>
            {/* Question-by-question review */}
            {questions && questions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-purple-300 mb-4">Question Review</h3>
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className={`rounded-lg p-4 border text-sm flex flex-col gap-2 ${q.isCorrect ? 'bg-green-900/30 border-green-500/40' : 'bg-red-900/30 border-red-500/40'}`}
                    >
                      <div className="font-semibold text-gray-200 mb-1">Q{q.questionNumber}: {q.question}</div>
                      <div className="flex flex-col gap-2">
                        {/* Display user answer and correct answer directly */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-purple-300">Your Answer:</span>
                            <span className={`px-3 py-1 rounded ${q.isCorrect ? 'bg-green-800/40 text-green-200' : 'bg-purple-800/40 text-purple-200'}`}>
                              {String(q.userAnswer)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-green-300">Correct Answer:</span>
                            <span className="px-3 py-1 rounded bg-green-800/40 text-green-200">
                              {String(q.correctAnswer)}
                            </span>
                          </div>
                          <div className="mt-1">
                            <span className={`px-3 py-1 rounded text-xs font-semibold ${q.isCorrect ? 'bg-green-700/50 text-green-200' : 'bg-red-700/50 text-red-200'}`}>
                              {q.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedInsights && (
              <div className="mt-8 space-y-6">
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">AI Analysis Summary</h3>
                  <p className="text-gray-300">{selectedInsights.summary}</p>
                  {selectedInsights.overallPerformance && (
                    <div className="mt-2 text-blue-200">{selectedInsights.overallPerformance}</div>
                  )}
                </div>
                {selectedInsights.strengths && selectedInsights.strengths.length > 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-300 mb-2">Strengths</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsights.weaknesses && selectedInsights.weaknesses.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Weaknesses</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.weaknesses.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsights.pros && selectedInsights.pros.length > 0 && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-300 mb-2">Pros</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.pros.map((pro, idx) => (
                        <li key={idx}>{pro}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsights.cons && selectedInsights.cons.length > 0 && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-red-300 mb-2">Cons</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.cons.map((con, idx) => (
                        <li key={idx}>{con}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsights.focusAreas && selectedInsights.focusAreas.length > 0 && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Recommended Focus Areas</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.focusAreas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsights.insights && selectedInsights.insights.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">Insights</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.insights.map((ins, idx) => (
                        <li key={idx}>{ins}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedInsights.recommendations && selectedInsights.recommendations.length > 0 && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-300 mb-2">Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-300">
                      {selectedInsights.recommendations.map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="bg-gray-900/20 border border-gray-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">Performance Bar Chart</h3>
                  <Bar
                    data={getBarDataWithLabels(selectedScore)}
                    options={barOptionsWithLabels}
                    ref={barChartRef}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AllQuizzes;
