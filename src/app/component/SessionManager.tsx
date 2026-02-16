"use client";

import { useEffect, useState } from "react";

interface SessionInfo {
  session_id: string;
  createdAt: string;
  expireAt: string;
  isCurrent: boolean;
}

// Helper to format date consistently on client-side only
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Example component showing how to use the session management API
 * This can be used in a user dashboard to show active sessions
 */
export default function SessionManager() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch for date formatting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/session");
      const data = await response.json();

      if (data.success) {
        setSessions(data.sessions);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch sessions");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  // Invalidate a specific session (logout from device)
  const logoutSession = async (session_id: string) => {
    try {
      const response = await fetch("/api/session?action=invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id }),
      });

      const data = await response.json();

      if (data.success) {
        // If logging out current session, redirect to login
        const currentSession = sessions.find((s) => s.isCurrent);
        if (currentSession?.session_id === session_id) {
          window.location.href = "/account";
        } else {
          // Refresh session list
          fetchSessions();
        }
      } else {
        alert("Failed to logout: " + data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to logout");
    }
  };

  // Logout from all devices
  const logoutAllSessions = async () => {
    if (!confirm("Are you sure you want to logout from all devices?")) {
      return;
    }

    try {
      const response = await fetch("/api/session?action=invalidate-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to login since all sessions are invalidated
        window.location.href = "/account";
      } else {
        alert("Failed to logout from all devices: " + data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to logout from all devices");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return <div className="p-4">Loading sessions...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Active Sessions</h2>
        <button
          onClick={logoutAllSessions}
          className="px-4 py-2 bg-red-500 text-white rounded-sm hover:bg-red-600"
        >
          Logout All Devices
        </button>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-gray-500">No active sessions found</p>
        ) : (
          sessions.map((session) => (
            <div
              key={session.session_id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {session.isCurrent ? "This Device" : "Another Device"}
                  </h3>
                  {session.isCurrent && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-sm">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Session ID: {session.session_id.substring(0, 8)}...
                </p>
                <p className="text-sm text-gray-600">
                  Created:{" "}
                  {isMounted ? formatDate(session.createdAt) : "Loading..."}
                </p>
                <p className="text-sm text-gray-600">
                  Expires:{" "}
                  {isMounted ? formatDate(session.expireAt) : "Loading..."}
                </p>
              </div>

              <button
                onClick={() => logoutSession(session.session_id)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-sm hover:bg-gray-300"
              >
                {session.isCurrent ? "Logout" : "Remove"}
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={fetchSessions}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
      >
        Refresh
      </button>
    </div>
  );
}
