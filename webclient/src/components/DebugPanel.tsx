"use client";

import { useState, useEffect } from "react";
import {
    usePublicClient,
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
} from "wagmi";
import { formatEther } from "viem";
import { FUND_ALLOCATION_ADDRESS } from "@/lib/constants";
import { fundAllocationABI } from "@/contracts/abis";

export default function DebugPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [fundraisers, setFundraisers] = useState<any[]>([]);
    const publicClient = usePublicClient();
    const { writeContract, data: txHash } = useWriteContract();
    const { isLoading, isSuccess } = useWaitForTransactionReceipt({
        hash: txHash,
    });
    const { data: validators, refetch: refetchValidators } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: "getValidators",
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!publicClient) return;

            try {
                // Get fundraiser count
                const count = await publicClient.readContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "getFundraiserCount",
                });

                // Fetch each fundraiser
                const results = [];
                for (let i = 0; i < Number(count); i++) {
                    try {
                        // First try with fundraisers function
                        const fundraiser = await publicClient.readContract({
                            address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                            abi: fundAllocationABI,
                            functionName: "fundraisers",
                            args: [BigInt(i)],
                        });

                        console.log(
                            `Using fundraisers() for ID ${i}:`,
                            fundraiser
                        );

                        // Then try with getFundraiserDetails
                        const details = await publicClient
                            .readContract({
                                address:
                                    FUND_ALLOCATION_ADDRESS as `0x${string}`,
                                abi: fundAllocationABI,
                                functionName: "getFundraiserDetails",
                                args: [BigInt(i)],
                            })
                            .catch((e) => {
                                console.log(
                                    `getFundraiserDetails error for ID ${i}:`,
                                    e
                                );
                                return null;
                            });

                        if (details) {
                            console.log(
                                `Using getFundraiserDetails() for ID ${i}:`,
                                details
                            );
                        }

                        results.push({
                            id: i,
                            data: fundraiser,
                            details: details,
                        });
                    } catch (error) {
                        console.error(`Error fetching fundraiser ${i}:`, error);
                    }
                }

                setFundraisers(results);
            } catch (error) {
                console.error("Error fetching debug data:", error);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [publicClient, isOpen]);

    const SetValidatorsSection = () => {
        // Hardhat default accounts
        const hardhatAccounts = [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        ];

        const handleSetValidators = async () => {
            try {
                await writeContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: "setValidators",
                    args: [hardhatAccounts],
                });
            } catch (error) {
                console.error("Error setting validators:", error);
            }
        };

        return (
            <div className="mt-6 p-4 border rounded-md">
                <h3 className="text-lg font-semibold mb-4">Set Validators</h3>

                <div className="mb-4">
                    <h4 className="font-medium mb-2">Current Validators:</h4>
                    {validators ? (
                        <ul className="list-disc pl-5">
                            {(validators as string[]).map(
                                (validator, index) => (
                                    <li
                                        key={index}
                                        className="text-sm font-mono break-all mb-1">
                                        {validator}
                                    </li>
                                )
                            )}
                        </ul>
                    ) : (
                        <p>Loading validators...</p>
                    )}
                </div>

                <div className="mb-4">
                    <h4 className="font-medium mb-2">
                        Hardhat Default Accounts to Add:
                    </h4>
                    <ul className="list-disc pl-5">
                        {hardhatAccounts.map((account, index) => (
                            <li
                                key={index}
                                className="text-sm font-mono break-all mb-1">
                                {account}
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={handleSetValidators}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400">
                    {isLoading
                        ? "Processing..."
                        : "Set First 4 Hardhat Accounts as Validators"}
                </button>

                {isSuccess && (
                    <div className="mt-2 text-green-600">
                        Validators set successfully!{" "}
                        <button
                            onClick={() => refetchValidators()}
                            className="underline">
                            Refresh List
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded shadow-lg z-50">
                Debug
            </button>
        );
    }

    return (
        <div className="fixed bottom-0 right-0 w-full md:w-1/2 h-96 bg-gray-900 text-white p-4 overflow-auto z-50 shadow-lg">
            <div className="flex justify-between mb-4">
                <h2 className="text-xl font-bold">Debug Panel</h2>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white">
                    Close
                </button>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-semibold">Contract Address</h3>
                <p className="font-mono text-xs break-all">
                    {FUND_ALLOCATION_ADDRESS}
                </p>
            </div>

            <div>
                <h3 className="text-lg font-semibold">
                    Fundraisers ({fundraisers.length})
                </h3>
                {fundraisers.map((f) => (
                    <div
                        key={f.id}
                        className="border border-gray-700 p-2 my-2 rounded">
                        <p className="text-green-400">ID: {f.id}</p>
                        <div className="mb-3">
                            <p className="text-blue-400 mb-1">
                                Data from fundraisers():
                            </p>
                            {f.data &&
                                typeof f.data === "object" &&
                                Object.keys(f.data).map((key) => (
                                    <p
                                        key={key}
                                        className="font-mono text-xs mb-1 pl-2">
                                        {key}:{" "}
                                        {typeof f.data[key] === "object"
                                            ? JSON.stringify(f.data[key])
                                            : String(f.data[key])}
                                    </p>
                                ))}
                        </div>

                        {f.details && (
                            <div className="mb-3 border-t border-gray-700 pt-2 mt-2">
                                <p className="text-purple-400 mb-1">
                                    Data from getFundraiserDetails():
                                </p>
                                {typeof f.details === "object" ? (
                                    Array.isArray(f.details) ? (
                                        f.details.map(
                                            (val: any, idx: number) => (
                                                <p
                                                    key={idx}
                                                    className="font-mono text-xs mb-1 pl-2">
                                                    {idx}:{" "}
                                                    {typeof val === "object"
                                                        ? JSON.stringify(val)
                                                        : String(val)}
                                                </p>
                                            )
                                        )
                                    ) : (
                                        Object.keys(f.details).map((key) => (
                                            <p
                                                key={key}
                                                className="font-mono text-xs mb-1 pl-2">
                                                {key}:{" "}
                                                {typeof f.details[key] ===
                                                "object"
                                                    ? JSON.stringify(
                                                          f.details[key]
                                                      )
                                                    : String(f.details[key])}
                                            </p>
                                        ))
                                    )
                                ) : (
                                    <p className="font-mono text-xs mb-1 pl-2">
                                        {String(f.details)}
                                    </p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => {
                                console.log("Full fundraiser data:", f);
                                alert(
                                    `Check console for all data for fundraiser ${f.id}`
                                );
                            }}
                            className="text-blue-400 text-sm mt-3">
                            Log All Data to Console
                        </button>
                    </div>
                ))}
            </div>

            <SetValidatorsSection />
        </div>
    );
}
