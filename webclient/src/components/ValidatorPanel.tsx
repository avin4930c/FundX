'use client';

import React, { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';
import Link from 'next/link';

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

export function ValidatorPanel() {
  const { address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const [projectId, setProjectId] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Read project and validation status
  const { data: projectData, isError: isProjectError } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getProject',
    args: projectId ? [BigInt(projectId)] : undefined,
    query: {
      enabled: Boolean(projectId)
    }
  }) as unknown as {
    data: [string, string, `0x${string}`, bigint, bigint, boolean, boolean, bigint] | undefined;
    isError: boolean;
  };

  // Convert array response to Project object
  const project: Project | undefined = projectData ? {
    name: projectData[0],
    description: projectData[1],
    recipient: projectData[2],
    amount: projectData[3],
    timestamp: projectData[4],
    released: projectData[5],
    completed: projectData[6],
    validations: projectData[7]
  } : undefined;

  const { data: hasValidated } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'hasValidated',
    args: projectId && address ? [BigInt(projectId), address] : undefined,
    query: {
      enabled: Boolean(projectId && address)
    }
  });

  const { data: requiredValidations } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'requiredValidations',
    query: {
      enabled: true
    }
  });

  const handleProjectIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setError('');
    // Allow empty string or non-negative numbers
    if (value === '' || (Number(value) >= 0 && !isNaN(Number(value)))) {
      setProjectId(value);
    }
  };

  const handleValidate = async () => {
    if (!projectId) {
      setError('Please enter a project ID');
      return;
    }

    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'validateProject',
        args: [BigInt(projectId)]
      });
    } catch (error) {
      console.error('Validation failed:', error);
      setError(error instanceof Error ? error.message : 'Validation failed');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Validator Panel</h2>
          <Link
            href="/validated-projects"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            View Validated Projects
          </Link>
        </div>
      </div>
      <div className="p-6 space-y-4 bg-gray-800">
        {error && (
          <div className="p-4 bg-red-900/50 text-red-400 rounded-lg border border-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Project ID to Validate
          </label>
          <input
            type="number"
            min="0"
            value={projectId}
            onChange={handleProjectIdChange}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            placeholder="Enter project ID"
          />
        </div>

        {isProjectError && (
          <div className="p-4 bg-red-900/50 text-red-400 rounded-lg border border-red-700">
            Project not found
          </div>
        )}

        {project && (
          <div className="p-4 bg-gray-700 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-200">Project Details</h3>
            <p className="text-sm text-gray-300">Name: {project.name}</p>
            <p className="text-sm text-gray-300">Description: {project.description}</p>
            <p className="text-sm text-gray-300">
              Validations: {project.validations.toString()}/{requiredValidations?.toString() || '...'}
            </p>
            <p className="text-sm text-gray-300">
              Status: {project.completed ? 'Completed' : 'Pending'}
            </p>
            <p className="text-sm text-gray-300">
              Funds Released: {project.released ? 'Yes' : 'No'}
            </p>
          </div>
        )}

        <button
          onClick={handleValidate}
          disabled={!projectId || Boolean(isConfirming) || Boolean(hasValidated)}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all
            ${isConfirming
              ? 'bg-gray-600 cursor-not-allowed'
              : hasValidated
                ? 'bg-green-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
            }`}
        >
          {isConfirming ? 'Confirming...' :
            hasValidated ? 'Already Validated' :
              'Validate Project'}
        </button>

        {isConfirmed && project && (
          <div className="p-4 bg-green-900/50 text-green-400 rounded-lg border border-green-700">
            Validation confirmed! Project now has {project.validations.toString()} validations.
          </div>
        )}
      </div>
    </div>
  );
} 