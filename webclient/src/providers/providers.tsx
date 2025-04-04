"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "../../config/wagmi";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            retryDelay: 1000,
        },
    },
});

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    // Ensure wallet hooks are only used after mount to avoid hydration issues
    useEffect(() => {
        setMounted(true);

        // Patch to handle WalletConnect errors
        const handleError = (event: ErrorEvent) => {
            if (
                event.error?.message?.includes(
                    "this.provider.disconnect is not a function"
                ) ||
                event.error?.message?.includes(
                    "Error checking Cross-Origin-Opener-Policy"
                )
            ) {
                console.warn(
                    "Suppressed WalletConnect error:",
                    event.error?.message
                );
                event.preventDefault();
            }
        };

        // Override console.error to suppress specific errors
        const originalConsoleError = console.error;
        console.error = (...args: any[]) => {
            if (
                typeof args[0] === "string" &&
                (args[0].includes("Cross-Origin-Opener-Policy") ||
                    args[0].includes("HTTP error! status: 404"))
            ) {
                return; // Suppress the error
            }
            originalConsoleError.apply(console, args);
        };

        window.addEventListener("error", handleError);

        return () => {
            window.removeEventListener("error", handleError);
            console.error = originalConsoleError;
        };
    }, []);

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {mounted ? children : null}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
