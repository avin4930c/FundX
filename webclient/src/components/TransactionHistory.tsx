'use client';

import React from 'react';
import { useReadContract } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';
import { formatEther } from 'ethers';

interface TransactionEvent {
    projectId: bigint;
    sender: `0x${string}`;
    recipient: `0x${string}`;
    amount: bigint;
    projectName: string;
    timestamp: bigint;
    eventType: 'allocation' | 'validation' | 'release';
}

export function TransactionHistory() {
    // Get events from the contract
    const { data: allocations } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getFundsAllocatedEvents'
    }) as { data: TransactionEvent[] };

    const { data: validations } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectValidatedEvents'
    }) as { data: TransactionEvent[] };

    const { data: releases } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getFundsReleasedEvents'
    }) as { data: TransactionEvent[] };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Transaction History</h2>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Project
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    From
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    To
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                    Date
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {[...(allocations || []), ...(validations || []), ...(releases || [])]
                                .sort((a, b) => Number(b.timestamp - a.timestamp))
                                .map((event, index) => (
                                    <tr key={index} className="hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <span className={`px-2 py-1 rounded-full text-xs ${event.eventType === 'allocation'
                                                ? 'bg-blue-900 text-blue-200'
                                                : event.eventType === 'validation'
                                                    ? 'bg-green-900 text-green-200'
                                                    : 'bg-purple-900 text-purple-200'
                                                }`}>
                                                {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {event.projectName} (ID: {event.projectId.toString()})
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <span className="font-mono text-xs">{event.sender}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            <span className="font-mono text-xs">{event.recipient}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {formatEther(event.amount)} ETH
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                            {new Date(Number(event.timestamp) * 1000).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
} 