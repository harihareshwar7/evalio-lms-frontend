import { memo } from "react";

// Using memo to prevent unnecessary re-renders
const UserStatsCard = memo(({ user, count, setCount }) => {
  return (
    <div className="bg-gray-800/80 p-8 rounded-xl shadow-lg border border-green-500/30 backdrop-blur-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-300 mb-4">
          Welcome, {user?.displayName || user?.email || 'User'}!
        </h2>

        {user?.email && (
          <p className="text-gray-400 mb-6">
            <span className="text-gray-500">Email:</span> {user.email}
          </p>
        )}

        <div className="mb-6">
          <div className="inline-block p-4 rounded-full bg-purple-900/40 mb-4">
            <span className="text-3xl text-green-400">{count}</span>
          </div>
        </div>

        <button
          onClick={() => setCount((c) => c + 1)}
          className="w-full bg-gradient-to-r from-purple-600 to-green-600 text-white py-3 px-4 rounded-md hover:from-purple-700 hover:to-green-700 transition-all duration-300 mb-2 font-medium"
          aria-label="Increment count"
        >
          Increment Count
        </button>

        <p className="text-purple-200 text-sm">Your activity score</p>
      </div>
    </div>
  );
});

// Add display name for better debugging
UserStatsCard.displayName = "UserStatsCard";

export default UserStatsCard;
