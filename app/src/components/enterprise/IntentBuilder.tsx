"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useSwitchChain } from 'wagmi';
import { parseAbi, parseUnits, encodeFunctionData, encodeAbiParameters, pad, keccak256, decodeAbiParameters } from 'viem';
import { toast } from 'sonner';
import { ExternalLink, Shield, HelpCircle, CheckCircle2, Clock, ArrowRight, Info, Wallet, Building2, Calendar, DollarSign, Loader2, RefreshCw, AlertOctagon } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';
import CustomDropdown from './CustomDropdown';

// Sleek Custom SVG Icons for Networks
const ArcIcon = (
  <svg fill="none" viewBox="0 0 48 48" className="w-4 h-4 shrink-0 cb-icon cb-icon-blockchain/arc pointer-events-none" aria-hidden="true" data-testid="icon-blockchain/arc" focusable="false" role="img">
    <g clipPath="url(#clip0_1_2)">
      <path fill="url(#paint0_linear_1_2)" d="M48 24C48 10.745 37.255 0 24 0S0 10.745 0 24s10.745 24 24 24 24-10.745 24-24"></path>
      <path fill="url(#paint1_linear_1_2)" d="M23.993 8.4c3.957 0 7.473 3.428 9.903 9.651 1.264 3.237 2.194 7.083 2.745 11.267.05.374.091.753.134 1.132q.023.037.02.063c.001.009.324 2.03.392 5.537h-.036c-.48-.394-6.144-4.845-15.533-3.556.141-1.589.336-3.135.588-4.617l.04-.224c3.683-.111 6.906.317 9.378.877l-.026-.177c-.508-3.164-1.258-6.06-2.224-8.536-1.58-4.048-3.642-6.562-5.38-6.562-1.739 0-3.801 2.514-5.381 6.562-.383.979-.731 2.023-1.043 3.124a47 47 0 0 0-1.102 4.936 62 62 0 0 0-.81 8.173H10.8c.224-6.77 1.372-13.087 3.29-17.999 2.43-6.224 5.947-9.651 9.903-9.651"></path>
    </g>
    <defs>
      <linearGradient id="paint0_linear_1_2" x1="24" x2="24" y1="0" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#000B24"></stop>
        <stop offset="0.743" stopColor="#052950"></stop>
        <stop offset="1" stopColor="#416D91"></stop>
      </linearGradient>
      <linearGradient id="paint1_linear_1_2" x1="23.994" x2="46.193" y1="8.4" y2="54.921" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff"></stop>
        <stop offset="1" stopColor="#fff" stopOpacity="0"></stop>
      </linearGradient>
      <clipPath id="clip0_1_2">
        <path fill="#fff" d="M0 0h48v48H0z"></path>
      </clipPath>
    </defs>
  </svg>
);

const UnifiedBalanceIcon = (
  <svg className="w-4 h-4 text-emerald-500 shrink-0 fill-emerald-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const EthereumIcon = (
  <svg fill="none" viewBox="0 0 120 120" className="w-4 h-4 shrink-0 cb-icon cb-icon-eth pointer-events-none" aria-hidden="true" data-testid="icon-eth" focusable="false" role="img">
    <circle cx="60" cy="60" r="60" fill="#627EEA"></circle>
    <path fill="#C0CCF7" d="m59.837 24-.478 1.621v47.042l.478.476 21.835-12.907z"></path>
    <path fill="#fff" d="M59.836 24 38 60.232l21.836 12.907V24"></path>
    <path fill="#C0CCF7" d="m59.836 77.273-.269.329v16.757l.27.785 21.849-30.771z"></path>
    <path fill="#fff" d="M59.836 95.144v-17.87L38 64.372z"></path>
    <path fill="#8198EE" d="m59.836 73.14 21.836-12.908-21.836-9.926z"></path>
    <path fill="#C0CCF7" d="m38 60.232 21.836 12.907V50.306z"></path>
  </svg>
);

const ArbitrumIcon = (
  <svg fill="none" viewBox="0 0 120 120" className="w-4 h-4 shrink-0 cb-icon cb-icon-arb pointer-events-none" aria-hidden="true" data-testid="icon-arb" focusable="false" role="img">
    <circle cx="60" cy="60" r="60" fill="#2D374B"></circle>
    <path fill="#2D374B" fillRule="evenodd" d="M76.963 47.521 70.629 58.27 87.11 84.925l5.96-3.453L61.9 99.535c-.6.217-1.302.205-1.898-.037l-1.407-.81-11.78-6.775 28.267-47.946-12.526.046-28.34 46.765-3.3-1.9 28.003-44.91-4.752-.126c-4.05-.057-8.412.995-10.414 4.264L27.85 72.754l-.047-28.617q.01-.158.038-.31a2.64 2.64 0 0 1 1.504-1.936l.115-.052 29.836-17.29.107-.067q.13-.086.275-.159a2.7 2.7 0 0 1 2.349-.011l30.738 17.68a2.65 2.65 0 0 1 1.223 2.108l.048 30.013zM61.148 74.403l11.897 18.673 10.99-6.37L68.411 62.08z" clipRule="evenodd"></path>
    <path fill="#28A0F0" d="m61.148 74.403 11.898 18.673 10.99-6.37L68.41 62.08zM94.044 79.216l-.008-5.103L76.963 47.52l-6.334 10.748L87.11 84.924l5.96-3.453a2.64 2.64 0 0 0 .975-1.923z"></path>
    <path fill="#fff" d="m22.5 84.029 8.415 4.849 28.004-44.91-4.752-.126c-4.05-.057-8.412.995-10.414 4.264L27.85 72.754l-5.35 8.22zM75.082 43.967l-12.526.046-28.34 46.765 9.906 5.704 2.694-4.569z"></path>
    <path fill="#96BEDC" d="M99.323 43.903c-.105-2.62-1.523-5.018-3.745-6.414L64.437 19.58c-2.198-1.107-4.943-1.108-7.145-.001-.26.131-30.283 17.543-30.283 17.543q-.626.301-1.193.707a7.92 7.92 0 0 0-3.316 6.057v37.087l5.35-8.22-.047-28.617q.01-.156.038-.309a2.64 2.64 0 0 1 1.063-1.68c.141-.101 30.678-17.777 30.775-17.825a2.71 2.71 0 0 1 2.348-.011l30.738 17.68a2.65 2.65 0 0 1 1.224 2.107v35.45c-.038.75-.335 1.447-.92 1.922l-5.959 3.454-3.074 1.782-10.99 6.369L61.9 99.535c-.6.217-1.302.204-1.898-.038l-13.186-7.584-2.694 4.569 11.85 6.822c.392.223.741.421 1.028.582.444.248.746.415.853.467.842.409 2.054.647 3.146.647a7.9 7.9 0 0 0 2.901-.546l32.373-18.748c1.858-1.44 2.951-3.61 3.05-5.962z"></path>
  </svg>
);

const BaseIcon = (
  <svg fill="none" viewBox="0 0 120 120" className="w-4 h-4 shrink-0 cb-icon cb-icon-base pointer-events-none" aria-hidden="true" data-testid="icon-base" focusable="false" role="img">
    <path fill="#2151F5" d="M60 120c33.137 0 60-26.863 60-60S93.137 0 60 0 0 26.863 0 60s26.863 60 60 60"></path>
    <path fill="#fff" d="M59.917 108C86.473 108 108 86.51 108 60S86.473 12 59.917 12C34.722 12 14.053 31.344 12 55.965h63.556v8.07H12C14.053 88.656 34.722 108 59.917 108"></path>
  </svg>
);

