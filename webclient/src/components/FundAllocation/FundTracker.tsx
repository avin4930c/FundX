'use client';

import { useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { FUND_ALLOCATION_ADDRESS } from '../../../config/wagmi';
import { fundAllocationABI } from '../../contracts/abis';

export function FundTracker() {
  const { data: totalFunds } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'totalFunds',
  });

  const { data: balance } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getBalance',
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-6">Fund Tracking Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Total Funds Allocated</h3>
          <p className="text-2xl font-bold text-blue-600">
            {totalFunds ? formatEther(totalFunds as bigint) : '0'} ETH
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold">Current Balance</h3>
          <p className="text-2xl font-bold text-green-600">
            {balance ? formatEther(balance as bigint) : '0'} ETH
          </p>
        </div>
      </div>
    </div>
  );
} 