'use client';

import React from 'react';
import { useReadContract, useWriteContract, usePublicClient, useAccount } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';
import { formatEther } from 'viem';

interface ProjectData {
    name: string;
    description: string;
    recipient: `0x${string}`;
    amount: bigint;
    timestamp: bigint;
    released: boolean;
    completed: boolean;
    validations: bigint;
}

export function WithdrawFunds() {
    const [selectedProject, setSelectedProject] = React.useState<string>('');
    const [withdrawAmount, setWithdrawAmount] = React.useState<string>('');
    const [error, setError] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const publicClient = usePublicClient();
    const { address: userAddress } = useAccount();

    // Get project count
    const { data: projectCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectCount'
    }) as { data: bigint };

    // Get project details
    const { data: rawProjectData, isLoading: isProjectLoading, refetch: refetchProject } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProject',
        args: selectedProject ? [BigInt(selectedProject)] : undefined,
        query: {
            enabled: Boolean(selectedProject),
            refetchInterval: 5000 // Refetch every 5 seconds
        }
    });

    // Transform raw project data into ProjectData type
    const projectData = React.useMemo(() => {
        if (!rawProjectData || !Array.isArray(rawProjectData)) return undefined;

        const [name, description, recipient, amount, timestamp, released, completed, validations] = rawProjectData;

        return {
            name,
            description,
            recipient,
            amount: BigInt(amount.toString()),
            timestamp: BigInt(timestamp.toString()),
            released,
            completed,
            validations: BigInt(validations.toString())
        } as ProjectData;
    }, [rawProjectData]);

    // Get required validations
    const { data: requiredValidations, isLoading: isValidationsLoading } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'requiredValidations'
    }) as { data: bigint | undefined; isLoading: boolean };

    // Check if user is owner
    const { data: contractOwner } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'owner'
    }) as { data: `0x${string}` };

    const isOwner = userAddress && contractOwner && userAddress.toLowerCase() === contractOwner.toLowerCase();
    const isRecipient = userAddress && projectData?.recipient && userAddress.toLowerCase() === projectData.recipient.toLowerCase();

    // Write contract function
    const { writeContract, isPending } = useWriteContract();

    React.useEffect(() => {
        setIsLoading(isProjectLoading || isValidationsLoading);
    }, [isProjectLoading, isValidationsLoading]);

    // Log project data for debugging
    React.useEffect(() => {
        if (projectData) {
            console.log('Raw project data:', rawProjectData);
            console.log('Processed project data:', {
                name: projectData.name,
                amount: formatEther(projectData.amount),
                validations: projectData.validations.toString(),
                completed: projectData.completed,
                released: projectData.released,
                recipient: projectData.recipient
            });
        }
    }, [projectData, rawProjectData]);

    // Set up event listener for validation updates
    React.useEffect(() => {
        if (!selectedProject || !publicClient) return;

        const watchForValidations = async () => {
            try {
                const unwatch = publicClient.watchContractEvent({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    eventName: 'ProjectValidated',
                    onLogs: () => {
                        console.log('Project validation detected - refreshing data');
                        refetchProject();
                    }
                });

                return () => {
                    unwatch();
                };
            } catch (err) {
                console.error('Error watching for validations:', err);
            }
        };

        watchForValidations();

        // Set up periodic refresh
        const refreshInterval = setInterval(() => {
            if (selectedProject) {
                refetchProject();
            }
        }, 5000);

        return () => {
            clearInterval(refreshInterval);
        };
    }, [selectedProject, publicClient, refetchProject]);

    const handleWithdraw = async () => {
        if (!selectedProject || !withdrawAmount || !projectData || !requiredValidations) {
            setError('Please wait for project data to load');
            return;
        }

        try {
            // Check if user is authorized
            if (!isOwner && !isRecipient) {
                setError('Only the project owner or recipient can withdraw funds');
                return;
            }

            const amount = BigInt(parseFloat(withdrawAmount) * 1e18);
            if (amount > projectData.amount) {
                setError('Insufficient funds in project');
                return;
            }

            if (projectData.validations < requiredValidations) {
                setError(`Need ${requiredValidations.toString()} validations. Current: ${projectData.validations.toString()}`);
                return;
            }

            if (!projectData.completed) {
                setError('Project must be completed before withdrawing funds');
                return;
            }

            // If user is owner, use releaseFunds function
            if (isOwner) {
                writeContract({
                    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                    abi: fundAllocationABI,
                    functionName: 'releaseFunds',
                    args: [BigInt(selectedProject)]
                });
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to withdraw funds');
            console.error('Withdraw error:', err);
        }
    };

    return (
        <div className="bg-gray-800 rounded-lg p-6 space-y-6">
            <h2 className="text-xl font-bold text-white">Withdraw Project Funds</h2>

            {/* Project Selection */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                    Select Project
                </label>
                <select
                    value={selectedProject}
                    onChange={(e) => {
                        setSelectedProject(e.target.value);
                        setError(null);
                        setWithdrawAmount('');
                    }}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                >
                    <option value="">Select a project</option>
                    {projectCount && Array.from({ length: Number(projectCount) }, (_, i) => (
                        <option key={i} value={i.toString()}>
                            Project {i}
                        </option>
                    ))}
                </select>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center text-gray-400">
                    Loading project details...
                </div>
            )}

            {/* Project Details */}
            {!isLoading && projectData && requiredValidations && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700 rounded-lg p-4">
                            <h3 className="text-sm text-gray-400">Available Funds</h3>
                            <p className="text-lg font-bold text-white">
                                {formatEther(projectData.amount || BigInt(0))} ETH
                            </p>
                        </div>
                        <div className="bg-gray-700 rounded-lg p-4">
                            <h3 className="text-sm text-gray-400">Validation Status</h3>
                            <p className="text-lg font-bold text-white">
                                {projectData.validations?.toString() || '0'}/
                                {requiredValidations.toString()} Validations
                            </p>
                        </div>
                    </div>

                    {/* Project Status */}
                    {projectData.released && (
                        <div className="bg-yellow-900/50 text-yellow-200 p-4 rounded-lg">
                            This project's funds have already been released.
                        </div>
                    )}

                    {/* Withdrawal Form */}
                    {!projectData.released && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Withdrawal Amount (ETH)
                                </label>
                                <input
                                    type="number"
                                    value={withdrawAmount}
                                    onChange={(e) => {
                                        setWithdrawAmount(e.target.value);
                                        setError(null);
                                    }}
                                    placeholder="0.0"
                                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2"
                                    min="0"
                                    step="0.01"
                                    max={projectData.amount ? Number(formatEther(projectData.amount)) : 0}
                                />
                            </div>

                            {error && (
                                <div className="text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleWithdraw}
                                disabled={!selectedProject || !withdrawAmount || isPending || projectData.released}
                                className={`w-full py-2 px-4 rounded-lg font-medium ${!selectedProject || !withdrawAmount || isPending || projectData.released
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                    }`}
                            >
                                {isPending ? 'Processing...' : 'Withdraw Funds'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 