"use client";

import { useState, useEffect } from "react";

interface SignatureOwner {
    address: string;
    name: string;
    isActive: boolean;
}

interface SignatureOwnersListProps {
    currentAddress: string;
}

export default function SignatureOwnersList({
    currentAddress,
}: SignatureOwnersListProps) {
    const [owners, setOwners] = useState<SignatureOwner[]>([]);
    const [loading, setLoading] = useState(true);

    // Mock function to fetch owners - would be replaced with actual contract calls
    useEffect(() => {
        const fetchOwners = async () => {
            setLoading(true);

            // Simulate API delay
            await new Promise((resolve) => setTimeout(resolve, 800));

            // Mock data - in a real app, this would be fetched from the contract
            const mockOwners: SignatureOwner[] = [
                {
                    address: "0x5678...9012",
                    name: "Manager A",
                    isActive: true,
                },
                {
                    address: "0x3456...7890",
                    name: "Manager B",
                    isActive: true,
                },
                {
                    address: "0x7890...1234",
                    name: "Manager C",
                    isActive: true,
                },
            ];

            setOwners(mockOwners);
            setLoading(false);
        };

        fetchOwners();
    }, []);

    // Check if the current address is an owner
    const isCurrentAddressOwner = () => {
        if (!currentAddress) return false;
        const shortAddress =
            currentAddress.slice(0, 6) + "..." + currentAddress.slice(-4);
        return owners.some((owner) => owner.address === shortAddress);
    };

    return (
        <div className="bg-white dark:bg-gray-800">
            {loading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {owners.map((owner, index) => (
                        <li
                            key={index}
                            className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className={`w-2 h-2 rounded-full ${
                                            owner.isActive
                                                ? "bg-green-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                        } mr-3`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {owner.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {owner.address}
                                        </p>
                                    </div>
                                </div>
                                {owner.address ===
                                    currentAddress?.slice(0, 6) +
                                        "..." +
                                        currentAddress?.slice(-4) && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        You
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                    <li className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 mr-3"></div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        Required signatures
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        2 of 3 signatures required
                                    </p>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            )}
        </div>
    );
}
