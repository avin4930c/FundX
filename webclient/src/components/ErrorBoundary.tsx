"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // You can log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
                    <h2 className="text-lg font-bold mb-2">
                        Something went wrong
                    </h2>
                    <p className="mb-2">
                        An unexpected error occurred in the application.
                    </p>
                    <details className="text-sm">
                        <summary>Error details</summary>
                        <p className="mt-2 font-mono">
                            {this.state.error?.message || "Unknown error"}
                        </p>
                    </details>
                    <button
                        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
                        onClick={() => window.location.reload()}>
                        Refresh the page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
