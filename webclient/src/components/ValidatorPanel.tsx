'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';

interface Project {
  name: string;
  validations: bigint;
  completed: boolean;
}

export function ValidatorPanel() {
  const { address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const [projectId, setProjectId] = useState('');

  // Read project and validation status
  const { data: project } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getProject',
    args: projectId ? [BigInt(projectId)] : undefined,
    query: {
      enabled: Boolean(projectId)
    }
  }) as { data: Project | undefined };

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

  const handleValidate = async () => {
    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'validateProject',
        args: [BigInt(projectId)]
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-bold text-white">Validator Panel</h2>
      </div>
      <div className="p-6 space-y-4 bg-gray-800">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Project ID to Validate
          </label>
          <input
            type="number"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
            placeholder="Enter project ID"
          />
        </div>

        {project && (
          <div className="p-4 bg-gray-700 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-200">Project Details</h3>
            <p className="text-sm text-gray-300">Name: {project.name}</p>
            <p className="text-sm text-gray-300">
              Validations: {project.validations.toString()}/{requiredValidations?.toString()}
            </p>
            <p className="text-sm text-gray-300">
              Status: {project.completed ? 'Completed' : 'Pending'}
            </p>
          </div>
        )}

        <button
          onClick={handleValidate}
          disabled={Boolean(isConfirming) || Boolean(hasValidated)}
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

        {isConfirmed && (
          <div className="p-4 bg-green-900/50 text-green-400 rounded-lg border border-green-700">
            Validation confirmed! Project now has {project?.validations.toString()} validations.
          </div>
        )}
      </div>
    </div>
  );
} 