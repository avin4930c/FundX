"use client";

import { useState, useEffect } from "react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/lib/walletConnect";
import { FundraiserProvider } from "@/contexts/FundraiserContext";
import { FundRequestProvider } from "@/contexts/FundRequestContext";
import "@rainbow-me/rainbowkit/styles.css";

// Create ErrorBoundary component for provider errors
class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Provider error caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                        <h2 className="text-xl font-bold text-red-600 mb-4">
                            Wallet Connection Error
                        </h2>
                        <p className="text-gray-700 mb-4">
                            There was a problem connecting to the blockchain.
                            Please refresh the page or try again later.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Create QueryClient outside component
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // Allow one retry
            retryDelay: 1000, // Retry after 1 second
            refetchOnWindowFocus: false, // Disable refetching when window gains focus
            staleTime: 10000, // Data is fresh for 10 seconds
        },
    },
});

// Safely create the wagmi configuration
const safeWagmiConfig = (() => {
    try {
        return wagmiConfig;
    } catch (error) {
        console.error("Failed to initialize wagmi config:", error);
        return null;
    }
})();

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const [initError, setInitError] = useState<Error | null>(null);

    // Only set mounted after client-side hydration
    useEffect(() => {
        try {
            if (!safeWagmiConfig) {
                throw new Error("Failed to initialize wallet connection");
            }
            setMounted(true);
        } catch (error) {
            console.error("Provider initialization error:", error);
            setInitError(
                error instanceof Error
                    ? error
                    : new Error("Unknown error during initialization")
            );
        }

        // Add event handlers for unhandled errors
        const handleError = (event: ErrorEvent) => {
            console.error("Unhandled error:", event.error);
            event.preventDefault();
        };

        window.addEventListener("error", handleError);

        return () => {
            window.removeEventListener("error", handleError);
        };
    }, []);

    // Show loading spinner during initial mount
    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show error message if initialization failed
    if (initError) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-xl font-bold text-red-600 mb-4">
                        Initialization Error
                    </h2>
                    <p className="text-gray-700 mb-4">
                        {initError.message ||
                            "Failed to initialize application. Please refresh and try again."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    if (!safeWagmiConfig) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                    <h2 className="text-xl font-bold text-red-600 mb-4">
                        Wallet Connection Error
                    </h2>
                    <p className="text-gray-700 mb-4">
                        Failed to initialize wallet connection. Please check
                        your network and refresh the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                        Reload Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <WagmiProvider config={safeWagmiConfig}>
                <QueryClientProvider client={queryClient}>
                    <RainbowKitProvider>
                        <FundraiserProvider>
                            <FundRequestProvider>
                                {children}
                            </FundRequestProvider>
                        </FundraiserProvider>
                    </RainbowKitProvider>
                </QueryClientProvider>
            </WagmiProvider>
        </ErrorBoundary>
    );
}
