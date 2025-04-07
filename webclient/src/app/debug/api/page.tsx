"use client";

import { useState } from "react";
import { FUND_ALLOCATION_ADDRESS } from "../../../../config/wagmi";

export default function ApiDebugPage() {
    const [functionName, setFunctionName] = useState("getFundraiserCount");
    const [args, setArgs] = useState("[]");
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Available functions to test
    const availableFunctions = [
        "getFundraiserCount",
        "fundraisers",
        "getOwners",
        "required",
        "getWithdrawalRequestCount",
    ];

    const callApi = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            // Construct the API URL
            const apiUrl = `/api/read-contract?address=${FUND_ALLOCATION_ADDRESS}&function=${functionName}&args=${encodeURIComponent(
                args
            )}`;

            // Log details
            console.log("Calling API with:", {
                url: apiUrl,
                functionName,
                args,
            });

            // Make the API call
            const response = await fetch(apiUrl);
            const data = await response.json();

            // Check if the API returned an error
            if (data.error) {
                throw new Error(data.error);
            }

            // Set the result
            console.log("API result:", data);
            setResult(data);
        } catch (err: any) {
            console.error("API call error:", err);
            setError(err.message || "Unknown error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">API Debug Page</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">
                    Contract Configuration
                </h2>
                <div className="mb-4">
                    <span className="font-medium">Contract Address:</span>{" "}
                    <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {FUND_ALLOCATION_ADDRESS || "Not set"}
                    </code>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">API Call Test</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Function Name
                    </label>
                    <select
                        value={functionName}
                        onChange={(e) => setFunctionName(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                        {availableFunctions.map((fn) => (
                            <option
                                key={fn}
                                value={fn}>
                                {fn}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Arguments (JSON array)
                    </label>
                    <input
                        type="text"
                        value={args}
                        onChange={(e) => setArgs(e.target.value)}
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        placeholder="e.g. [0] or []"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        For no arguments, use [] (empty array). For a single
                        number argument, use [0].
                    </p>
                </div>

                <div className="mb-4">
                    <button
                        onClick={callApi}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded text-white ${
                            isLoading
                                ? "bg-gray-400"
                                : "bg-blue-500 hover:bg-blue-600"
                        }`}>
                        {isLoading ? "Loading..." : "Call API"}
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div>
                        <h3 className="text-lg font-medium mb-2">Result</h3>
                        <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto max-h-96">
                            {JSON.stringify(result, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
