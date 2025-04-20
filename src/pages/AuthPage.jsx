import { useState } from "react";
import { motion } from "framer-motion";
import AuthForm from "../components/Auth/AuthForm";
import { FaLightbulb, FaQuestionCircle, FaBook, FaGraduationCap } from "react-icons/fa";

function AuthPage({ initialView = "sign-in" }) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  // Floating elements animation
  const floatingAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "reverse"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden relative">
      {/* Curved divider */}
      <div className="absolute inset-0 z-0 pointer-events-none hidden md:block">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
            style={{ transform: 'scaleX(-1)' }} // Flip horizontally
          >
            <path
              d="M0,0 C40,50 60,100 100,100 L0,100 Z"
              fill="#0f0f19"
              className="transition-all duration-1000 ease-in-out"
            />
          </svg>
        </div>
      </div>

      {/* Left Side - Auth Form */}
      <motion.div
        className="w-full md:w-5/12 flex-shrink-0 flex justify-center items-center bg-[#0f0f19] p-4 md:p-8 relative z-10"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="w-full max-w-md">
          <motion.div
            className="text-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.h1
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Evalio LMS
            </motion.h1>
            <p className="text-gray-400">
              {initialView === "sign-up" ? "Join our learning community" : "Welcome back, learner"}
            </p>
          </motion.div>

          <AuthForm initialMode={initialView === "sign-up" ? "signup" : "signin"} />

          <motion.div
            className="mt-8 text-center text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Side - Features Display */}
      <motion.div
        className="hidden md:flex md:w-7/12 flex-col justify-center items-center bg-gradient-to-br from-[#111125] to-[#0d1a2d] p-8 relative overflow-hidden"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Background decorative elements with more organic shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          {/* Blob shapes instead of circles */}
          <motion.div
            className="absolute top-[10%] left-[10%] w-64 h-64 opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
              rotate: [0, 10, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#3498db" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-1.5C87,13.3,81.3,26.6,73.6,38.6C65.9,50.6,56.1,61.3,44,67.6C31.9,73.9,15.9,75.8,0.4,75.2C-15.1,74.5,-30.2,71.3,-43.7,64.6C-57.2,57.8,-69,47.6,-76.1,34.9C-83.1,22.2,-85.3,7,-83.2,-7.3C-81,-21.6,-74.4,-35,-65.5,-47.2C-56.5,-59.5,-45.3,-70.7,-32.3,-78.3C-19.3,-85.9,-4.7,-89.8,8.9,-88.1C22.4,-86.3,44.8,-78.9,58.5,-76.3C72.3,-73.7,87.6,-75.9,94.4,-69.7C101.1,-63.5,99.4,-48.9,99.5,-35.6C99.7,-22.3,101.8,-10.3,98.8,-0.2C95.8,9.8,87.7,17.7,82,28.1C76.3,38.5,72.9,51.4,65.2,61.8C57.5,72.2,45.6,80.1,33.3,83.7C21.1,87.3,8.5,86.5,-2.7,83.1C-13.9,79.6,-23.9,73.5,-33.9,67.4C-44,61.3,-54.1,55.3,-61.2,46.4C-68.3,37.6,-72.5,25.9,-76.6,13.4C-80.7,0.9,-84.7,-12.3,-83.2,-24.5C-81.7,-36.7,-74.6,-47.8,-65.1,-56.7C-55.6,-65.5,-43.6,-72.1,-31.3,-74.9C-19,-77.7,-6.3,-76.8,6.3,-75.4C19,-74,38,-72.1,44.7,-64.1Z" transform="translate(100 100)"></path>
            </svg>
          </motion.div>

          <motion.div
            className="absolute bottom-[20%] right-[15%] w-72 h-72 opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              rotate: [0, -10, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#9b59b6" d="M47.7,-79.1C62.9,-71.3,77,-60.3,83.4,-45.9C89.9,-31.4,88.7,-13.4,82.5,1.1C76.3,15.7,65.2,26.9,54.5,38C43.9,49.1,33.7,60.1,20.3,68.5C6.9,76.9,-9.5,82.8,-24,79.3C-38.5,75.8,-51.1,63,-62.3,49.1C-73.4,35.3,-83.1,20.5,-86.9,3.9C-90.7,-12.7,-88.5,-31.1,-79.3,-46C-70.1,-60.9,-53.9,-72.3,-37.8,-79.8C-21.7,-87.4,-5.4,-91,9.7,-87.5C24.9,-84,38.9,-73.3,47.7,-79.1Z" transform="translate(100 100)"></path>
            </svg>
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          className="relative z-10 text-center max-w-lg"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <motion.div
              className="w-20 h-20 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-6"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.8 }}
            >
              <FaGraduationCap className="text-white text-3xl" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">Supercharge Your Learning</h2>
            <p className="text-gray-300">Evalio LMS uses AI to help you learn faster and retain more</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-[#1a1a2e]/40 p-5 rounded-xl border border-cyan-500/20 backdrop-blur-sm"
            >
              <motion.div {...floatingAnimation} className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mb-3">
                  <FaLightbulb className="text-cyan-400 text-xl" />
                </div>
              </motion.div>
              <h3 className="text-cyan-400 font-medium mb-2">Flashcards</h3>
              <p className="text-sm text-gray-400">Interactive cards to boost memory retention</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-[#1a1a2e]/40 p-5 rounded-xl border border-purple-500/20 backdrop-blur-sm"
            >
              <motion.div {...floatingAnimation} className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                  <FaQuestionCircle className="text-purple-400 text-xl" />
                </div>
              </motion.div>
              <h3 className="text-purple-400 font-medium mb-2">Quizzes</h3>
              <p className="text-sm text-gray-400">Test knowledge with AI-generated questions</p>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              className="bg-[#1a1a2e]/40 p-5 rounded-xl border border-teal-500/20 backdrop-blur-sm"
            >
              <motion.div {...floatingAnimation} className="flex justify-center">
                <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center mb-3">
                  <FaBook className="text-teal-400 text-xl" />
                </div>
              </motion.div>
              <h3 className="text-teal-400 font-medium mb-2">AI Notes</h3>
              <p className="text-sm text-gray-400">Generate comprehensive study materials</p>
            </motion.div>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}

export default AuthPage;
