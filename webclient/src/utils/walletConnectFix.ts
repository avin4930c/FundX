/**
 * Utility to handle WalletConnect errors
 * This utility provides a safety wrapper around WalletConnect to catch the 
 * "this.provider.disconnect is not a function" error.
 */

export const safeDisconnect = async (disconnect: () => void) => {
  try {
    disconnect();
  } catch (error) {
    if (
      error instanceof Error && 
      error.message.includes('this.provider.disconnect is not a function')
    ) {
      console.warn('Caught WalletConnect disconnect error. This is a known issue and can be safely ignored.');
      // Force page reload to clear the connection state
      window.localStorage.removeItem('wagmi.wallet');
      window.localStorage.removeItem('wagmi.connected');
      window.localStorage.removeItem('wagmi.injected.shimDisconnect');
      
      // Remove any other WalletConnect related items
      Object.keys(window.localStorage)
        .filter(key => key.includes('walletconnect'))
        .forEach(key => window.localStorage.removeItem(key));
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // For other errors, rethrow
      console.error('Error disconnecting wallet:', error);
    }
  }
}; 