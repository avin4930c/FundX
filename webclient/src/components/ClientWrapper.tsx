"use client";

import React from "react";
import { Providers } from "@/providers/providers";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function ClientWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary>
            <Providers>{children}</Providers>
        </ErrorBoundary>
    );
}
