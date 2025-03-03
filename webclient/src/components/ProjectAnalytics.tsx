'use client';

import React from 'react';
import { useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { FUND_ALLOCATION_ADDRESS, wagmiConfig } from '../../config/wagmi';
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

interface ProjectStats {
    id: bigint;
    totalFunds: bigint;
    validationCount: bigint;
    isCompleted: boolean;
}

export function ProjectAnalytics() {
    const [projects, setProjects] = React.useState<ProjectStats[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Get project count
    const { data: projectCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectCount'
    }) as { data: bigint };

    // Fetch project stats
    React.useEffect(() => {
        const fetchProjectStats = async () => {
            if (!projectCount) return;

            try {
                const stats: ProjectStats[] = [];
                for (let i = 0; i < Number(projectCount); i++) {
                    const project = await readContract(wagmiConfig, {
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: 'getProject',
                        args: [BigInt(i)]
                    }) as ProjectData;

                    stats.push({
                        id: BigInt(i),
                        totalFunds: project.amount,
                        validationCount: project.validations,
                        isCompleted: project.completed
                    });
                }
                setProjects(stats);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch project stats');
                setLoading(false);
            }
        };

        fetchProjectStats();
    }, [projectCount]);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-gray-800 rounded-lg p-6">
                    <p className="text-gray-400 text-center">Loading project analytics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-red-900/50 rounded-lg p-6">
                    <p className="text-red-200 text-center">{error}</p>
                </div>
            </div>
        );
    }

    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.isCompleted).length;
    const totalFunds = projects.reduce((sum, p) => sum + p.totalFunds, BigInt(0));
    const totalValidations = projects.reduce((sum, p) => Number(sum) + Number(p.validationCount), 0);
    const averageValidations = totalProjects > 0 ? totalValidations / totalProjects : 0;

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Project Analytics</h2>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Total Projects</h3>
                    <p className="text-2xl font-bold text-white">{totalProjects}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Completed Projects</h3>
                    <p className="text-2xl font-bold text-white">{completedProjects}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Total Funds Allocated</h3>
                    <p className="text-2xl font-bold text-white">{formatEther(totalFunds)} ETH</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Avg. Validations</h3>
                    <p className="text-2xl font-bold text-white">{averageValidations.toFixed(1)}</p>
                </div>
            </div>

            {/* Project Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-900">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Project ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Funds</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Validations</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {projects.map((project) => (
                            <tr key={project.id.toString()}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {project.id.toString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${project.isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {project.isCompleted ? 'Completed' : 'In Progress'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {formatEther(project.totalFunds)} ETH
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                    {project.validationCount.toString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 