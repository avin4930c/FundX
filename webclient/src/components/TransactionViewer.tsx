'use client';

import { usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';

export function TransactionViewer({ hash }: { hash: string }) {
  const [txDetails, setTxDetails] = useState<any>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchTx = async () => {
      const tx = await publicClient?.getTransaction({ hash: hash as `0x${string}` });
      setTxDetails(tx);
    };
    if (hash) fetchTx();
  }, [hash]);

  if (!txDetails) return null;

  return (
    <div className="mt-4 p-4 bg-gray-700 rounded-lg">
      <h3 className="text-white font-medium">Transaction Details</h3>
      <pre className="mt-2 text-xs text-gray-300 overflow-auto">
        {JSON.stringify(txDetails, null, 2)}
      </pre>
    </div>
  );
} 