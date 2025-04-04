import { useDisconnect, useAccount, useConnect } from 'wagmi';
import { safeDisconnect } from '../utils/walletConnectFix';

export function useWalletFix() {
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { connectors } = useConnect();

  const safelyDisconnect = () => {
    safeDisconnect(() => disconnect());
  };

  return {
    address,
    isConnected,
    disconnect: safelyDisconnect,
    connectors
  };
} 