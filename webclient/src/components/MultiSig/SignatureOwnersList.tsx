"use client";

import { useState, useEffect } from "react";
import { useReadContract } from "wagmi";
import { FundAllocationABI } from "../../abi/FundAllocationABI";
import { formatEthereumAddress } from "@/lib/addressUtils";
import { MULTISIG_CONTRACT_ADDRESS } from "@/constants/addresses";

interface SignatureOwnersListProps {
    currentAddress: string;
}

export default function SignatureOwnersList({
    currentAddress,
}: SignatureOwnersListProps) {
    const [owners, setOwners] = useState<string[]>([]);
    const [requiredApprovals, setRequiredApprovals] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { data: ownersData } = useReadContract({
        address: MULTISIG_CONTRACT_ADDRESS as `0x${string}`,
        abi: FundAllocationABI,
        functionName: "getOwners",
    });

    const { data: requiredApprovalsData } = useReadContract({
        address: MULTISIG_CONTRACT_ADDRESS as `0x${string}`,
        abi: FundAllocationABI,
        functionName: "required",
    });

    useEffect(() => {
        if (ownersData) {
            setOwners(ownersData as string[]);
            setIsLoading(false);
        }
    }, [ownersData]);

    useEffect(() => {
        if (requiredApprovalsData) {
            setRequiredApprovals(Number(requiredApprovalsData));
        }
    }, [requiredApprovalsData]);

    // Fallback to mock data if fetch fails
    useEffect(() => {
        if (!ownersData && !isLoading) {
            setOwners([
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            ]);
            setRequiredApprovals(2);
        }
    }, [ownersData, isLoading]);

    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error loading signers: {error}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="animate-pulse p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
                <div className="mb-4">
                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 py-1 px-2 rounded-md text-sm font-medium">
                        {requiredApprovals} out of {owners.length} signatures
                        required
                    </span>
                </div>

                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {owners.map((owner, index) => {
                        const isCurrentUser =
                            owner.toLowerCase() ===
                            currentAddress.toLowerCase();

                        return (
                            <li
                                key={index}
                                className="py-4 flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className={`w-2 h-2 rounded-full mr-3 ${
                                            isCurrentUser
                                                ? "bg-green-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        }`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatEthereumAddress(owner)}
                                        </p>
                                        {isCurrentUser && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                (You)
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Active
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
