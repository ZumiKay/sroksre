"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useCheckSession from "@/src/hooks/useCheckSession";

interface Session {
  sessionid: string;
  device: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  lastUsed: Date | null;
  expireAt: Date;
  isCurrent: boolean;
}

interface SessionsResponse {
  success: boolean;
  sessions: Session[];
}

export default function DeviceManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const { handleCheckSession, data } = useCheckSession();

  // Prevent hydration mismatch for date formatting
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchSessions = async () => {
    const isValidSession = await handleCheckSession();
    if (!isValidSession) return;

    try {
      setLoading(true);
      const response = await fetch("/api/auth/sessions");
      const data: SessionsResponse = await response.json();

      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.log("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [data]);

  const handleLogoutDevice = async (sessionId: string) => {
    if (!confirm("Are you sure you want to logout this device?")) return;

    const isValidSession = await handleCheckSession();
    if (!isValidSession) return;

    try {
      setActionLoading(sessionId);
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSessions();
      } else {
        alert(data.message || "Failed to logout device");
      }
    } catch (error) {
      console.log("Logout error:", error);
      alert("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (
      !confirm(
        "Are you sure you want to logout all other devices? This will end all sessions except your current one.",
      )
    )
      return;

    const isValidSession = await handleCheckSession();
    if (!isValidSession) return;

    try {
      setActionLoading("all");
      const response = await fetch("/api/auth/sessions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchSessions();
      } else {
        alert(data.message || "Failed to logout devices");
      }
    } catch (error) {
      console.log("Logout all error:", error);
      alert("An error occurred");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower === "mobile") return "📱";
    if (deviceLower === "tablet") return "📱";
    return "💻";
  };

  const getBrowserName = (userAgent: string | null) => {
    if (!userAgent) return "Unknown Browser";
    const ua = userAgent.toLowerCase();

    if (ua.includes("edg")) return "Edge";
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("safari")) return "Safari";
    if (ua.includes("opera")) return "Opera";
    return "Unknown Browser";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Device Management
        </h1>
        <p className="text-gray-600">Manage your active sessions and devices</p>
      </div>

      {/* Logout All Button */}
      {sessions.length > 1 && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleLogoutAllDevices}
            disabled={actionLoading === "all"}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {actionLoading === "all" ? "Logging out..." : "Logout All Devices"}
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active sessions found</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.sessionid}
              className={`bg-white border rounded-lg p-6 shadow-xs hover:shadow-md transition-all duration-200 ${
                session.isCurrent
                  ? "border-blue-500 border-2 bg-linear-to-br from-blue-50/30 to-white ring-2 ring-blue-200 ring-opacity-50"
                  : "border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div
                    className={`text-4xl relative ${
                      session.isCurrent ? "scale-110" : ""
                    }`}
                    style={
                      session.isCurrent
                        ? {
                            filter:
                              "drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))",
                          }
                        : undefined
                    }
                  >
                    {getDeviceIcon(session.device)}
                    {session.isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 border-2 border-white"></span>
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {session.device}
                      </h3>
                      {session.isCurrent && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-linear-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full shadow-sm">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          This Device
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Browser:</span>{" "}
                        {getBrowserName(session.userAgent)}
                      </p>
                      {session.ipAddress && session.ipAddress !== "Unknown" && (
                        <p>
                          <span className="font-medium">IP Address:</span>{" "}
                          {session.ipAddress}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">First seen:</span>{" "}
                        {isMounted
                          ? formatDate(session.createdAt)
                          : "Loading..."}
                      </p>
                      {session.lastUsed && (
                        <p>
                          <span className="font-medium">Last active:</span>{" "}
                          {isMounted
                            ? formatDate(session.lastUsed)
                            : "Loading..."}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Expires:</span>{" "}
                        {isMounted
                          ? formatDate(session.expireAt)
                          : "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>

                {!session.isCurrent && (
                  <button
                    onClick={() => handleLogoutDevice(session.sessionid)}
                    disabled={actionLoading === session.sessionid}
                    className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {actionLoading === session.sessionid
                      ? "Logging out..."
                      : "Logout"}
                  </button>
                )}
              </div>

              {/* User Agent Details (Collapsed) */}
              {session.userAgent && (
                <details className="mt-4 text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    Technical Details
                  </summary>
                  <p className="mt-2 p-2 bg-gray-50 rounded-sm break-all">
                    {session.userAgent}
                  </p>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">
          🔒 Security Information
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Devices marked with{" "}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">
              <svg
                className="w-2.5 h-2.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              This Device
            </span>{" "}
            are your current session
          </li>
          <li>• Sessions automatically expire after 7 days of inactivity</li>
          <li>• Logging out a device will immediately end that session</li>
          <li>• You cannot logout your current device from this page</li>
          <li>
            • If you notice unfamiliar devices, logout all and change your
            password
          </li>
        </ul>
      </div>
    </div>
  );
}
