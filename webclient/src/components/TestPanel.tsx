'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';

export function TestPanel() {
  const { address } = useAccount();
  const { writeContract, data: hash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    recipient: '',
    amount: ''
  });

  const handleAllocate = async () => {
    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'allocateFunds',
        args: [
          formData.projectName,
          formData.description,
          formData.recipient as `0x${string}`
        ],
        value: parseEther(formData.amount)
      });
    } catch (error) {
      console.error('Error allocating funds:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-bold text-white">Allocate Funds</h2>
      </div>
      
      <div className="p-6 space-y-6 bg-gray-800">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData({...formData, projectName: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              rows={3}
              placeholder="Enter project description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={formData.recipient}
              onChange={(e) => setFormData({...formData, recipient: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-mono text-sm"
              placeholder="0x..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Amount (ETH)
            </label>
            <input
              type="text"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="0.0"
            />
          </div>
        </div>

        <button
          onClick={handleAllocate}
          disabled={isConfirming}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all
            ${isConfirming 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
            }`}
        >
          {isConfirming ? 'Confirming...' : 'Allocate Funds'}
        </button>

        {isConfirmed && (
          <div className="mt-4 p-4 bg-green-900/50 text-green-400 rounded-lg border border-green-700">
            Transaction confirmed! 
            <a 
              href={`https://sepolia.etherscan.io/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline ml-1 text-blue-400 hover:text-blue-300"
            >
              View on Etherscan
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 