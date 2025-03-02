import { useState, useEffect } from 'react';
import { useReadContract } from 'wagmi';

export function useContractRead(config: any) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { data: result, isError, isLoading: loading, error: readError } = useReadContract(config);

  useEffect(() => {
    if (result) {
      setData(result);
      setIsLoading(false);
    }
    if (isError) {
      setError(readError);
      setIsLoading(false);
    }
  }, [result, isError, readError]);

  return { data, isLoading, error };
} 