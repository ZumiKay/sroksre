"use client";

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay = ({
  message = "Loading...",
}: LoadingOverlayProps) => (
  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs rounded-xl z-10 flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-gray-600 font-medium text-sm">{message}</p>
    </div>
  </div>
);
