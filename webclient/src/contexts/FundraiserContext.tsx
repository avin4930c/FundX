"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
    useRef,
    useCallback,
} from "react";
import { usePublicClient } from "wagmi";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";

// Define the context type
type FundraiserContextType = {
    fundraiserData: any[] | null;
    loading: boolean;
    error: string | null;
    refreshData: () => void;
};

// Helper function for deep comparison of arrays
function areArraysEqual(arr1: any[] | null, arr2: any[] | null): boolean {
    if (arr1 === arr2) return true;
    if (arr1 === null || arr2 === null) return arr1 === arr2;
    if (arr1.length !== arr2.length) return false;

    // Simple deep comparison for our arrays of arrays
    for (let i = 0; i < arr1.length; i++) {
        const a = arr1[i];
        const b = arr2[i];

        if (a === b) continue;
        if (!a || !b) return false;

        // Both are arrays - compare elements
        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            for (let j = 0; j < a.length; j++) {
                if (a[j] !== b[j]) return false;
            }
        } else if (a !== b) {
            return false;
        }
    }

    return true;
}

// Create the context
const FundraiserContext = createContext<FundraiserContextType>({
    fundraiserData: null,
    loading: false,
    error: null,
    refreshData: () => {},
});

// Provider component
export const FundraiserProvider = ({ children }: { children: ReactNode }) => {
    const [fundraiserData, setFundraiserData] = useState<any[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Cache previous results to compare
    const prevDataRef = useRef<any[] | null>(null);

    const publicClient = usePublicClient();

    // Memoize the refresh function to maintain stable reference
    const refreshData = useCallback(() => {
        setRefreshTrigger((prev) => prev + 1);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchFundraisers = async () => {
            if (!publicClient) {
                console.log("PublicClient not available yet, skipping fetch");
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Get fundraiser count
                const count = await publicClient
                    .readContract({
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: "getFundraiserCount",
                    })
                    .catch((err) => {
                        console.error(
                            "[FundraiserContext] Error getting fundraiser count:",
                            err || "Empty error object"
                        );
                        throw new Error("Failed to get fundraiser count");
                    });

                const fundraiserCount = Number(count || 0);

                // Early return if component unmounted
                if (!isMounted) return;

                console.log(
                    "[FundraiserContext] Total fundraiser count:",
                    fundraiserCount
                );

                // Fetch all fundraisers
                const promises = [];
                for (let i = 0; i < fundraiserCount; i++) {
                    promises.push(
                        publicClient
                            .readContract({
                                address:
                                    FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                abi: fundAllocationABI,
                                functionName: "fundraisers",
                                args: [BigInt(i)],
                            })
                            .catch((error) => {
                                // Format empty errors for better debugging
                                const errorMsg =
                                    error && Object.keys(error).length === 0
                                        ? "Empty error object"
                                        : error;

                                console.error(
                                    `[FundraiserContext] Error fetching fundraiser ${i}:`,
                                    errorMsg
                                );
                                return null; // Return null for failed requests
                            })
                    );
                }

                // Add timeout to prevent hanging if contract is unresponsive
                const timeoutPromise = new Promise<null>((resolve) => {
                    setTimeout(() => {
                        console.warn(
                            "[FundraiserContext] Fetch timeout reached"
                        );
                        resolve(null);
                    }, 10000); // 10 second timeout
                });

                // Use Promise.race for each promise to handle timeouts
                const timedPromises = promises.map((promise) =>
                    Promise.race([promise, timeoutPromise])
                );

                const results = await Promise.all(timedPromises);

                // Skip if unmounted during the async operation
                if (!isMounted) return;

                const validResults = results.filter(
                    (result) => result !== null
                );

                console.log(
                    `[FundraiserContext] Retrieved ${validResults.length} of ${fundraiserCount} fundraisers`
                );

                // Only update state if data actually changed
                if (!areArraysEqual(validResults, prevDataRef.current)) {
                    prevDataRef.current = validResults;
                    setFundraiserData(validResults);
                }

                setLoading(false);
            } catch (err) {
                if (!isMounted) return;

                // Handle and format empty error objects
                const errorMsg =
                    err &&
                    typeof err === "object" &&
                    Object.keys(err).length === 0
                        ? "Empty error object from contract interaction"
                        : err;

                console.error(
                    "[FundraiserContext] Error in fundraiser fetch:",
                    errorMsg
                );
                setError("Failed to fetch fundraiser data");
                setLoading(false);
            }
        };

        fetchFundraisers();

        // Auto-refresh every 30 seconds but use a reasonable interval
        const intervalId = setInterval(() => {
            if (isMounted) {
                setRefreshTrigger((prev) => prev + 1);
            }
        }, 30000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [publicClient, refreshTrigger]);

    return (
        <FundraiserContext.Provider
            value={{ fundraiserData, loading, error, refreshData }}>
            {children}
        </FundraiserContext.Provider>
    );
};

// Custom hook to use the context
export const useFundraiserContext = () => useContext(FundraiserContext);
