'use client';

import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { wagmiConfig } from '../../config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from '@/components/Navbar';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Navbar />
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}