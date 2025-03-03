'use client';

import React from 'react';
import { useReadContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import { FUND_ALLOCATION_ADDRESS, wagmiConfig } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';

interface ValidatorStats {
    address: `0x${string}`;
    validationCount: number;
    projectsValidated: Set<bigint>;
    lastValidation: bigint;
}

interface ValidationEvent {
    validator: `0x${string}`;
    projectId: bigint;
    timestamp: bigint;
}

export function ValidatorPerformance() {
    const [validators, setValidators] = React.useState<Map<string, ValidatorStats>>(new Map());
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // Get project count for iterating through projects
    const { data: projectCount } = useReadContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'getProjectCount'
    }) as { data: bigint };

    // Fetch validator stats
    React.useEffect(() => {
        const fetchValidatorStats = async () => {
            if (!projectCount) return;

            try {
                const validatorMap = new Map<string, ValidatorStats>();

                // Fetch validation events for each project
                for (let i = 0; i < Number(projectCount); i++) {
                    const validations = await readContract(wagmiConfig, {
                        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
                        abi: fundAllocationABI,
                        functionName: 'getProjectValidations',
                        args: [BigInt(i)]
                    }) as ValidationEvent[];

                    // Process validation events
                    validations.forEach((validation) => {
                        const validatorAddress = validation.validator.toLowerCase();
                        const existingStats = validatorMap.get(validatorAddress);

                        if (existingStats) {
                            existingStats.validationCount++;
                            existingStats.projectsValidated.add(validation.projectId);
                            if (validation.timestamp > existingStats.lastValidation) {
                                existingStats.lastValidation = validation.timestamp;
                            }
                        } else {
                            validatorMap.set(validatorAddress, {
                                address: validation.validator,
                                validationCount: 1,
                                projectsValidated: new Set([validation.projectId]),
                                lastValidation: validation.timestamp
                            });
                        }
                    });
                }

                setValidators(validatorMap);
                setLoading(false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch validator stats');
                setLoading(false);
            }
        };

        fetchValidatorStats();
    }, [projectCount]);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="bg-gray-800 rounded-lg p-6">
                    <p className="text-gray-400 text-center">Loading validator performance...</p>
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

    const validatorArray = Array.from(validators.values());
    const totalValidations = validatorArray.reduce((sum, v) => sum + v.validationCount, 0);
    const averageValidationsPerValidator = totalValidations / validatorArray.length;

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Validator Performance</h2>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Total Validators</h3>
                    <p className="text-2xl font-bold text-white">{validatorArray.length}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Total Validations</h3>
                    <p className="text-2xl font-bold text-white">{totalValidations}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-6">
                    <h3 className="text-gray-400 text-sm mb-2">Avg. Validations per Validator</h3>
                    <p className="text-2xl font-bold text-white">{averageValidationsPerValidator.toFixed(1)}</p>
                </div>
            </div>

            {/* Validator Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-900">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Validator</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Validations</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Projects Validated</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Last Active</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {validatorArray
                            .sort((a, b) => b.validationCount - a.validationCount)
                            .map((validator) => (
                                <tr key={validator.address}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {validator.address}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {validator.validationCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {validator.projectsValidated.size}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                                        {new Date(Number(validator.lastValidation) * 1000).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
} 