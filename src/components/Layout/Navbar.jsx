import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../Auth/FirebaseAuthContext";
import UserMenuDropdown from "./UserMenuDropdown";

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if link is active
  const isActiveLink = (path) => location.pathname === path;

  return (
    <>
      <motion.nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-[#12121e]/80 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 text-transparent bg-clip-text">
                  Evalio LMS
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex ml-10 items-center space-x-2">
                <NavLink to="/flashcards" isActive={isActiveLink("/flashcards")} label="Flashcards" />
                <NavLink to="/quiz" isActive={isActiveLink("/quiz")} label="Quiz" />
                <NavLink to="/all-quizzes" isActive={isActiveLink("/all-quizzes")} label="All Quizzes" />
                <NavLink to="/notes" isActive={isActiveLink("/notes")} label="AI Notes" />
                <NavLink to="/chatbot" isActive={isActiveLink("/chatbot")} label="Chatbot" />
                <NavLink to="/communities" isActive={isActiveLink("/communities")} label="Communities" />
                {user && (
                  <NavLink to="/activity" isActive={isActiveLink("/activity")} label="Activity" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme toggle could go here */}

              {user ? (
                <UserMenuDropdown user={user} signOut={signOut} />
              ) : (
                <Link to="/sign-in" className="text-cyan-400 hover:underline text-sm">
                  Sign In
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden text-gray-300 hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="roundvalio LMS
Flashcards
Quiz
All Quizzes
AI Notes
Activity
￼
HARIHARESHWAR
" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden bg-[#12121e] border-b border-gray-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              <MobileNavLink to="/flashcards" isActive={isActiveLink("/flashcards")} label="Flashcards" />
              <MobileNavLink to="/quiz" isActive={isActiveLink("/quiz")} label="Quiz" />
              <MobileNavLink to="/all-quizzes" isActive={isActiveLink("/all-quizzes")} label="All Quizzes" />
              <MobileNavLink to="/notes" isActive={isActiveLink("/notes")} label="AI Notes" />
              <MobileNavLink to="/chatbot" isActive={isActiveLink("/chatbot")} label="Chatbot" />
              <MobileNavLink to="/communities" isActive={isActiveLink("/communities")} label="Communities" />
              {user && (
                <MobileNavLink to="/activity" isActive={isActiveLink("/activity")} label="Activity" />
              )}
            </div>
          </motion.div>
        )}
      </motion.nav>
      <div className="h-16 md:h-20"></div> {/* Added margin below the navbar */}
    </>
  );
}

// Desktop NavLink component
function NavLink({ to, isActive, label }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative group ${
        isActive
          ? "text-cyan-300 bg-cyan-900/20"
          : "text-gray-300 hover:text-cyan-300 hover:bg-cyan-900/10"
      }`}
    >
      {label}
      {isActive && (
        <motion.span
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 mx-3"
          layoutId="navbar-indicator"
        />
      )}
    </Link>
  );
}

// Mobile NavLink component
function MobileNavLink({ to, isActive, label }) {
  return (
    <Link
      to={to}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isActive
          ? "text-cyan-300 bg-cyan-900/20"
          : "text-gray-300 hover:text-white hover:bg-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

export default Navbar;
