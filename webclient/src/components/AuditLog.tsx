'use client';

import React from 'react';
import { useReadContract, useWatchContractEvent } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';
import { formatEther } from 'viem';

interface AuditEvent {
    projectId: bigint;
    action: string;
    actor: `0x${string}`;
    details: string;
    timestamp: bigint;
}

export function AuditLog() {
    const [selectedProject, setSelectedProject] = React.useState<string>('');
    const [events, setEvents] = React.useState<AuditEvent[]>([]);

    // Get project count for filtering
    const { data: projectCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectCount'
    }) as { data: bigint };

    // Watch for new events
    useWatchContractEvent({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        eventName: 'FundsAllocated',
        onLogs: (logs) => {
            logs.forEach((log: any) => {
                const { args, blockTimestamp } = log;
                if (!args) return;

                const newEvent: AuditEvent = {
                    projectId: args.projectId,
                    action: 'Fund Allocation',
                    actor: args.funder,
                    details: `${formatEther(args.amount)} ETH allocated`,
                    timestamp: BigInt(blockTimestamp || Date.now())
                };
                setEvents(prev => [newEvent, ...prev]);
            });
        }
    });

    useWatchContractEvent({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        eventName: 'ProjectValidated',
        onLogs: (logs) => {
            logs.forEach((log: any) => {
                const { args, blockTimestamp } = log;
                if (!args) return;

                const newEvent: AuditEvent = {
                    projectId: args.projectId,
                    action: 'Validation',
                    actor: args.validator,
                    details: 'Project validated',
                    timestamp: BigInt(blockTimestamp || Date.now())
                };
                setEvents(prev => [newEvent, ...prev]);
            });
        }
    });

    useWatchContractEvent({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        eventName: 'FundsReleased',
        onLogs: (logs) => {
            logs.forEach((log: any) => {
                const { args, blockTimestamp } = log;
                if (!args) return;

                const newEvent: AuditEvent = {
                    projectId: args.projectId,
                    action: 'Funds Released',
                    actor: args.recipient,
                    details: `${formatEther(args.amount)} ETH released`,
                    timestamp: BigInt(blockTimestamp || Date.now())
                };
                setEvents(prev => [newEvent, ...prev]);
            });
        }
    });

    const filteredEvents = React.useMemo(() => {
        if (!selectedProject) return events;
        return events.filter(event => event.projectId.toString() === selectedProject);
    }, [events, selectedProject]);

    const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp) * 1000).toLocaleString();
    };

    const getEventColor = (action: string) => {
        switch (action) {
            case 'Fund Allocation':
                return 'bg-blue-500';
            case 'Validation':
                return 'bg-green-500';
            case 'Funds Released':
                return 'bg-purple-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Audit Log</h2>
                <div className="flex items-center space-x-4">
                    <label className="text-sm text-gray-300">Filter by Project:</label>
                    <select
                        value={selectedProject}
                        onChange={(e) => setSelectedProject(e.target.value)}
                        className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">All Projects</option>
                        {projectCount && Array.from({ length: Number(projectCount) }, (_, i) => (
                            <option key={i} value={i.toString()}>
                                {`Project ${i}`}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
                <div className="space-y-4">
                    {filteredEvents.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No events found</p>
                    ) : (
                        filteredEvents.map((event, index) => (
                            <div key={index} className="relative pl-8 pb-6 border-l-2 border-gray-700">
                                <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full ${getEventColor(event.action)}`}></div>
                                <div className="mb-2">
                                    <span className="text-xs text-gray-400">{formatDate(event.timestamp)}</span>
                                    <h3 className="text-white font-medium">{event.action}</h3>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Project {event.projectId.toString()} - {event.details}
                                </p>
                                <p className="text-gray-400 text-xs mt-1">
                                    By: {event.actor}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
} 