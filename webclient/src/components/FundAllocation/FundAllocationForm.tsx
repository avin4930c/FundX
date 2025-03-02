'use client';

import { useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { FUND_ALLOCATION_ADDRESS } from '../../../config/wagmi';
import { fundAllocationABI } from '../../contracts/abis';

interface FundAllocationFormProps {
  projectName: string;
  recipientAddress: string;
  amount: string;
  description: string;
  milestones: number;
}

export function FundAllocationForm() {
  const [formData, setFormData] = useState<FundAllocationFormProps>({
    projectName: '',
    recipientAddress: '',
    amount: '',
    description: '',
    milestones: 1
  });

  const { data: hash, error, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'allocateFunds',
        args: [
          formData.projectName,
          formData.description,
          formData.recipientAddress as `0x${string}`,
          BigInt(formData.milestones)
        ],
        value: parseEther(formData.amount)
      });
      
      // Clear form
      setFormData({
        projectName: '',
        recipientAddress: '',
        amount: '',
        description: '',
        milestones: 1
      });
      
      // Trigger a refresh of pending projects
      window.dispatchEvent(new Event('projectAdded'));
    } catch (error) {
      console.error('Error allocating funds:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Allocate Funds</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Project Name
          </label>
          <input
            type="text"
            value={formData.projectName}
            onChange={(e) => setFormData({...formData, projectName: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.recipientAddress}
            onChange={(e) => setFormData({...formData, recipientAddress: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({...formData, amount: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Number of Milestones
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={formData.milestones}
            onChange={(e) => setFormData({...formData, milestones: parseInt(e.target.value)})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending || isConfirming}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Processing...' : 'Allocate Funds'}
        </button>

        {error && (
          <div className="text-red-600 mt-2">
            Error: {error.message}
          </div>
        )}

        {isConfirmed && (
          <div className="text-green-600 mt-2">
            Transaction confirmed! Hash: {hash}
          </div>
        )}
      </form>
    </div>
  );
} 