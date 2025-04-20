import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Flashcards from "./pages/Flashcards";
import Notes from "./pages/Notes";
import UserActivity from "./pages/UserActivity";
import AllQuizzes from "./pages/AllQuizzes";
import Communities from "./pages/Communities";
import Chatbot from "./pages/Chatbot";
import Layout from "./components/Layout/Layout";
import { PublicRoute, ProtectedRoute } from "./components/Auth/RouteGuards";
// Import animation libraries
import { AnimatePresence } from "framer-motion";
// Import ToastContainer for notifications
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div>
      {/* Add Toaster for notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e1e2d',
            color: '#fff',
            border: '1px solid #2d2d3a'
          },
        }}
      />

      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            {/* Public routes - accessible for non-authenticated users */}
            <Route element={<PublicRoute />}>
              <Route path="/sign-in/*" element={<AuthPage />} />
              <Route path="/sign-up/*" element={<AuthPage initialView="sign-up" />} />
            </Route>

            {/* SSO Callback handler */}
            <Route path="/sso-callback" element={
              <div className="min-h-screen bg-[#0f0f19] flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                  <p className="text-cyan-300">Completing authentication...</p>
                </div>
              </div>
            } />

            {/* Protected routes - require authentication */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/activity" element={<UserActivity />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/all-quizzes" element={<AllQuizzes />} />
                <Route path="/communities" element={<Communities />} />
                <Route path="/chatbot" element={<Chatbot />} />
              </Route>
            </Route>

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </div>
  );
}

export default App;
