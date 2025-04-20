import { Link } from "react-router-dom";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import { motion } from "framer-motion";
import { FaLightbulb, FaQuestionCircle, FaBook, FaHistory, FaRobot, FaUsers } from "react-icons/fa";
import Button from "../components/UI/Button";
import { useEffect } from "react";

function Home() {
  const { user } = useAuth();

  useEffect(() => {
    // This effect will run every time the user object changes (including login, logout, or profile update)
    // Any code here will "reload" (re-run) on user change
    // Example: console.log("User changed:", user);
  }, [user]);

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full max-w-6xl">
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Welcome to <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Evalio LMS</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Your intelligent learning partner. Master any subject with AI-powered tools.
        </p>

        {user && (
          <div className="mt-4 inline-block px-4 py-2 rounded-full bg-gradient-to-r from-cyan-900/20 to-blue-900/20 text-cyan-300 text-sm border border-cyan-800/30">
            {user.displayName ? (
              <>Welcome back, {user.displayName}!</>
            ) : (
              <>Signed in as: {user.email}</>
            )}
          </div>
        )}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <FeatureCard
          icon={<FaLightbulb />}
          title="Flashcards"
          description="Create and study interactive flashcards to boost your memory retention and recall."
          to="/flashcards"
          color="cyan"
          variants={item}
        />
        <FeatureCard
          icon={<FaQuestionCircle />}
          title="Quiz"
          description="Test your knowledge with interactive quizzes on any topic."
          to="/quiz"
          color="violet"
          variants={item}
        />
        <FeatureCard
          icon={<FaBook />}
          title="AI Notes"
          description="Generate comprehensive study notes and summaries using AI technology."
          to="/notes"
          color="emerald"
          variants={item}
        />
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-8"
        variants={container}
        initial="hidden"
        animate="show"
        transition={{ delay: 0.3 }}
      >
        <FeatureCard
          icon={<FaHistory />}
          title="Activity"
          description="Track your learning progress and revisit all your saved flashcards, notes, and quiz content."
          to="/activity"
          color="amber"
          variants={item}
        />
        <FeatureCard
          icon={<FaRobot />}
          title="AI Assistant"
          description="Get personalized help with your studies using our intelligent RAG-based chatbot."
          to="/chatbot"
          color="indigo"
          variants={item}
        />
        <FeatureCard
          icon={<FaUsers />}
          title="Community"
          description="Create or join learning communities to share quizzes and collaborate with other learners."
          to="/communities"
          color="rose"
          variants={item}
        />
      </motion.div>

      <motion.div
        className="mt-12 bg-[#12121e]/60 p-8 rounded-xl border border-gray-800/50 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 text-transparent bg-clip-text mb-4">Get Started</h3>
        <p className="text-gray-300 mb-6">Choose one of our learning tools to begin your learning journey:</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <Button as={Link} to="/flashcards" variant="primary">
            Create Flashcards
          </Button>
          <Button as={Link} to="/quiz" variant="secondary">
            Start a Quiz
          </Button>
          <Button as={Link} to="/notes" variant="success">
            Generate Notes
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button as={Link} to="/activity" variant="primary">
            View Activity
          </Button>
          <Button as={Link} to="/chatbot" variant="secondary">
            Chat with AI
          </Button>
          <Button as={Link} to="/communities" variant="success">
            Join Communities
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Feature card component
function FeatureCard({ icon, title, description, to, color, variants }) {
  const gradients = {
    cyan: "from-cyan-500/20 to-blue-500/20 border-cyan-500/30 hover:from-cyan-500/30 hover:to-blue-500/30",
    violet: "from-violet-500/20 to-purple-500/20 border-violet-500/30 hover:from-violet-500/30 hover:to-purple-500/30",
    emerald: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/30",
    amber: "from-amber-500/20 to-yellow-500/20 border-amber-500/30 hover:from-amber-500/30 hover:to-yellow-500/30",
    indigo: "from-indigo-500/20 to-blue-600/20 border-indigo-500/30 hover:from-indigo-500/30 hover:to-blue-600/30",
    rose: "from-rose-500/20 to-pink-500/20 border-rose-500/30 hover:from-rose-500/30 hover:to-pink-500/30"
  };

  const textColors = {
    cyan: "text-cyan-400",
    violet: "text-violet-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    indigo: "text-indigo-400",
    rose: "text-rose-400"
  };

  return (
    <motion.div variants={variants}>
      <Link
        to={to}
        className={`block p-6 bg-gradient-to-br ${gradients[color]} border rounded-xl backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-${color}-500/10 group h-full`}
      >
        <div className={`flex items-center justify-center mb-4 h-14 w-14 rounded-xl ${textColors[color]} text-2xl mx-auto bg-gray-800/50 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className={`text-xl font-bold ${textColors[color]} mb-3 text-center`}>{title}</h3>
        <p className="text-gray-300 text-center">{description}</p>
      </Link>
    </motion.div>
  );
}

export default Home;
