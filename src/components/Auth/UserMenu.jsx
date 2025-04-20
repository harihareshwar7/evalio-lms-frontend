import React, { useState } from "react";
import { useAuth } from "./FirebaseAuthContext";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEdit = async () => {
    setLoading(true);
    setError("");
    try {
      await user.updateProfile({ displayName });
      setEditing(false);
    } catch (e) {
      setError("Failed to update display name.");
    }
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          border: "none",
          background: "none",
          cursor: "pointer",
          borderRadius: "50%",
          width: 40,
          height: 40,
          overflow: "hidden",
        }}
        title={user.displayName || user.email}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="avatar" style={{ width: "100%", height: "100%" }} />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "bold",
            fontSize: 18,
          }}>
            {(user.displayName || user.email || "?")[0].toUpperCase()}
          </div>
        )}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 50,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            minWidth: 250,
            zIndex: 100,
            padding: 16,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <strong>User Details</strong>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div>Email: {user.email}</div>
            <div>
              Display Name:{" "}
              {editing ? (
                <>
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                  <button onClick={handleEdit} disabled={loading || !displayName.trim()}>Save</button>
                  <button onClick={() => { setEditing(false); setDisplayName(user.displayName || ""); }} disabled={loading}>Cancel</button>
                </>
              ) : (
                <>
                  {user.displayName || <span style={{ color: "#888" }}>Not set</span>}
                  <button style={{ marginLeft: 8 }} onClick={() => setEditing(true)}>Edit</button>
                </>
              )}
            </div>
          </div>
          {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
          <button onClick={signOut} style={{ marginTop: 12, color: "red" }}>Sign Out</button>
        </div>
      )}
    </div>
  );
}
