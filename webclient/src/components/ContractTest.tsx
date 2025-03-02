'use client';

import { useReadContract } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';

export function ContractTest() {
  const { data: owner } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'owner',
    query: { enabled: true }
  }) as { data: string | undefined };

  const { data: validators } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getValidators',
    query: { enabled: true }
  });

  return (
    <div className="p-4 bg-gray-800 rounded-lg text-white text-sm">
      <h3 className="font-bold mb-2">Contract Debug Info</h3>
      <p>Contract Address: {FUND_ALLOCATION_ADDRESS}</p>
      <p>Owner: {owner}</p>
      <p>Validators: {validators ? (validators as string[]).length : 0}</p>
      <pre className="mt-2 text-xs">
        {validators ? JSON.stringify(validators, null, 2) : 'No validators'}
      </pre>
    </div>
  );
} 