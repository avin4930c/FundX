/*
 * NOTE: This file is no longer used. We now use ClientWrapper.tsx instead.
 * Keeping this file for reference but it should be removed in production.
 */

"use client";

import React from "react";
import { Providers } from "./providers";
import ErrorBoundary from "@/components/ErrorBoundary";

interface ClientProvidersProps {
    children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
    console.warn(
        "ClientProviders.tsx is deprecated - use ClientWrapper.tsx instead"
    );
    return (
        <ErrorBoundary>
            <Providers>{children}</Providers>
        </ErrorBoundary>
    );
}