const OptimismIcon = (
  <svg fill="none" viewBox="0 0 120 120" className="w-4 h-4 shrink-0 cb-icon cb-icon-op pointer-events-none" aria-hidden="true" data-testid="icon-op" focusable="false" role="img">
    <path fill="#FF0420" d="M60 120c33.137 0 60-26.863 60-60S93.137 0 60 0 0 26.863 0 60s26.863 60 60 60"></path>
    <path fill="#fff" d="M31.594 86q-8.637 0-14.145-4.041C13.816 79.226 12 75.299 12 70.258c0-1.078.116-2.348.348-3.888.618-3.464 1.507-7.62 2.666-12.51C18.3 40.62 26.803 34 40.485 34c3.71 0 7.072.616 10.009 1.886 2.937 1.193 5.256 3.04 6.956 5.504Q60 45.028 60 50.05q0 1.502-.348 3.81c-.734 4.273-1.584 8.469-2.628 12.51-1.7 6.582-4.599 11.547-8.773 14.819C44.116 84.422 38.551 86 31.594 86m1.044-10.392c2.705 0 4.985-.809 6.879-2.387 1.932-1.578 3.324-4.003 4.135-7.313 1.12-4.542 1.971-8.468 2.55-11.855.194-1 .31-2.04.31-3.117 0-4.388-2.28-6.582-6.88-6.582-2.704 0-5.023.808-6.956 2.386-1.893 1.578-3.246 4.003-4.058 7.313-.888 3.233-1.739 7.16-2.628 11.855-.193.963-.309 1.963-.309 3.04-.039 4.466 2.319 6.66 6.957 6.66M63.456 84c-.526 0-.902-.152-1.202-.495-.226-.38-.301-.799-.226-1.293l9.73-46.424c.075-.532.338-.95.789-1.293A2.05 2.05 0 0 1 73.899 34h18.745c5.222 0 9.392 1.103 12.548 3.273 3.193 2.206 4.808 5.365 4.808 9.512 0 1.18-.15 2.436-.413 3.73-1.165 5.479-3.531 9.512-7.138 12.138-3.531 2.625-8.377 3.92-14.538 3.92h-9.504l-3.23 15.639c-.113.532-.339.95-.79 1.293a2.05 2.05 0 0 1-1.352.495zM88.4 56.717c1.99 0 3.681-.533 5.146-1.636 1.503-1.104 2.48-2.664 2.968-4.719.15-.799.225-1.522.225-2.13 0-1.37-.413-2.436-1.202-3.159-.789-.761-2.179-1.142-4.095-1.142H82.99l-2.667 12.786z"></path>
  </svg>
);

// Sleek Custom SVG Icons for Transfer Methods
const StandardIcon = (
  <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 22V11M21 22V11M12 22V11M2 11h20M12 2L2 7h20L12 2zM3 22h18" />
  </svg>
);

const ExpressIcon = (
  <svg className="w-4 h-4 text-amber-500 shrink-0 fill-amber-500/10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const EconomyIcon = (
  <svg className="w-4 h-4 text-emerald-600 shrink-0 fill-emerald-600/5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const InternationalIcon = (
  <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
  </svg>
);

// Sleek Currency Icons
const UsdcIcon = (
  <svg fill="none" viewBox="0 0 120 120" className="w-4 h-4 shrink-0 cb-icon cb-icon-usdc pointer-events-none" aria-hidden="true" data-testid="icon-usdc" focusable="false" role="img">
    <path fill="#0B53BF" d="M60 120c33.137 0 60-26.863 60-60S93.137 0 60 0 0 26.863 0 60s26.863 60 60 60"></path>
    <path fill="#fff" d="M70.8 16.313v7.725C86.211 28.688 97.498 43.013 97.498 60s-11.287 31.313-26.7 35.963v7.725C90.45 98.888 105 81.15 105 60s-14.55-38.887-34.2-43.687M22.499 60c0-16.987 11.287-31.312 26.7-35.962v-7.725c-19.65 4.8-34.2 22.537-34.2 43.687s14.55 38.888 34.2 43.688v-7.725C33.786 91.35 22.499 76.988 22.499 60"></path>
    <path fill="#fff" d="M76.124 68.363c0-15.338-24.037-9.038-24.037-17.513 0-3.037 2.437-4.987 7.087-4.987 5.55 0 7.463 2.7 8.063 6.337h7.65c-.683-6.826-4.6-11.137-11.138-12.42v-6.03h-7.5v5.814c-7.161.912-11.662 5.083-11.662 11.286 0 15.413 24.075 9.638 24.075 17.963 0 3.15-3.038 5.25-8.176 5.25-6.712 0-8.924-2.963-9.75-7.05h-7.462c.483 7.477 5.094 12.157 12.975 13.324v5.913h7.5v-5.834c7.692-.994 12.375-5.468 12.375-12.053"></path>
  </svg>
);

const EurcIcon = (
  <svg fill="none" viewBox="0 0 120 120" className="w-4 h-4 shrink-0 cb-icon cb-icon-eurc pointer-events-none" aria-hidden="true" data-testid="icon-eurc" focusable="false" role="img">
    <path fill="#0B53BF" d="M60 120c33.137 0 60-26.863 60-60S93.137 0 60 0 0 26.863 0 60s26.863 60 60 60"></path>
    <path fill="#fff" stroke="#0B53BF" strokeMiterlimit="10" strokeWidth="0.035" d="M72.749 74.287c-2.625 1.05-5.475 1.65-8.212 1.65-5.422 0-10.533-2.308-12.976-7.875h11.926l2.324-5.624H50.174A26 26 0 0 1 50.062 60q0-1.275.112-2.438h17.625l2.325-5.625H51.562c2.442-5.566 7.553-7.875 12.975-7.875 2.737 0 5.587.6 8.212 1.65l2.4-5.7c-3.225-1.687-6.862-2.512-10.5-2.512-8.78 0-17.654 4.908-20.867 14.437h-5.758v5.625h4.605a28 28 0 0 0 0 4.876h-4.605v5.624h5.758C46.995 77.592 55.87 82.5 64.65 82.5c3.638 0 7.275-.825 10.5-2.513z"></path>
    <path fill="#fff" stroke="#0B53BF" strokeMiterlimit="10" strokeWidth="0.035" d="M22.499 60c0-16.988 11.287-31.313 26.7-35.963v-7.725c-19.65 4.8-34.2 22.538-34.2 43.688s14.55 38.887 34.2 43.687v-7.725C33.786 91.35 22.499 76.987 22.499 60ZM70.799 16.312v7.725c15.412 4.65 26.7 18.975 26.7 35.963 0 16.987-11.287 31.312-26.7 35.962v7.725c19.65-4.8 34.2-22.537 34.2-43.687s-14.55-38.888-34.2-43.688Z"></path>
  </svg>
);

// Conversion Timing Icons
const SwapImmediateIcon = (
  <svg className="w-4 h-4 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16" />
  </svg>
);

const SwapMaturityIcon = (
  <svg className="w-4 h-4 text-zinc-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 2h14M5 22h14M19 2v4a7 7 0 0 1-14 0V2M5 22v-4a7 7 0 0 1 14 0v4" />
  </svg>
);

// Arc Testnet Constants
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const ERC20_ABI = parseAbi(["function approve(address spender, uint256 amount) external returns (bool)"]);
const VAULT_ABI = parseAbi([
  "function createBondWithIntent(uint256 _amount, uint256 _termId, address _supplier, uint32 _destDomain) external",
  "function receiveGatewayPayment(address _owner, uint256 _amount, uint256 _termId, address _supplier, uint32 _destDomain, address _depositToken, address _settlementToken, bool _swapAtDeposit) external"
]);

const VAULT_ABI_COMPLIANCE = parseAbi([
  "function complianceRegistry() external view returns (address)"
]);

const REGISTRY_ABI = parseAbi([
  "function isVerified(address _user) external view returns (bool)",
  "function isBlacklisted(address _user) external view returns (bool)"
]);

const TERMS_OPTIONS = [
  // Senior Tranche (tranche = 0)
  { id: 1, durationDays: 30, apyBps: 400, label: "30 Days", apyLabel: "4.00% APY", tranche: 0, trancheLabel: "Senior", description: "First-loss protected low-risk yield" },
  { id: 2, durationDays: 60, apyBps: 450, label: "60 Days", apyLabel: "4.50% APY", tranche: 0, trancheLabel: "Senior", description: "First-loss protected low-risk yield" },
  { id: 3, durationDays: 90, apyBps: 500, label: "90 Days", apyLabel: "5.00% APY", tranche: 0, trancheLabel: "Senior", description: "First-loss protected low-risk yield" },
  { id: 4, durationDays: 180, apyBps: 550, label: "180 Days", apyLabel: "5.50% APY", tranche: 0, trancheLabel: "Senior", description: "First-loss protected low-risk yield" },
  { id: 5, durationDays: 365, apyBps: 600, label: "365 Days", apyLabel: "6.00% APY", tranche: 0, trancheLabel: "Senior", description: "First-loss protected low-risk yield" },
  // Junior Tranche (tranche = 1)
  { id: 6, durationDays: 30, apyBps: 800, label: "30 Days", apyLabel: "8.00% APY", tranche: 1, trancheLabel: "Junior", description: "High-yield first-loss absorbing capital" },
  { id: 7, durationDays: 60, apyBps: 900, label: "60 Days", apyLabel: "9.00% APY", tranche: 1, trancheLabel: "Junior", description: "High-yield first-loss absorbing capital" },
  { id: 8, durationDays: 90, apyBps: 1000, label: "90 Days", apyLabel: "10.00% APY", tranche: 1, trancheLabel: "Junior", description: "High-yield first-loss absorbing capital" },
  { id: 9, durationDays: 180, apyBps: 1100, label: "180 Days", apyLabel: "11.00% APY", tranche: 1, trancheLabel: "Junior", description: "High-yield first-loss absorbing capital" },
  { id: 10, durationDays: 365, apyBps: 1200, label: "365 Days", apyLabel: "12.00% APY", tranche: 1, trancheLabel: "Junior", description: "High-yield first-loss absorbing capital" },
];

