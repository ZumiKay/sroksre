"use client";

import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class HomeErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.log("Home page error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full min-h-100 flex flex-col items-center justify-center gap-4 p-8">
            <svg
              className="w-20 h-20 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-gray-700">
              Something went wrong
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              We're having trouble loading this section. Please try refreshing
              the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-incart text-white rounded-lg hover:bg-[#5a6575] transition-colors"
            >
              Refresh Page
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export function HomeContainerSkeleton() {
  return (
    <div className="w-[95vw] h-full flex flex-col items-center gap-y-5 animate-pulse">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="w-full h-75 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
  );
}
