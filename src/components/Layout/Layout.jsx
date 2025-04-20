import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { motion } from "framer-motion";

function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f19] to-[#151528] text-white">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl"></div>
      </div>

      <Navbar />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-[#12121e]/70 border-t border-gray-800/50 backdrop-blur-sm py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Evalio LMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
