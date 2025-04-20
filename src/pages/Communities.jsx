import { useState, useEffect } from "react";
import { useAuth } from "../components/Auth/FirebaseAuthContext";
import toast from "react-hot-toast";
import { FaFilePdf, FaRegClock, FaUser, FaUsers } from "react-icons/fa";
import { API_BASE_URL } from "../constants/api";

// Helper to generate a short random community ID
function generateCommunityID() {
  return Math.random().toString(36).substring(2, 8) + Date.now().toString(36).slice(-4);
}

function Communities() {
  const { user } = useAuth();
  const [communityName, setCommunityName] = useState("");
  const [myCommunities, setMyCommunities] = useState([]);
  const [communityDetails, setCommunityDetails] = useState({});
  const [joinCommunityID, setJoinCommunityID] = useState("");
  const [loading, setLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [sharedNotes, setSharedNotes] = useState({}); // {communityID: [notes]}

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch shared notes for a specific community
  const fetchSharedNotes = async (communityName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/community/get-shared-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ communityName }),
      });

      if (!response.ok) {
        throw new Error(`Error fetching shared notes for ${communityName}`);
      }

      const data = await response.json();
      return data["shared-notes"] || [];
    } catch (error) {
      console.error(`Error fetching shared notes for ${communityName}:`, error);
      return [];
    }
  };

  // Fetch user's subscribed communities and their details
  const fetchSubscribedCommunities = async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/community/subscribed-communities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid }),
      });
      const data = await res.json();
      console.log(data);
      if (data["subscribed-communities"]) {
        setMyCommunities(data["subscribed-communities"]);
        // Fetch details for each community
        const details = {};
        for (const cid of data["subscribed-communities"]) {
          const detRes = await fetch(`${API_BASE_URL}/community/fetch-community`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ communityID: cid }),
          });
          const detData = await detRes.json();
          if (detData.community) details[cid] = detData.community;
        }
        setCommunityDetails(details);

        // After fetching community details, fetch shared notes for each community
        setNotesLoading(true);
        const notesData = {};
        for (const cid of data["subscribed-communities"]) {
          if (details[cid]) {
            const communityNotes = await fetchSharedNotes(details[cid].communityName);
            notesData[cid] = communityNotes;
          }
        }
        setSharedNotes(notesData);
        setNotesLoading(false);
      }
    } catch (e) {
      toast.error("Failed to fetch communities");
      console.error("Error fetching communities:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscribedCommunities();
    // eslint-disable-next-line
  }, [user]);

  // Create a new community (ID auto-generated)
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    if (!communityName.trim()) {
      toast.error("Community name required");
      return;
    }
    const communityID = generateCommunityID();
    try {
      const res = await fetch(`${API_BASE_URL}/community/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          communityID,
          communityName,
          ownerName: user.displayName || user.email || "User",
          ownerEmail: user.email,
        }),
      });
      const data = await res.json();
      if (data.community) {
        // Subscribe the user to the new community
        await fetch(`${API_BASE_URL}/community/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uid: user.uid,
            email: user.email,
            communityID: communityID,
          }),
        });
        toast.success("Community created!");
        setCommunityName("");
        setShowCreateModal(false);
        fetchSubscribedCommunities();
      } else {
        toast.error(data.message || "Failed to create community");
      }
    } catch (e) {
      toast.error("Error creating community");
    }
  };

  // Join a community by ID
  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    if (!joinCommunityID.trim()) {
      toast.error("Enter a community ID to join");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/community/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          communityID: joinCommunityID,
        }),
      });
      const data = await res.json();
      if (data.message) {
        toast.success("Joined community!");
        setJoinCommunityID("");
        setShowJoinModal(false);
        fetchSubscribedCommunities();
      } else {
        toast.error("Failed to join community");
      }
    } catch (e) {
      toast.error("Error joining community");
    }
  };

  // Calculate total shared notes across all communities
  const totalSharedNotes = Object.values(sharedNotes).reduce(
    (total, notes) => total + notes.length,
    0
  );

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-purple-400 to-blue-400 text-transparent bg-clip-text mb-8">
        Communities
      </h1>

      {/* Tiny Buttons */}
      <div className="flex gap-3 justify-center mb-8">
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-xs font-semibold shadow"
          onClick={() => setShowCreateModal(true)}
        >
          Create
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-semibold shadow"
          onClick={() => setShowJoinModal(true)}
        >
          Join
        </button>
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#23234a] p-6 rounded-xl shadow-lg border border-purple-500/30 w-full max-w-xs">
            <h2 className="text-lg font-semibold text-purple-300 mb-4">Create a Community</h2>
            <form onSubmit={handleCreateCommunity} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Community Name"
                value={communityName}
                onChange={e => setCommunityName(e.target.value)}
                className="p-3 rounded-lg bg-[#1e293b] text-white border border-gray-600"
                required
              />
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
              >
                Create
              </button>
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-200 mt-2"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Join Community Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#23234a] p-6 rounded-xl shadow-lg border border-blue-500/30 w-full max-w-xs">
            <h2 className="text-lg font-semibold text-blue-300 mb-4">Join a Community</h2>
            <form onSubmit={handleJoinCommunity} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Enter Community ID"
                value={joinCommunityID}
                onChange={e => setJoinCommunityID(e.target.value)}
                className="p-3 rounded-lg bg-[#1e293b] text-white border border-gray-600"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm"
              >
                Join
              </button>
              <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-200 mt-2"
                onClick={() => setShowJoinModal(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Subscribed Communities */}
      <div className="bg-gradient-to-br from-[#18182f] to-[#23234a] p-6 rounded-xl shadow-lg border border-green-500/30 mb-8">
        <h2 className="text-xl font-semibold text-green-300 mb-4">Your Subscribed Communities</h2>
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : myCommunities.length === 0 ? (
          <div className="text-center text-gray-400 py-8">You have not joined any communities yet.</div>
        ) : (
          <div className="space-y-6">
            {myCommunities.map(cid => {
              const details = communityDetails[cid];
              const isOwner = details?.ownerEmail === user.email;
              return (
                <div
                  key={cid}
                  className="bg-[#23234a]/60 border border-purple-500/20 rounded-lg p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="text-lg font-bold text-purple-200">{details?.communityName || cid}</div>
                    <div className="text-gray-400 text-sm mb-1">ID: <span className="font-mono">{cid}</span></div>
                    <div className="text-gray-400 text-sm">
                      Owner:{" "}
                      <span className="text-blue-300">
                        {isOwner ? "You" : (details?.ownerName || "Unknown")}
                      </span>{" "}
                      ({details?.ownerEmail || "?"})
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      Created: {details?.createdAt ? new Date(details.createdAt).toLocaleString() : "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-green-400 font-semibold">
                      Subscribers: {details?.subscribers?.length || 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notes Shared by Your Communities - New Section */}
      <div className="bg-gradient-to-br from-[#182f1e] to-[#1e2a1d] p-6 rounded-xl shadow-lg border border-green-500/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-green-300">Notes Shared by Communities</h2>
          <span className="bg-green-900/40 text-green-300 px-3 py-1 text-xs rounded-full border border-green-500/30">
            {totalSharedNotes} {totalSharedNotes === 1 ? "Note" : "Notes"}
          </span>
        </div>

        {loading || notesLoading ? (
          <div className="text-center text-gray-400 py-8">Loading shared notes...</div>
        ) : myCommunities.length === 0 ? (
          <div className="text-center text-gray-400 py-8">Join communities to see shared notes.</div>
        ) : totalSharedNotes === 0 ? (
          <div className="text-center text-gray-400 py-8">No shared notes found in your communities.</div>
        ) : (
          <div className="space-y-8">
            {myCommunities.map(cid => {
              const communityName = communityDetails[cid]?.communityName || cid;
              const communityNotes = sharedNotes[cid] || [];

              if (communityNotes.length === 0) return null;

              return (
                <div key={`notes-${cid}`} className="mb-6">
                  <h3 className="text-lg font-medium text-blue-300 mb-3 flex items-center gap-2">
                    <FaUsers className="text-blue-400" />
                    {communityName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {communityNotes.map((note, index) => (
                      <div
                        key={`note-${index}-${cid}`}
                        className="bg-[#1e2a1d]/70 border border-green-500/20 rounded-lg p-4 hover:bg-[#1e2a1d]/90 transition-all"
                      >
                        <div className="font-semibold text-green-200 mb-2">{note.topic}</div>

                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                          <FaUser className="text-xs" />
                          <span>
                            {note.userId === user.uid ? (
                              <span className="text-blue-300 font-medium">You</span>
                            ) : (
                              note.username || "Unknown user"
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                          <FaRegClock className="text-xs" />
                          <span>{formatDate(note.sharedAt)}</span>
                        </div>

                        <a
                          href={note.notePdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded mt-2 text-sm font-medium transition-colors w-fit"
                        >
                          <FaFilePdf />
                          View Shared Note
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Communities;