const SOURCE_NETWORKS = [
  { id: 'arc', name: 'Arc Testnet', chainId: 5042002, icon: '' },
  { id: 'unified-balance', name: 'Unified Balance (Circle Gateway)', chainId: 0, icon: '' },
  { id: 'ethereum', name: 'Ethereum Sepolia', chainId: 11155111, icon: '' },
  { id: 'arbitrum', name: 'Arbitrum Sepolia', chainId: 421614, icon: '' },
  { id: 'base', name: 'Base Sepolia', chainId: 84532, icon: '' },
  { id: 'optimism', name: 'Optimism Sepolia', chainId: 11155420, icon: '' }
];

const SOURCE_NETWORKS_OPTIONS = [
  { value: 'arc', label: 'Arc Testnet', sublabel: 'Fastest settlement, low fees (Native)', icon: ArcIcon },
  { value: 'unified-balance', label: 'Unified Balance', sublabel: 'Gasless automatic routing (Circle Gateway)', icon: UnifiedBalanceIcon },
  { value: 'ethereum', label: 'Ethereum Sepolia', sublabel: 'L1 Ethereum', icon: EthereumIcon },
  { value: 'arbitrum', label: 'Arbitrum Sepolia', sublabel: 'L2 Rollup', icon: ArbitrumIcon },
  { value: 'base', label: 'Base Sepolia', sublabel: 'L2 Rollup', icon: BaseIcon },
  { value: 'optimism', label: 'Optimism Sepolia', sublabel: 'L2 Rollup', icon: OptimismIcon }
];

const CURRENCY_OPTIONS = [
  { value: 'USDC', label: 'USDC (USD Coin)', sublabel: 'US Dollar Pegged Stablecoin', icon: UsdcIcon },
  { value: 'EURC', label: 'EURC (Euro Coin)', sublabel: 'Euro Pegged Stablecoin', icon: EurcIcon }
];

const SOURCE_CONFIGS: Record<string, {
  tokenMessenger: `0x${string}`;
  usdc: `0x${string}`;
  eurc?: `0x${string}`;
}> = {
  ethereum: {
    tokenMessenger: "0x9fD9950665BD2a07FEC3ad09b4055D5d3D4922A6",
    usdc: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    eurc: "0x0811863eb9917a23d47f02260cc7b3d2b27a3a9a"
  },
  arbitrum: {
    tokenMessenger: "0x9fD9950665BD2a07FEC3ad09b4055D5d3D4922A6",
    usdc: "0x75faf114eafb1BDbe6F00490b4532d0a4055462f",
  },
  base: {
    tokenMessenger: "0x9fD9950665BD2a07FEC3ad09b4055D5d3D4922A6",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  optimism: {
    tokenMessenger: "0x9fD9950665BD2a07FEC3ad09b4055D5d3D4922A6",
    usdc: "0x5fd84259d66Cd46123540766Be93DFE6d43130D7",
  }
};

// Human-readable network names — no blockchain jargon
const NETWORK_OPTIONS = [
  { value: "0", label: "Standard Transfer", sublabel: "Most common option", icon: "" },
  { value: "3", label: "Express Transfer", sublabel: "Faster settlement", icon: "" },
  { value: "6", label: "Economy Transfer", sublabel: "Lower fees", icon: "" },
  { value: "22", label: "International Transfer", sublabel: "Cross-border payments", icon: "" },
];

const NETWORK_OPTIONS_DROPDOWN = [
  { value: "0", label: "Standard Transfer", sublabel: "Most common option", icon: StandardIcon },
  { value: "3", label: "Express Transfer", sublabel: "Faster settlement", icon: ExpressIcon },
  { value: "6", label: "Economy Transfer", sublabel: "Lower fees", icon: EconomyIcon },
  { value: "22", label: "International Transfer", sublabel: "Cross-border payments", icon: InternationalIcon },
];

const SWAP_TIMING_OPTIONS = [
  { value: 'immediate', label: 'Swap immediately', sublabel: 'Lock in conversion rate today', icon: SwapImmediateIcon },
  { value: 'maturity', label: 'Swap at maturity', sublabel: 'Market rate at delivery', icon: SwapMaturityIcon }
];

// Tooltip Component — contextual helper
function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
        aria-label="More info"
      >
        <HelpCircle size={13} />
      </button>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium leading-snug w-56 z-50 shadow-lg animate-fade-in"
          style={{ 
            background: 'var(--foreground)', 
            color: 'var(--primary-foreground)' 
          }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 -mt-1"
            style={{ background: 'var(--foreground)' }}></div>
        </div>
      )}
    </span>
  );
}

