"use client";

import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { arcTestnet } from 'viem/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';

const projectId = '3fcc6bba6f1de962d911bb5b5c3dba68'; 

const config = getDefaultConfig({
  appName: 'StablePay — Smart Business Payments',
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
            accentColor: '#2563eb',
            accentColorForeground: 'white',
            borderRadius: 'large',
            fontStack: 'system',
            overlayBlur: 'small',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
