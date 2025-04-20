import { useState } from "react";
import { motion } from "framer-motion";
import { FaGoogle, FaEnvelope, FaUser, FaLock, FaCheck } from "react-icons/fa";
import { useAuth } from "./FirebaseAuthContext";

export default function AuthForm({ initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, signInWithGoogle } = useAuth();

  // Animation variants
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  };

  // Toggle between sign in and sign up modes
  const handleToggleMode = () => {
    setMode((prev) => (prev === "signup" ? "signin" : "signup"));
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError("");
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-in
  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#141428]/30 backdrop-blur-sm p-8 rounded-[2rem] border border-gray-700/50 shadow-xl relative overflow-hidden">
      {/* Decorative wavey background element */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-96 opacity-20">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute h-full w-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                  fill="#3498db" fillOpacity="0.2"></path>
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-96 opacity-10 transform rotate-180">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute h-full w-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
                  fill="#9b59b6" fillOpacity="0.2"></path>
          </svg>
        </div>
      </div>

      <motion.div
        key="auth-form"
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.button
          onClick={handleToggleMode}
          className="w-full flex justify-center items-center gap-2 mb-6 bg-[#1a1a2e]/50 text-gray-300 hover:text-white py-2 px-6 rounded-full transition-colors border border-gray-700/50 hover:border-gray-600/50 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-sm">
            {mode === "signup" ? "Already have an account?" : "Need an account?"}
          </span>
          <span className="text-sm font-medium text-cyan-400 group-hover:text-cyan-300">
            {mode === "signup" ? "Sign In" : "Sign Up"}
          </span>
        </motion.button>

        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl mb-6 text-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-300 mb-1 gap-2 pl-2">
              <FaEnvelope className="text-cyan-500" />
              <span>Email Address</span>
            </label>
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={isLoading}
                className="w-full p-3 pl-5 rounded-full bg-[#1a1a2e]/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-gray-700/50 focus:border-cyan-500/50 transition-all duration-200"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
            </motion.div>
          </div>

          {mode === "signup" && (
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <label htmlFor="displayName" className="flex items-center text-sm font-medium text-gray-300 mb-1 gap-2 pl-2">
                <FaUser className="text-cyan-500" />
                <span>Display Name</span>
              </label>
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
              >
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your Name"
                  required
                  disabled={isLoading}
                  className="w-full p-3 pl-5 rounded-full bg-[#1a1a2e]/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-gray-700/50 focus:border-cyan-500/50 transition-all duration-200"
                />
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
              </motion.div>
            </motion.div>
          )}

          <div className="space-y-2">
            <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-300 mb-1 gap-2 pl-2">
              <FaLock className="text-cyan-500" />
              <span>Password</span>
            </label>
            <motion.div
              className="relative group"
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 300, damping: 10 }}
            >
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                disabled={isLoading}
                className="w-full p-3 pl-5 rounded-full bg-[#1a1a2e]/60 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 border border-gray-700/50 focus:border-cyan-500/50 transition-all duration-200"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
            </motion.div>
          </div>

          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-3 px-4 rounded-full transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-500 shadow-lg shadow-cyan-500/10"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FaEnvelope className="mr-2" />
                <span>{mode === "signup" ? "Sign Up" : "Sign In"}</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Wavy divider */}
        <div className="my-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full opacity-20">
              <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-5">
                <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" className="fill-current text-gray-600"></path>
              </svg>
            </div>
          </div>
          <div className="relative flex justify-center text-sm z-10">
            <span className="px-4 bg-[#141428] text-gray-400 rounded-full border border-gray-700/30">Or continue with</span>
          </div>
        </div>

        <motion.button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 bg-[#1a1a2e]/70 text-white py-3 px-4 rounded-full transition-all hover:shadow-lg hover:shadow-red-500/10 border border-gray-700/50 hover:border-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          <FaGoogle className="text-red-400" />
          <span>Google</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