// Step indicator for the 2-step flow
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      {[
        { num: 1, label: "Verify funds" },
        { num: 2, label: "Schedule payment" },
      ].map((step, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-all duration-300 ${
            currentStep > step.num 
              ? 'bg-[var(--success)] text-white' 
              : currentStep === step.num 
                ? 'bg-[var(--primary)] text-white animate-pulse-glow' 
                : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
          }`}>
            {currentStep > step.num ? <CheckCircle2 size={14} /> : step.num}
          </div>
          <span className={`text-xs font-medium hidden sm:inline ${
            currentStep >= step.num ? 'text-[var(--foreground)]' : 'text-[var(--muted-foreground)]'
          }`}>
            {step.label}
          </span>
          {i < 1 && (
            <div className={`w-8 h-0.5 rounded mx-1 transition-colors ${
              currentStep > 1 ? 'bg-[var(--success)]' : 'bg-[var(--border)]'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function IntentBuilder({ onNavigateToCompliance }: { onNavigateToCompliance?: () => void }) {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount, logout } = useCircleAuth();
  const publicClient = usePublicClient();

  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  // Compliance verification states
  const [isVerified, setIsVerified] = useState<boolean>(true); // Default to true while checking
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false);
  const [checkingCompliance, setCheckingCompliance] = useState<boolean>(true);

  useEffect(() => {
    const checkUserCompliance = async () => {
      if (!address) {
        setCheckingCompliance(false);
        return;
      }
      setCheckingCompliance(true);
      try {
        const localVerify = localStorage.getItem(`kyc_verified_${address}`) === 'true';
        const localBlack = localStorage.getItem(`kyc_blacklisted_${address}`) === 'true';

        if (publicClient) {
          const regAddr = await publicClient.readContract({
            address: VAULT_ADDRESS,
            abi: VAULT_ABI_COMPLIANCE,
            functionName: 'complianceRegistry'
          }).catch(() => null);

          if (regAddr && regAddr !== '0x0000000000000000000000000000000000000000') {
            const [onChainVerify, onChainBlack] = await Promise.all([
              publicClient.readContract({
                address: regAddr as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'isVerified',
                args: [address]
              }).catch(() => false),
              publicClient.readContract({
                address: regAddr as `0x${string}`,
                abi: REGISTRY_ABI,
                functionName: 'isBlacklisted',
                args: [address]
              }).catch(() => false)
            ]);

            setIsVerified(localVerify || !!onChainVerify);
            setIsBlacklisted(localBlack || !!onChainBlack);
            setCheckingCompliance(false);
            return;
          }
        }

        setIsVerified(localVerify);
        setIsBlacklisted(localBlack);
      } catch (err) {
        console.error("Compliance query error in IntentBuilder:", err);
      } finally {
        setCheckingCompliance(false);
      }
    };

    checkUserCompliance();
    
    // Listen for custom events when compliance changes
    const handleStatusChange = () => checkUserCompliance();
    window.addEventListener('compliance-status-changed', handleStatusChange);
    return () => {
      window.removeEventListener('compliance-status-changed', handleStatusChange);
    };
  }, [address, publicClient]);

  // Circle Smart Account Transaction State
  const [smartTxHash, setSmartTxHash] = useState<string | null>(null);
  const [smartPending, setSmartPending] = useState(false);
  const [smartConfirming, setSmartConfirming] = useState(false);
  const [smartSuccess, setSmartSuccess] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [selectedTermId, setSelectedTermId] = useState(1);
  const [depositToken, setDepositToken] = useState('USDC');
  const [settlementToken, setSettlementToken] = useState('USDC');
  const [swapAtDeposit, setSwapAtDeposit] = useState(true);

  const selectedTerm = useMemo(() => {
    return TERMS_OPTIONS.find(t => t.id === selectedTermId) || TERMS_OPTIONS[0];
  }, [selectedTermId]);
  
  const duration = selectedTerm.durationDays.toString();
  const [supplierAddress, setSupplierAddress] = useState('');
  const [destChain, setDestChain] = useState('3');
  const [showPreview, setShowPreview] = useState(false);

  // CCTP Bridge Progress States
  const [sourceNetwork, setSourceNetwork] = useState<'arc' | 'ethereum' | 'arbitrum' | 'base' | 'optimism' | 'unified-balance'>('arc');
  const [bridgeStep, setBridgeStep] = useState<0 | 1 | 2 | 3>(0);
  const [bridgeTxHash, setBridgeTxHash] = useState<string | null>(null);
  const [messageHash, setMessageHash] = useState<string | null>(null);
  const [messageBytes, setMessageBytes] = useState<string | null>(null);
  const [attestationBytes, setAttestationBytes] = useState<string | null>(null);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);

  // Hook for switching networks and active chain
  const { switchChain } = useSwitchChain();
  const { chain } = useAccount();

  // Web3 Hooks — CCTP Cross-chain deposit
  const { data: cctpApproveHash, writeContract: writeCctpApprove, isPending: isCctpApproving } = useWriteContract();
  const { isLoading: isCctpApproveConfirming, isSuccess: isCctpApproveSuccess } = useWaitForTransactionReceipt({ hash: cctpApproveHash });

  const { data: cctpBurnHash, writeContract: writeCctpBurn, isPending: isCctpBurning } = useWriteContract();
  const { isLoading: isCctpBurnConfirming, isSuccess: isCctpBurnSuccess } = useWaitForTransactionReceipt({ hash: cctpBurnHash });

  const { data: cctpMintHash, writeContract: writeCctpMint, isPending: isCctpMinting } = useWriteContract();
  const { isLoading: isCctpMintConfirming, isSuccess: isCctpMintSuccess } = useWaitForTransactionReceipt({ hash: cctpMintHash });

  // Address lookup
  const depositTokenAddress = depositToken === 'USDC' ? USDC_ADDRESS : EURC_ADDRESS;
  const settlementTokenAddress = settlementToken === 'USDC' ? USDC_ADDRESS : EURC_ADDRESS;

  // Mock rate for display
  const exchangeRate = useMemo(() => {
    if (depositToken === settlementToken) return 1.0;
    if (depositToken === 'EURC' && settlementToken === 'USDC') return 1.08;
    if (depositToken === 'USDC' && settlementToken === 'EURC') return 0.92;
    return 1.0;
  }, [depositToken, settlementToken]);

  const targetAmount = useMemo(() => {
    if (!amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount);
  }, [amount]);

  const convertedPrincipal = useMemo(() => {
    if (depositToken === settlementToken) return targetAmount;
    if (swapAtDeposit) {
      return targetAmount * exchangeRate;
    } else {
      return targetAmount;
    }
  }, [targetAmount, depositToken, settlementToken, swapAtDeposit, exchangeRate]);

  const principalCurrency = useMemo(() => {
    if (depositToken === settlementToken) return depositToken;
    return swapAtDeposit ? settlementToken : depositToken;
  }, [depositToken, settlementToken, swapAtDeposit]);

  const yieldBps = selectedTerm.apyBps;
  const projectedYield = useMemo(() => {
    if (!convertedPrincipal) return '0.00';
    return (convertedPrincipal * (yieldBps / 10000) * (selectedTerm.durationDays / 365)).toFixed(2);
  }, [convertedPrincipal, yieldBps, selectedTerm]);

  const releaseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(duration || '0'));
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [duration]);

  const estimatedMaturityValue = useMemo(() => {
    return (targetAmount * exchangeRate).toFixed(2);
  }, [targetAmount, exchangeRate]);

  const isFormValid = amount && parseFloat(amount) > 0 && supplierAddress && duration;

  // Web3 Hooks — Approval
  const { data: approveHash, writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Web3 Hooks — Payment Execution
  const { data: bondHash, writeContract: writeBond, isPending: isBonding } = useWriteContract();
  const { isLoading: isBondConfirming, isSuccess: isBondSuccess } = useWaitForTransactionReceipt({ hash: bondHash });

  // Reset approval status if amount or deposit token changes
  const [lastApprovedKey, setLastApprovedKey] = useState('');
  const currentKey = `${depositToken}-${amount}`;
  const isApproved = isSmartAccount ? true : (isApproveSuccess && lastApprovedKey === currentKey);

  const displayBondHash = isSmartAccount ? smartTxHash : bondHash;
  const displayIsPending = isSmartAccount ? smartPending : isBonding;
  const displayIsConfirming = isSmartAccount ? smartConfirming : isBondConfirming;
  const displayIsSuccess = isSmartAccount ? smartSuccess : isBondSuccess;

  useEffect(() => {
    if (isApproveSuccess) {
      setLastApprovedKey(currentKey);
      toast.success("Balance verified", {
        description: `Your ${depositToken} allowance has been approved. You can now schedule the payment.`,
        action: approveHash ? {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${approveHash}`, '_blank')
        } : undefined
      });
    }
  }, [isApproveSuccess, approveHash, currentKey, depositToken]);

  useEffect(() => {
    if (isBondSuccess) {
      toast.success("Payment scheduled successfully", {
        description: "Your funds are now earning interest. The vendor will be paid automatically on the due date.",
        duration: 8000,
        action: bondHash ? {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${bondHash}`, '_blank')
        } : undefined
      });
    }
  }, [isBondSuccess, bondHash]);

  const currentStep = isSmartAccount ? 2 : (isApproved ? 2 : 1);

  // ----------------------------------------------------
  // CCTP Cross-Chain Deposit Handlers & Effects
  // ----------------------------------------------------
  
  // Reset bridge progress if inputs change while in step 0
  useEffect(() => {
    if (bridgeStep === 0) {
      setBridgeTxHash(null);
      setMessageHash(null);
      setMessageBytes(null);
      setAttestationBytes(null);
      setMintTxHash(null);
    }
  }, [amount, sourceNetwork, selectedTermId, supplierAddress, bridgeStep]);

  // Handle successful source token approval
  useEffect(() => {
    if (isCctpApproveSuccess && cctpApproveHash) {
      toast.success("Source allowance approved", {
        description: "USDC/EURC approval transaction confirmed. Initiating the CCTP burn next."
      });
      handleCctpBurn();
    }
  }, [isCctpApproveSuccess, cctpApproveHash]);

  // Handle successful CCTP Burn to parse receipt and poll Circle Iris API
  useEffect(() => {
    const getReceiptAndPoll = async () => {
      if (isCctpBurnSuccess && cctpBurnHash && publicClient) {
        try {
          setBridgeStep(2); // Step 2: Fetching Circle Attestation
          toast.info("Burn transaction confirmed! Extracting CCTP message log...");
          
          const receipt = await publicClient.getTransactionReceipt({ hash: cctpBurnHash });
          const MESSAGE_SENT_TOPIC = "0x8c526ddc0e2a3c5a77028120d91d603a1da759b8d2d665b1698e6c469f3c7e73";
          const log = receipt.logs.find(l => l.topics[0] === MESSAGE_SENT_TOPIC);
          if (!log) {
            throw new Error("MessageSent log not found in transaction receipt");
          }

          const decodedLog = decodeAbiParameters([{ type: 'bytes' }], log.data);
          const rawMessageBytes = decodedLog[0];
          const rawMessageHash = keccak256(rawMessageBytes);

          setMessageBytes(rawMessageBytes);
          setMessageHash(rawMessageHash);

          toast.info("CCTP message log extracted. Polling Circle Attestation API...");

          // Poll Circle Attestation
          let attestation = "";
          for (let i = 0; i < 60; i++) {
            try {
              const res = await fetch(`https://iris-api-sandbox.circle.com/attestations/${rawMessageHash}`);
              const data = await res.json();
              if (data.status === "complete" && data.attestation) {
                attestation = data.attestation;
                break;
              }
            } catch (e) {
              console.error(e);
            }
            await new Promise(r => setTimeout(r, 5000)); // Poll every 5 seconds
          }

          if (!attestation) {
            throw new Error("CCTP Attestation polling timed out.");
          }

          setAttestationBytes(attestation as `0x${string}`);
          setBridgeStep(3); // Step 3: Ready to Mint on Arc
          toast.success("Circle Attestation ready! Ready to complete deposit on Arc.");
        } catch (error: any) {
          console.error(error);
          setBridgeStep(0);
          toast.error("Bridge extraction failed", {
            description: error.message || "Failed to parse CCTP burn logs."
          });
        }
      }
    };
    
    getReceiptAndPoll();
  }, [isCctpBurnSuccess, cctpBurnHash, publicClient]);

  // Handle successful Mint on Arc for EOA
  useEffect(() => {
    if (isCctpMintSuccess && cctpMintHash) {
      setMintTxHash(cctpMintHash);
      setBridgeStep(0);
      toast.success("Cross-chain bond successfully created on Arc Testnet", {
        description: "Your funds have been minted and deposited into the bond vault.",
        action: {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${cctpMintHash}`, '_blank')
        }
      });
    }
  }, [isCctpMintSuccess, cctpMintHash]);

  const handleCctpApprove = async () => {
    try {
      const config = SOURCE_CONFIGS[sourceNetwork];
      const netConfig = SOURCE_NETWORKS.find(n => n.id === sourceNetwork);
      if (!config || !netConfig || !address || !publicClient) return;

      if (!chain || chain.id !== netConfig.chainId) {
        if (switchChain) {
          switchChain({ chainId: netConfig.chainId });
        } else {
          toast.info(`Please switch network to ${netConfig.name} in your wallet.`);
        }
        return;
      }

      setBridgeStep(1);
      const tokenAddress = depositToken === 'USDC' ? config.usdc : config.eurc;
      if (!tokenAddress) {
        toast.error(`Token ${depositToken} is not supported on ${netConfig.name}`);
        setBridgeStep(0);
        return;
      }

      toast.info(`Simulating allowance approval for CCTP on ${netConfig.name}...`);
      
      const { request } = await publicClient.simulateContract({
        account: address as `0x${string}`,
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [config.tokenMessenger, parseUnits(amount, 6)],
      });

      writeCctpApprove(request);
    } catch (error: any) {
      console.error(error);
      setBridgeStep(0);
      toast.error("Source approval failed", {
        description: error.shortMessage || error.message || "Could not approve USDC/EURC allowance."
      });
    }
  };

  const handleCctpBurn = async () => {
    try {
      const config = SOURCE_CONFIGS[sourceNetwork];
      const netConfig = SOURCE_NETWORKS.find(n => n.id === sourceNetwork);
      if (!config || !netConfig || !address || !publicClient) return;

      if (!chain || chain.id !== netConfig.chainId) {
        if (switchChain) {
          switchChain({ chainId: netConfig.chainId });
        }
        return;
      }

      const tokenAddress = depositToken === 'USDC' ? config.usdc : config.eurc;
      if (!tokenAddress) return;

      toast.info("Preparing cross-chain CCTP payload...");
      
      let minBuyAmount = BigInt(0);
      if (depositToken !== settlementToken && swapAtDeposit) {
        const expectedBuy = targetAmount * exchangeRate;
        minBuyAmount = (parseUnits(expectedBuy.toFixed(6), 6) * BigInt(995)) / BigInt(1000);
      }

      const payload = encodeAbiParameters(
        [
          { type: 'address', name: 'owner' },
          { type: 'uint256', name: 'amount' },
          { type: 'uint256', name: 'termId' },
          { type: 'address', name: 'supplier' },
          { type: 'uint32', name: 'destDomain' },
          { type: 'address', name: 'depositToken' },
          { type: 'address', name: 'settlementToken' },
          { type: 'bool', name: 'swapAtDeposit' },
          { type: 'uint256', name: 'minBuyAmount' },
          { type: 'bytes', name: 'tradeData' }
        ],
        [
          address as `0x${string}`,
          parseUnits(amount, 6),
          BigInt(selectedTermId),
          supplierAddress as `0x${string}`,
          parseInt(destChain),
          depositTokenAddress,
          settlementTokenAddress,
          swapAtDeposit,
          minBuyAmount,
          "0x"
        ]
      );

      const mintRecipient = pad(VAULT_ADDRESS, { size: 32 });

      const { request } = await publicClient.simulateContract({
        account: address as `0x${string}`,
        address: config.tokenMessenger,
        abi: parseAbi([
          "function depositForBurnWithPayload(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken, bytes calldata payload) external returns (uint64 _nonce)"
        ]),
        functionName: 'depositForBurnWithPayload',
        args: [
          parseUnits(amount, 6),
          26, // Arc Testnet Domain
          mintRecipient,
          tokenAddress,
          payload
        ]
      });

      writeCctpBurn(request);
    } catch (error: any) {
      console.error(error);
      toast.error("Cross-chain deposit initiation failed", {
        description: error.shortMessage || error.message || "Failed to build deposit operation."
      });
    }
  };

  const handleMintOnArc = async () => {
    try {
      if (!messageBytes || !attestationBytes || !publicClient) return;

      const ARC_TOKEN_MESSENGER = "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA";
      
      const transmitterAddress = await publicClient.readContract({
        address: ARC_TOKEN_MESSENGER,
        abi: parseAbi(["function localMessageTransmitter() external view returns (address)"]),
        functionName: "localMessageTransmitter"
      });

      const messageTransmitterAbi = parseAbi([
        "function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool)"
      ]);

      if (isSmartAccount && circleAccount) {
        toast.info("Submitting gasless mint operation via Circle modular account...");
        
        const receiveCall = {
          to: transmitterAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: messageTransmitterAbi,
            functionName: 'receiveMessage',
            args: [messageBytes as `0x${string}`, attestationBytes as `0x${string}`],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [receiveCall],
          paymaster: true,
        });

        toast.info("User operation submitted to Arc bundler...");
        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        
        setMintTxHash(receipt.transactionHash);
        setBridgeStep(0);
        toast.success("Cross-chain bond successfully created on Arc Testnet");
      } else {
        // EOA wallet flow
        if (chain && chain.id !== 5042002) {
          if (switchChain) {
            switchChain({ chainId: 5042002 });
          } else {
            toast.info("Please switch network to Arc Testnet to complete mint.");
          }
          return;
        }

        const { request } = await publicClient.simulateContract({
          account: address as `0x${string}`,
          address: transmitterAddress as `0x${string}`,
          abi: messageTransmitterAbi,
          functionName: 'receiveMessage',
          args: [messageBytes as `0x${string}`, attestationBytes as `0x${string}`],
        });

        writeCctpMint(request);
      }
    } catch (error: any) {
      console.error(error);
      toast.error("Minting on Arc failed", {
        description: error.shortMessage || error.message || "Failed to execute receiveMessage."
      });
    }
  };

  const handleApprove = async () => {
    try {
      if (!publicClient || !address) return;
      
      const { request } = await publicClient.simulateContract({
        account: address,
        address: depositTokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [VAULT_ADDRESS, parseUnits(amount, 6)],
      });
      
      writeApprove(request);
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('User rejected') || error.code === 4001 || error.shortMessage?.includes('User rejected')) {
        toast.info("Verification cancelled", {
          description: "You declined the request in your wallet. Please try again when you're ready.",
        });
        return;
      }
      toast.error("Unable to verify balance", {
        description: error.shortMessage || "Please make sure your account has enough funds for this payment amount.",
      });
    }
  };

  const handleExecute = async () => {
    let minBuyAmount = BigInt(0);
    if (depositToken !== settlementToken && swapAtDeposit) {
      const expectedBuy = targetAmount * exchangeRate;
      // 0.5% slippage tolerance
      minBuyAmount = (parseUnits(expectedBuy.toFixed(6), 6) * BigInt(995)) / BigInt(1000);
    }

    if (sourceNetwork === 'unified-balance') {
      if (isSmartAccount && circleAccount) {
        setSmartPending(true);
        setSmartSuccess(false);
        try {
          toast.info("Preparing Gateway payment via Circle Smart Account...");

          const executeCall = {
            to: VAULT_ADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: VAULT_ABI,
              functionName: 'receiveGatewayPayment',
              args: [
                address as `0x${string}`,
                parseUnits(amount, 6),
                BigInt(selectedTermId),
                supplierAddress as `0x${string}`,
                parseInt(destChain),
                depositTokenAddress as `0x${string}`,
                settlementTokenAddress as `0x${string}`,
                swapAtDeposit
              ],
            }),
          };

          const userOpHash = await bundlerClient.sendUserOperation({
            account: circleAccount,
            calls: [executeCall],
            paymaster: true,
          });

          setSmartPending(false);
          setSmartConfirming(true);

          const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });

          setSmartTxHash(receipt.transactionHash);
          setSmartConfirming(false);
          setSmartSuccess(true);

          toast.success("Circle Gateway payment settled & bond created", {
            description: `Paid $${parseFloat(amount).toLocaleString()} USDC from Unified Balance.`,
            duration: 8000,
            action: {
              label: 'View receipt',
              onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
            }
          });
        } catch (error: any) {
          console.error("Circle Smart Account Gateway Error:", error);
          setSmartPending(false);
          setSmartConfirming(false);
          toast.error("Gateway payment failed", {
            description: error.message || "Failed to settle payment from Unified Balance."
          });
        }
      } else {
        try {
          if (!publicClient || !address) return;
          
          toast.info("Preparing Gateway payment transaction...");

          const { request } = await publicClient.simulateContract({
            account: address,
            address: VAULT_ADDRESS,
            abi: VAULT_ABI,
            functionName: 'receiveGatewayPayment',
            args: [
              address as `0x${string}`,
              parseUnits(amount, 6),
              BigInt(selectedTermId),
              supplierAddress as `0x${string}`,
              parseInt(destChain),
              depositTokenAddress as `0x${string}`,
              settlementTokenAddress as `0x${string}`,
              swapAtDeposit
            ],
          });

          writeBond(request);
        } catch (error: any) {
          console.error(error);
          toast.error("Gateway payment failed", {
            description: error.shortMessage || error.message || "Failed to settle payment from Unified Balance."
          });
        }
      }
      return;
    }

    if (isSmartAccount && circleAccount) {
      setSmartPending(true);
      setSmartSuccess(false);
      try {
        toast.info("Preparing gasless payment user operation...");
        
        const approveCall = {
          to: depositTokenAddress as `0x${string}`,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [VAULT_ADDRESS, parseUnits(amount, 6)],
          }),
        };

        const executeCall = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'createBondWithIntent',
            args: [
              parseUnits(amount, 6), 
              BigInt(selectedTermId), 
              supplierAddress as `0x${string}`, 
              parseInt(destChain),
            ],
          }),
        };

        const calls = [approveCall, executeCall];

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls,
          paymaster: true,
        });

        toast.info("Transaction sent to bundler. Awaiting on-chain execution...", {
          description: `UserOp Hash: ${userOpHash.slice(0, 10)}...`,
        });

        setSmartPending(false);
        setSmartConfirming(true);

        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        
        setSmartTxHash(receipt.transactionHash);
        setSmartConfirming(false);
        setSmartSuccess(true);

        toast.success("Payment scheduled successfully", {
          description: "Your funds are now earning interest. The vendor will be paid automatically on the due date.",
          duration: 8000,
          action: {
            label: 'View receipt',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
          }
        });
      } catch (error: any) {
        console.error("[browser] Smart Account Tx Error:", error);
        setSmartPending(false);
        setSmartConfirming(false);
        if (error.message?.includes('User rejected') || error.code === 'NotAllowedError' || error.name === 'NotAllowedError') {
          toast.info("Payment cancelled", {
            description: "You cancelled the passkey authentication signature.",
          });
          return;
        }
        // Detect stale wallet (created under a different Circle project/client key)
        const errMsg = error.message || error.details || '';
        if (errMsg.includes('Cannot find target wallet') || errMsg.includes('not accessible to the caller')) {
          logout();
          toast.error("Wallet session expired", {
            description: "Your wallet was created under a different project key. Please register a new passkey to continue.",
            duration: 10000,
          });
          return;
        }
        toast.error("Payment couldn't be scheduled", {
          description: error.message || "Something went wrong. Please check your details and try again.",
        });
      }
    } else {
      try {
        if (!publicClient || !address) return;

        const { request } = await publicClient.simulateContract({
          account: address,
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'createBondWithIntent',
          args: [
            parseUnits(amount, 6), 
            BigInt(selectedTermId), 
            supplierAddress as `0x${string}`, 
            parseInt(destChain),
          ],
        });
        
        writeBond(request);
      } catch (error: any) {
        console.error(error);
        if (error.message?.includes('User rejected') || error.code === 4001 || error.shortMessage?.includes('User rejected')) {
          toast.info("Payment cancelled", {
            description: "You declined the transaction in your wallet. No funds were moved.",
          });
          return;
        }
        toast.error("Payment couldn't be scheduled", {
          description: error.shortMessage || "Something went wrong. Please check your details and try again.",
        });
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-2xl mx-auto card-surface p-8 md:p-12 text-center">
        <div className="w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-5"
          style={{ background: 'var(--primary-soft)' }}>
          <Wallet size={24} style={{ color: 'var(--primary)' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
          Connect your account to get started
        </h3>
        <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--muted-foreground)' }}>
          Click "Connect Account" in the top-right corner to link your payment account and start scheduling payments.
        </p>
        <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span className="flex items-center gap-1"><Shield size={12} style={{ color: 'var(--success)' }} /> Secure connection</span>
          <span className="flex items-center gap-1"><Clock size={12} /> Takes 10 seconds</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Payment Form Card */}
      <div className="card-surface overflow-hidden">
        <div className="p-6 md:p-8">
          
          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Contextual Helper — "How it works" */}
          <div className="banner-info flex gap-3 text-sm mb-8">
            <div className="mt-0.5 shrink-0" style={{ color: 'var(--info)' }}>
              <Info size={18} />
            </div>
            <div style={{ color: 'var(--info-foreground)' }}>
              <strong className="font-semibold block mb-1">Here's what happens:</strong>
              <span className="leading-relaxed">
                Your money will be held securely and earn up to <strong>{selectedTerm.apyLabel}</strong>. On the date you choose, 
                the full amount is automatically sent to your vendor. No reminders, no manual transfers — it just works.
              </span>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Funding Network Selector */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Funding network
                <Tooltip text="Select the blockchain network where your treasury funds currently reside." />
              </label>
              <CustomDropdown
                value={sourceNetwork}
                onChange={(val) => {
                  setSourceNetwork(val as any);
                  setBridgeStep(0); // Reset stepper on network change
                }}
                options={SOURCE_NETWORKS_OPTIONS}
              />
            </div>

            {/* Bridge Fee Preview (Only if non-Arc is selected) */}
            {sourceNetwork !== 'arc' && sourceNetwork !== 'unified-balance' && (
              <div className="p-4 rounded-xl text-xs space-y-2 border animate-fade-in"
                style={{ background: 'var(--card-muted)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between font-semibold">
                  <span style={{ color: 'var(--muted-foreground)' }}>Estimated Bridge Gas Fee</span>
                  <span style={{ color: 'var(--foreground)' }}>~0.0015 ETH (~$4.50)</span>
                </div>
                <p className="leading-normal" style={{ color: 'var(--muted-foreground)' }}>
                  This estimate covers the gas required on the source network to approve and burn your tokens via CCTP. 
                  Destination gas on Arc Testnet is <strong>100% sponsored (Free)</strong> when using a Circle Smart Account.
                </p>
              </div>
            )}

            {/* Unified Balance Circle Gateway Preview */}
            {sourceNetwork === 'unified-balance' && (
              <div className="p-4 rounded-xl text-xs space-y-2 border animate-fade-in"
                style={{ background: 'var(--success-soft)', borderColor: 'var(--success-border)', color: 'var(--success-foreground)' }}>
                <div className="flex justify-between font-semibold">
                  <span className="flex items-center gap-1">Circle Gateway Active</span>
                  <span>Fee: $0.00 (Gasless)</span>
                </div>
                <p className="leading-normal opacity-90">
                  Payments are consolidated dynamically from your Unified Balance and settled directly into the vault. No manual bridging required.
                </p>
              </div>
            )}

            {/* CCTP Cross-Chain Progress Stepper */}
            {bridgeStep > 0 && (
              <div className="p-5 rounded-xl border animate-fade-in"
                style={{ background: 'var(--card-muted)', borderColor: 'var(--border)' }}>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--muted-foreground)' }}>
                  Cross-Chain Routing Progress
                </h4>
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      bridgeStep > 1 
                        ? 'bg-[var(--success)] text-white' 
                        : bridgeStep === 1 
                          ? 'bg-[var(--primary)] text-white animate-pulse' 
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}>
                      {bridgeStep > 1 ? '✓' : '1'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
                        Step 1: Burn on Source Chain
                      </span>
                      <span className="text-[11px] leading-normal block" style={{ color: 'var(--muted-foreground)' }}>
                        {isCctpApproving || isCctpApproveConfirming ? (
                          <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Approving token allowance...</span>
                        ) : isCctpBurning || isCctpBurnConfirming ? (
                          <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Burning tokens on {SOURCE_NETWORKS.find(n=>n.id===sourceNetwork)?.name}...</span>
                        ) : bridgeStep > 1 ? (
                          <span className="text-[var(--success-foreground)]">Tokens burned successfully. Tx: <span className="font-mono">{bridgeTxHash?.slice(0, 12)}...</span></span>
                        ) : (
                          "Awaiting token approval and burn execution."
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      bridgeStep > 2 
                        ? 'bg-[var(--success)] text-white' 
                        : bridgeStep === 2 
                          ? 'bg-[var(--primary)] text-white animate-pulse' 
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}>
                      {bridgeStep > 2 ? '✓' : '2'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
                        Step 2: Fetch Circle CCTP Attestation
                      </span>
                      <span className="text-[11px] leading-normal block" style={{ color: 'var(--muted-foreground)' }}>
                        {bridgeStep === 2 ? (
                          <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Polling Circle Iris API for signed attestation... (takes ~1-2 min)</span>
                        ) : bridgeStep > 2 ? (
                          <span className="text-[var(--success-foreground)]">Circle Attestation retrieved successfully.</span>
                        ) : (
                          "Awaiting source burn confirmation."
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCctpMinting || isCctpMintConfirming || mintTxHash
                        ? 'bg-[var(--success)] text-white' 
                        : bridgeStep === 3 
                          ? 'bg-[var(--primary)] text-white animate-pulse' 
                          : 'bg-[var(--muted)] text-[var(--muted-foreground)]'
                    }`}>
                      {mintTxHash ? '✓' : '3'}
                    </div>
                    <div>
                      <span className="text-xs font-semibold block" style={{ color: 'var(--foreground)' }}>
                        Step 3: Mint on Arc & Instantiate Bond
                      </span>
                      <span className="text-[11px] leading-normal block" style={{ color: 'var(--muted-foreground)' }}>
                        {isCctpMinting || isCctpMintConfirming ? (
                          <span className="flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> Executing receiveMessage on Arc...</span>
                        ) : mintTxHash ? (
                          <span className="text-[var(--success-foreground)]">Bond created on Arc. Tx: <span className="font-mono">{mintTxHash.slice(0,12)}...</span></span>
                        ) : bridgeStep === 3 ? (
                          "Attestation acquired! Ready to execute settlement mint on Arc Testnet."
                        ) : (
                          "Awaiting Circle Iris API attestation."
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Currency Pairs Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Deposit currency
                  <Tooltip text="Select the currency you want to deposit from your treasury." />
                </label>
                <CustomDropdown
                  value={depositToken}
                  onChange={(val) => setDepositToken(val)}
                  options={CURRENCY_OPTIONS}
                />
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Vendor receives
                  <Tooltip text="Select the currency your vendor wants to receive." />
                </label>
                <CustomDropdown
                  value={settlementToken}
                  onChange={(val) => setSettlementToken(val)}
                  options={CURRENCY_OPTIONS}
                />
              </div>
            </div>

            {/* Swap Timing (Only if tokens are different) */}
            {depositToken !== settlementToken && (
              <div className="animate-fade-in">
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Currency Conversion Timing (StableFX)
                  <Tooltip text="Choose when to perform the exchange swap. 'Swap immediately' locks in the conversion rate today. 'Swap at maturity' performs the swap when the payment is delivered." />
                </label>
                <CustomDropdown
                  value={swapAtDeposit ? "immediate" : "maturity"}
                  onChange={(val) => setSwapAtDeposit(val === "immediate")}
                  options={SWAP_TIMING_OPTIONS}
                />
              </div>
            )}

            {/* Exchange Rate Preview Card */}
            {depositToken !== settlementToken && (
              <div className="p-4 rounded-xl text-xs space-y-2 border animate-fade-in"
                style={{ background: 'var(--card-muted)', borderColor: 'var(--border)' }}>
                <div className="flex justify-between font-semibold">
                  <span style={{ color: 'var(--muted-foreground)' }}>Exchange Rate Preview</span>
                  <span style={{ color: 'var(--foreground)' }}>1 {depositToken} ≈ {exchangeRate} {settlementToken}</span>
                </div>
                <p className="leading-normal" style={{ color: 'var(--muted-foreground)' }}>
                  {swapAtDeposit ? (
                    <span><strong>Swap Immediately:</strong> Your {depositToken} will be converted to {settlementToken} upon deposit. The yield will be earned in {settlementToken}.</span>
                  ) : (
                    <span><strong>Swap at Maturity:</strong> Your principal is locked in {depositToken} and earns yield in {depositToken}. The swap into {settlementToken} occurs at delivery.</span>
                  )}
                </p>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                <DollarSign size={14} style={{ color: 'var(--primary)' }} />
                How much do you want to pay?
                <Tooltip text="Enter the amount you want to send. This amount will earn interest until the due date." />
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-medium" style={{ color: 'var(--muted-foreground)' }}>$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10,000.00"
                  className="input-field pl-8 pr-16 text-base font-medium"
                  id="payment-amount"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
                  {depositToken}
                </span>
              </div>

              {/* Interest Preview — Dynamic */}
              {amount && parseFloat(amount) > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs animate-fade-in"
                  style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--success-foreground)' }}>
                    You'll earn approximately <strong className="font-bold">{projectedYield} {principalCurrency}</strong> in interest before the due date
                  </span>
                </div>
              )}
            </div>

            {/* Tranche / Risk Profile Selector */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Tranche / Risk Profile
                <Tooltip text="Senior offers protected yield backed by Junior waterfall capital. Junior offers high yield but absorbs first defaults." />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const currentTerm = TERMS_OPTIONS.find(t => t.id === selectedTermId) || TERMS_OPTIONS[0];
                    const nextId = TERMS_OPTIONS.find(t => t.tranche === 0 && t.durationDays === currentTerm.durationDays)?.id || 1;
                    setSelectedTermId(nextId);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    selectedTerm.tranche === 0
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm'
                      : 'border-[var(--border)] bg-transparent hover:bg-[var(--card-hover)]'
                  }`}
                  style={selectedTerm.tranche === 0 ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : {}}
                >
                  <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Senior Tranche</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    Protected by Junior waterfall buffer. Low risk.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const currentTerm = TERMS_OPTIONS.find(t => t.id === selectedTermId) || TERMS_OPTIONS[0];
                    const nextId = TERMS_OPTIONS.find(t => t.tranche === 1 && t.durationDays === currentTerm.durationDays)?.id || 6;
                    setSelectedTermId(nextId);
                  }}
                  className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                    selectedTerm.tranche === 1
                      ? 'border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm'
                      : 'border-[var(--border)] bg-transparent hover:bg-[var(--card-hover)]'
                  }`}
                  style={selectedTerm.tranche === 1 ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : {}}
                >
                  <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Junior Tranche</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
                    First-loss absorbing capital. High yield.
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Lockup Term & APY Selection */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} />
                  Lockup Duration
                  <Tooltip text="Select the lockup duration. Longer durations offer higher APYs. Funds will be held securely and paid to your vendor at maturity." />
                </label>
                <CustomDropdown
                  value={selectedTermId.toString()}
                  onChange={(val) => setSelectedTermId(parseInt(val))}
                  options={TERMS_OPTIONS.filter((opt) => opt.tranche === selectedTerm.tranche).map((opt) => ({
                    value: opt.id.toString(),
                    label: opt.label,
                    sublabel: opt.apyLabel,
                    icon: <Calendar size={14} className="text-[var(--primary)] shrink-0" />
                  }))}
                />
                {duration && parseInt(duration) > 0 && (
                  <p className="text-[11px] mt-1.5 font-medium flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
                    <Clock size={10} />
                    Payment arrives: {releaseDate}
                  </p>
                )}
              </div>

              {/* Transfer Method - replaces "Vendor's Network" */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  <Building2 size={14} style={{ color: 'var(--primary)' }} />
                  Transfer method
                  <Tooltip text="Choose how the payment reaches your vendor. Each option has different speed and cost tradeoffs. Most users choose 'Express Transfer'." />
                </label>
                <CustomDropdown
                  value={destChain}
                  onChange={(val) => setDestChain(val)}
                  options={NETWORK_OPTIONS_DROPDOWN}
                />
              </div>
            </div>

            {/* Vendor Account */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                <Wallet size={14} style={{ color: 'var(--primary)' }} />
                Vendor's payment address
                <Tooltip text="This is your vendor's unique payment address. They should provide this to you — it looks like '0x' followed by numbers and letters. Think of it like a bank account number." />
              </label>
              <input 
                type="text" 
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                placeholder="Enter vendor's address (starts with 0x...)"
                className="input-field font-mono text-sm"
                id="vendor-address"
              />
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
                <Info size={12} className="inline-block shrink-0 mr-1 align-text-bottom" /> Ask your vendor for their payment address. It's like a bank account number for receiving funds.
              </p>
            </div>
          </div>
          
          {/* Payment Preview — Progressive Disclosure */}
          {isFormValid && (
            <div className="mt-8 animate-slide-up">
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="w-full text-left p-4 rounded-xl transition-all duration-200 flex items-center justify-between group"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                id="preview-toggle"
              >
                <span className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--primary)' }}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  Preview payment summary
                </span>
                <ArrowRight size={14} className={`transition-transform duration-200 ${showPreview ? 'rotate-90' : ''}`} style={{ color: 'var(--muted-foreground)' }} />
              </button>

              {showPreview && (
                <div className="mt-3 p-5 rounded-xl text-sm space-y-3 animate-fade-in"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--muted-foreground)' }}>
                    Payment Summary
                  </h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Payment amount</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{parseFloat(amount).toLocaleString()} {depositToken}</span>
                    </div>
                    {depositToken !== settlementToken && (
                      <div className="flex justify-between text-xs" style={{ borderBottom: '1px dashed var(--border)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--muted-foreground)' }}>StableFX Rate</span>
                        <span className="font-medium" style={{ color: 'var(--foreground)' }}>1 {depositToken} ≈ {exchangeRate} {settlementToken}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Interest you'll earn</span>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>+{projectedYield} {principalCurrency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Delivery date</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{releaseDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Vendor receives</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{parseFloat(estimatedMaturityValue).toLocaleString()} {settlementToken}</span>
                    </div>
                    <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex justify-between">
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Your net benefit</span>
                        <span className="font-bold" style={{ color: 'var(--success)' }}>+{projectedYield} {principalCurrency} earned</span>
                      </div>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>What happens next?</p>
                    <div className="space-y-2">
                      {[
                        "Your funds will be securely held in a protected account",
                        `You'll earn ~${projectedYield} ${principalCurrency} in interest over ${duration} days`,
                        `On ${releaseDate}, the vendor automatically receives ${parseFloat(estimatedMaturityValue || '0').toLocaleString()} ${settlementToken}`,
                        "You keep all the interest earned — it's deposited to your account",
                      ].map((step, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                           <CheckCircle2 size={12} className="mt-0.5 shrink-0" style={{ color: 'var(--success)' }} />
                           <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success State — Human-readable receipt */}
          {displayBondHash && (
            <div className="mt-8 banner-success flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success-foreground)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>
                  <strong>Payment confirmed!</strong> 
                  <span className="ml-1 opacity-70">Receipt: {displayBondHash.slice(0,8)}…{displayBondHash.slice(-6)}</span>
                </span>
              </div>
              <a 
                href={`https://testnet.arcscan.app/tx/${displayBondHash}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-semibold hover:underline shrink-0"
                style={{ color: 'var(--success-foreground)' }}
              >
                View details <ExternalLink size={12} />
              </a>
            </div>
          )}
          {/* Compliance warnings */}
          {!checkingCompliance && (!isVerified || isBlacklisted) && (
            <div className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 ${
              isBlacklisted 
                ? 'bg-red-500/10 text-red-200 border border-red-500/30 animate-slide-up' 
                : 'bg-amber-500/10 text-amber-200 border border-amber-500/30 animate-slide-up'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${isBlacklisted ? 'text-red-500' : 'text-amber-500'}`}>
                  {isBlacklisted ? <AlertOctagon size={16} /> : <Shield size={16} />}
                </div>
                <div className="text-xs text-left">
                  <span className="font-bold block mb-0.5" style={{ color: isBlacklisted ? '#f87171' : '#fbbf24' }}>
                    {isBlacklisted 
                      ? 'Compliance Block Active' 
                      : 'KYC/KYB Verification Required'}
                  </span>
                  <span className="opacity-90">
                    {isBlacklisted 
                      ? 'Your wallet is currently blacklisted/sanctioned. All transaction operations are blocked.' 
                      : 'You must verify your corporate treasury profile in the Compliance Center before scheduling payments.'}
                  </span>
                </div>
              </div>
              {!isBlacklisted && onNavigateToCompliance && (
                <button
                  type="button"
                  onClick={onNavigateToCompliance}
                  className="btn-primary text-xs shrink-0 self-start md:self-center px-4 py-2 gap-1.5 shadow-md bg-amber-600 hover:bg-amber-500 border-amber-500 text-white transition-all cursor-pointer flex items-center font-semibold"
                >
                  Verify Now <ArrowRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}>
          <div className="flex flex-col">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {sourceNetwork !== 'arc' ? (
                bridgeStep === 0 
                  ? "Cross-Chain Deposit Setup"
                  : bridgeStep === 1 
                    ? "Bridge Transfer in Progress"
                    : bridgeStep === 2 
                      ? "Retrieving Circle Attestation"
                      : "Ready to Mint on Arc"
              ) : isSmartAccount ? (
                "Gasless Smart Account Active" 
              ) : (
                isApproved ? "Funds verified — ready to schedule!" : "Two quick steps to schedule"
              )}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {sourceNetwork !== 'arc' ? (
                bridgeStep === 0 
                  ? "Initiate a secure transfer using Circle CCTP to bridge your USDC/EURC to Arc Testnet."
                  : bridgeStep === 1 
                    ? "Token Messenger is burning tokens. Please check your browser wallet notifications."
                    : bridgeStep === 2 
                      ? "Polling Circle CCTP attestation service. This will complete automatically."
                      : "Attestation retrieved. Click to execute the mint and lock your bond on Arc Testnet."
              ) : isSmartAccount ? (
                "Your transaction fees are fully sponsored. Approve and purchase are batched together." 
              ) : (
                isApproved 
                  ? `Click 'Schedule Payment' to lock in your interest and set the delivery date in ${settlementToken}.` 
                  : `First verify your ${depositToken} allowance, then confirm the schedule.`
              )}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto animate-fade-in">
            {sourceNetwork !== 'arc' ? (
              bridgeStep === 0 ? (
                <button
                  onClick={handleCctpApprove}
                  disabled={!isConnected || !isFormValid || !isVerified || isBlacklisted}
                  className="w-full sm:w-auto btn-primary px-6 py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  Initiate Cross-Chain Deposit <ArrowRight size={14} />
                </button>
              ) : bridgeStep === 1 ? (
                <button
                  disabled
                  className="w-full sm:w-auto btn-primary px-6 py-2.5 gap-2 opacity-50 cursor-not-allowed flex items-center justify-center"
                >
                  <Loader2 size={14} className="animate-spin" /> Burning on Source Network...
                </button>
              ) : bridgeStep === 2 ? (
                <button
                  disabled
                  className="w-full sm:w-auto btn-primary px-6 py-2.5 gap-2 opacity-50 cursor-not-allowed flex items-center justify-center"
                >
                  <Loader2 size={14} className="animate-spin" /> Fetching CCTP Proof...
                </button>
              ) : (
                <button
                  onClick={handleMintOnArc}
                  disabled={isCctpMinting || isCctpMintConfirming || !isVerified || isBlacklisted}
                  className="w-full sm:w-auto btn-primary px-6 py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCctpMinting || isCctpMintConfirming ? (
                    <><Loader2 size={14} className="animate-spin" /> Minting on Arc...</>
                  ) : isSmartAccount ? (
                    <>Complete Gasless Deposit on Arc <ArrowRight size={14} /></>
                  ) : (
                    <>Complete Deposit on Arc <ArrowRight size={14} /></>
                  )}
                </button>
              )
            ) : (
              <>
                {!isSmartAccount && (
                  /* Step 1 Button */
                  <button 
                    onClick={handleApprove}
                    disabled={isApproving || isApproveConfirming || isApproved || !isConnected || !isFormValid || !isVerified || isBlacklisted}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                      isApproved 
                        ? 'border text-[var(--success-foreground)]' 
                        : 'btn-secondary'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    style={isApproved ? { 
                      background: 'var(--success-soft)', 
                      borderColor: 'var(--success-border)', 
                      color: 'var(--success-foreground)' 
                    } : {}}
                    id="btn-verify"
                  >
                    {isApproveConfirming ? (
                      <><Loader2 size={14} className="animate-spin" /> Checking...</>
                    ) : isApproved ? (
                      <><CheckCircle2 size={14} /> Balance verified</>
                    ) : (
                      <>Step 1: Check balance</>
                    )}
                  </button>
                )}

                {/* Step 2 Button */}
                <button 
                  onClick={handleExecute}
                  disabled={(!isSmartAccount && !isApproved) || displayIsPending || displayIsConfirming || !isConnected || !isFormValid || !isVerified || isBlacklisted}
                  className="w-full sm:w-auto btn-primary px-6 py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  id="btn-schedule"
                >
                  {displayIsPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Initiating...</>
                  ) : displayIsConfirming ? (
                    <><Loader2 size={14} className="animate-spin" /> Confirming...</>
                  ) : isSmartAccount ? (
                    <>Schedule Gasless Payment <ArrowRight size={14} /></>
                  ) : (
                    <>Step 2: Schedule Payment <ArrowRight size={14} /></>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
