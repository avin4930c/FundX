"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalsRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/multi-sig");
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
                Redirecting...
            </span>
        </div>
    );
}
