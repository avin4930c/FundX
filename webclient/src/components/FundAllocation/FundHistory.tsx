'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { FUND_ALLOCATION_ADDRESS } from '../../../config/wagmi';
import { fundAllocationABI } from '../../contracts/abis';

interface FundEvent {
  sender: string;
  recipient: string;
  amount: bigint;
  projectName: string;
  timestamp: number;
  transactionHash: string;
}

export function FundHistory() {
  const [events, setEvents] = useState<FundEvent[]>([]);
  const publicClient = usePublicClient();

  useEffect(() => {
    async function getEvents() {
      try {
        // Get the FundsAllocated event from the ABI
        const eventAbi = fundAllocationABI.find(
          (item) => item.type === 'event' && item.name === 'FundsAllocated'
        );

        if (!eventAbi) {
          throw new Error('FundsAllocated event not found in ABI');
        }

        const logs = await publicClient?.getLogs({
          address: FUND_ALLOCATION_ADDRESS as `0x${string}`,
          event: eventAbi as any,
          fromBlock: 'earliest'
        });

        const formattedEvents = logs?.map(log => ({
          sender: (log as any).args.sender as string,
          recipient: (log as any).args.recipient as string,
          amount: (log as any).args.amount as bigint,
          projectName: (log as any).args.projectName as string,
          timestamp: Number((log as any).args.timestamp),
          transactionHash: log.transactionHash
        }));

        setEvents(formattedEvents || []);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    }

    if (publicClient) {
      getEvents();
    }
  }, [publicClient]);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg mt-6">
      <h2 className="text-2xl font-bold mb-6">Fund Allocation History</h2>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Project</p>
                <p className="font-medium">{event.projectName}</p>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">From</p>
                  <p className="font-mono text-sm">{event.sender}</p>
                  <p className="text-sm text-gray-600 mt-1">To</p>
                  <p className="font-mono text-sm">{event.recipient}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">
                  {formatEther(event.amount)} ETH
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(event.timestamp * 1000).toLocaleString()}
                </p>
              </div>
            </div>
            <a 
              href={`https://sepolia.etherscan.io/tx/${event.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm mt-2 inline-block"
            >
              View on Etherscan →
            </a>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-center text-gray-500">No fund allocations yet</p>
        )}
      </div>
    </div>
  );
} 