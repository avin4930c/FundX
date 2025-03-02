'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { FUND_ALLOCATION_ADDRESS } from '../../config/wagmi';
import { fundAllocationABI } from '@/contracts/abis';

interface ValidatorInfo {
  isActive: boolean;
  validationsCount: bigint;
}

export function ValidatorWeights() {
  const { address } = useAccount();
  const [newWeight, setNewWeight] = useState('');
  const [selectedValidator, setSelectedValidator] = useState('');

  // Get list of validators
  const { data: validatorList } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'getValidators',
    query: { enabled: true }
  }) as { data: string[] | undefined };

  // Get validator weights and info
  const { data: validatorInfo } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'validators',
    args: selectedValidator ? [selectedValidator] : undefined,
    query: { enabled: Boolean(selectedValidator) }
  }) as { data: ValidatorInfo | undefined };

  const { data: validatorWeight } = useReadContract({
    address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
    abi: fundAllocationABI,
    functionName: 'validatorWeights',
    args: selectedValidator ? [selectedValidator] : undefined,
    query: { enabled: Boolean(selectedValidator) }
  }) as { data: bigint | undefined };

  const { writeContract } = useWriteContract();

  const handleSetWeight = async () => {
    if (!selectedValidator || !newWeight) return;

    try {
      await writeContract({
        address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
        abi: fundAllocationABI,
        functionName: 'setValidatorWeight',
        args: [selectedValidator, BigInt(newWeight)]
      });
      console.log('Weight updated successfully');
    } catch (error) {
      console.error('Error setting weight:', error);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-bold text-white">Validator Weights</h2>
      </div>
      <div className="p-6 space-y-6 bg-gray-800">
        {/* Debug Info */}
        <div className="p-4 bg-gray-700/50 rounded-lg text-xs font-mono">
          <p>Contract Address: {FUND_ALLOCATION_ADDRESS}</p>
          <p>Current Account: {address}</p>
          <p>Validator Count: {validatorList?.length || 0}</p>
        </div>

        {/* Validator Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select Validator
          </label>
          <select
            value={selectedValidator}
            onChange={(e) => setSelectedValidator(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="">Select a validator</option>
            {validatorList?.map((addr) => (
              <option key={addr} value={addr}>
                {addr}
              </option>
            ))}
          </select>
        </div>

        {/* Validator Info */}
        {selectedValidator && validatorInfo && (
          <div className="p-4 bg-gray-700 rounded-lg space-y-2">
            <h3 className="font-medium text-gray-200">Validator Status</h3>
            <p className="text-sm text-gray-300">
              Active: {validatorInfo.isActive ? '✓' : '✗'}
            </p>
            <p className="text-sm text-gray-300">
              Validations: {validatorInfo.validationsCount.toString()}
            </p>
            <p className="text-sm text-gray-300">
              Current Weight: {validatorWeight ? validatorWeight.toString() : '1'} 
              {(!validatorWeight || validatorWeight.toString() === '0') && ' (default)'}
            </p>
          </div>
        )}

        {/* Weight Setting */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Weight
            </label>
            <input
              type="number"
              min="1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Enter new weight (1-100)"
            />
          </div>

          <button
            onClick={handleSetWeight}
            disabled={!selectedValidator || !newWeight}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-all
              bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600
              disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Set Weight
          </button>
        </div>
      </div>
    </div>
  );
} 