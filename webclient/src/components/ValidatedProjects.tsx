'use client';

import React, { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';
import { formatEther } from 'ethers';

interface Project {
    name: string;
    description: string;
    recipient: `0x${string}`;
    amount: bigint;
    timestamp: bigint;
    released: boolean;
    completed: boolean;
    validations: bigint;
}

export function ValidatedProjects() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    // Get total number of projects
    const { data: projectCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectCount'
    });

    // Get required validations for comparison
    const { data: requiredValidations } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'requiredValidations'
    });

    // Get current project
    const { data: currentProject } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProject',
        args: projectCount && currentIndex < Number(projectCount) ? [BigInt(currentIndex)] : undefined
    });

    useEffect(() => {
        if (!projectCount) {
            setLoading(false);
            return;
        }

        if (currentProject) {
            const [name, description, recipient, amount, timestamp, released, completed, validations] =
                currentProject as [string, string, `0x${string}`, bigint, bigint, boolean, boolean, bigint];

            const project: Project = {
                name,
                description,
                recipient,
                amount,
                timestamp,
                released,
                completed,
                validations
            };

            // Show projects that have received any validations
            if (validations > BigInt(0)) {
                setProjects(prev => [...prev, project]);
            }
        }

        // Move to next project if there are more
        if (currentIndex < Number(projectCount) - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setLoading(false);
        }
    }, [projectCount, currentProject, currentIndex]);

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4 text-gray-300">Loading validated projects... ({currentIndex + 1}/{projectCount?.toString() || '?'})</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="p-4 bg-red-900/50 text-red-400 rounded-lg border border-red-700">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Validated Projects</h1>

            {projects.length === 0 ? (
                <div className="text-center p-6 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No validated projects found</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...projects]
                        .sort((a, b) => Number(b.validations - a.validations))
                        .map((project, index) => (
                            <div key={index} className="bg-gray-800 rounded-lg p-6 shadow-lg">
                                <h2 className="text-xl font-semibold text-white mb-2">{project.name}</h2>
                                <p className="text-gray-400 mb-4">{project.description}</p>
                                <div className="space-y-2">
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">Amount:</span> {formatEther(project.amount)} ETH
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">Validations:</span> {project.validations.toString()}/{requiredValidations?.toString()}
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">Status:</span>{' '}
                                        <span className={project.released ? 'text-green-400' : 'text-yellow-400'}>
                                            {project.released ? 'Funds Released' : 'Pending Release'}
                                        </span>
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">Recipient:</span>{' '}
                                        <span className="font-mono text-xs break-all">{project.recipient}</span>
                                    </p>
                                    <p className="text-sm text-gray-300">
                                        <span className="font-medium">Created:</span>{' '}
                                        {new Date(Number(project.timestamp) * 1000).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
} 