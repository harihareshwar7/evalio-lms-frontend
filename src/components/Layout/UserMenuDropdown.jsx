import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../Auth/FirebaseAuthContext";

function UserMenuDropdown({ user, signOut }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef();
  const { setUser, user: firebaseUser, refreshUser } = useAuth(); // get refreshUser from context

  // Close dropdown on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
        setEditing(false);
        setError("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Handle display name update
  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await updateProfile(firebaseUser, { displayName });
      await refreshUser(); // force update user in context
      setEditing(false);
      window.location.reload(); // manually reload the page after successful update
    } catch (err) {
      console.error("Failed to update display name:", err);
      setError("Failed to update display name.");
    }
    setLoading(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1 rounded bg-cyan-900/30 text-cyan-300 text-sm hover:bg-cyan-800/40 transition select-none"
      >
        <span className="hidden md:inline">{user.displayName || user.email}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-64 bg-[#18182a] border border-gray-800 rounded shadow-lg z-50 p-4"
          >
            <div className="mb-2">
              <div className="text-cyan-300 font-semibold text-base truncate">{user.displayName || "No display name"}</div>
              <div className="text-gray-400 text-xs truncate">{user.email}</div>
            </div>
            {editing ? (
              <form onSubmit={handleUpdate} className="space-y-2">
                <input
                  type="text"
                  className="w-full px-2 py-1 rounded bg-[#22223a] text-cyan-200 border border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  disabled={loading}
                  maxLength={32}
                  required
                />
                {error && <div className="text-red-400 text-xs">{error}</div>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-cyan-700 text-white text-xs hover:bg-cyan-800 transition disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-gray-700 text-gray-200 text-xs hover:bg-gray-800 transition"
                    onClick={() => { setEditing(false); setError(""); setDisplayName(user.displayName || ""); }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="w-full text-left px-0 py-1 text-cyan-400 hover:underline text-xs mb-2"
                onClick={() => setEditing(true)}
              >
                Edit display name
              </button>
            )}
            <button
              onClick={() => { setIsOpen(false); signOut(); }}
              className="w-full text-left px-0 py-1 text-red-400 hover:bg-cyan-900/20 rounded transition text-xs"
            >
              Sign Out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenuDropdown;
