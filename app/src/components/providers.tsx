"use client";

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { arcTestnet } from 'viem/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { CircleAuthProvider } from '@/lib/CircleAuthContext';

const projectId = 
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 
  '3a8170812b534d0ff9d794f19a901d64'; // Fallback to Scaffold-ETH test ID (unlocked for localhost:3000)

const config = getDefaultConfig({
  appName: 'StableBonds — Smart Business Payments',
  projectId: projectId,
  chains: [arcTestnet],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          theme={lightTheme({
            accentColor: '#18181b',
            accentColorForeground: 'white',
            borderRadius: 'medium',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          <CircleAuthProvider>
            {children}
          </CircleAuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
