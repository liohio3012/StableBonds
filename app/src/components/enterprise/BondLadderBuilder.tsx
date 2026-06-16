"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseAbi, parseUnits, encodeFunctionData, isAddress } from 'viem';
import { toast } from 'sonner';
import { Layers, Info, TrendingUp, Loader2, ArrowRight, Shield, Wallet, CheckCircle2, HelpCircle, AlertTriangle, AlertOctagon, Calendar, ChevronRight, ArrowUpRight } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';
import CustomDropdown from './CustomDropdown';

// Sleek Custom SVG Icons
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

const StandardIcon = (
  <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M3 10h18M5 6h14M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
  </svg>
);

const ExpressIcon = (
  <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const EconomyIcon = (
  <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 6v12" />
  </svg>
);

const InternationalIcon = (
  <svg className="w-4 h-4 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
  </svg>
);

const CURRENCY_OPTIONS = [
  { value: 'USDC', label: 'USDC', sublabel: 'US Dollar stablecoin', icon: UsdcIcon },
  { value: 'EURC', label: 'EURC', sublabel: 'Euro stablecoin', icon: EurcIcon }
];

const TRANSFER_OPTIONS = [
  { value: "0", label: "Standard Transfer", sublabel: "Most common option", icon: StandardIcon },
  { value: "3", label: "Express Transfer", sublabel: "Faster settlement", icon: ExpressIcon },
  { value: "6", label: "Economy Transfer", sublabel: "Lower fees", icon: EconomyIcon },
  { value: "22", label: "International Transfer", sublabel: "Cross-border payments", icon: InternationalIcon },
];

// Arc Testnet Constants
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const VAULT_ADDRESS = "0x4610ba85Ff3b7993d9f5b2CB5DE4cf194a451942" as `0x${string}`;

const ERC20_ABI = parseAbi(["function approve(address spender, uint256 amount) external returns (bool)"]);
const VAULT_ABI = parseAbi([
  "function createBondWithIntent(uint256 _amount, uint256 _termId, address _supplier, uint32 _destDomain) external"
]);

const VAULT_ABI_COMPLIANCE = parseAbi([
  "function complianceRegistry() external view returns (address)"
]);

const REGISTRY_ABI = parseAbi([
  "function isVerified(address _user) external view returns (bool)",
  "function isBlacklisted(address _user) external view returns (bool)"
]);

const TERMS_MAP = [
  { id: 1, durationDays: 30, apyBps: 400, label: "30 Days", apyLabel: "4.00% APY" },
  { id: 3, durationDays: 90, apyBps: 500, label: "90 Days", apyLabel: "5.00% APY" },
  { id: 4, durationDays: 180, apyBps: 550, label: "180 Days", apyLabel: "5.50% APY" },
  { id: 5, durationDays: 365, apyBps: 600, label: "365 Days", apyLabel: "6.00% APY" },
];

const STRATEGIES = [
  {
    id: 'equal',
    name: 'Equal Weight',
    desc: 'Splits capital evenly (25% each) across 30, 90, 180, and 365 days. Best for consistent quarterly liquidity.',
    allocations: [0.25, 0.25, 0.25, 0.25]
  },
  {
    id: 'short',
    name: 'Short-Term Heavy',
    desc: 'Allocates 50% in 30d, 25% in 90d, 15% in 180d, and 10% in 365d. Maximize short-term invoice matching.',
    allocations: [0.50, 0.25, 0.15, 0.10]
  },
  {
    id: 'long',
    name: 'Long-Term Heavy',
    desc: 'Allocates 10% in 30d, 15% in 90d, 25% in 180d, and 50% in 365d. Maximize yield and long-term locked-in growth.',
    allocations: [0.10, 0.15, 0.25, 0.50]
  }
];

const NETWORK_OPTIONS = [
  { value: "0", label: "Standard Transfer", icon: "" },
  { value: "3", label: "Express Transfer", icon: "" },
  { value: "6", label: "Economy Transfer", icon: "" },
  { value: "22", label: "International Transfer", icon: "" },
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
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium leading-snug w-56 z-50 shadow-lg animate-fade-in text-left"
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

export default function BondLadderBuilder({ onNavigateToCompliance, onNavigateToTab }: { onNavigateToCompliance?: () => void; onNavigateToTab?: (tab: string) => void }) {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const publicClient = usePublicClient();

  // Compliance verification states
  const [isVerified, setIsVerified] = useState<boolean>(true); // Default to true while checking
  const [isBlacklisted, setIsBlacklisted] = useState<boolean>(false);
  const [checkingCompliance, setCheckingCompliance] = useState<boolean>(true);

  React.useEffect(() => {
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
        console.error("Compliance query error in BondLadderBuilder:", err);
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

  // Form State
  const [totalBudget, setTotalBudget] = useState('10000');
  const [depositToken, setDepositToken] = useState('USDC');
  const [settlementToken, setSettlementToken] = useState('USDC');
  const [selectedStrategy, setSelectedStrategy] = useState('equal');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [destChain, setDestChain] = useState('3');
  const [swapAtDeposit, setSwapAtDeposit] = useState(true);

  // Smart Account Execution States
  const [smartPending, setSmartPending] = useState(false);
  const [smartConfirming, setSmartConfirming] = useState(false);
  const [smartTxHash, setSmartTxHash] = useState<string | null>(null);
  const [showSuccessWorkflowModal, setShowSuccessWorkflowModal] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (smartTxHash) {
      setShowSuccessWorkflowModal(true);
    }
  }, [smartTxHash]);

  // EOA Execution States
  const { data: approveHash, writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const { data: depositHash, writeContract: writeDeposit, isPending: isDepositing } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  // Address lookup
  const depositTokenAddress = depositToken === 'USDC' ? USDC_ADDRESS : EURC_ADDRESS;

  // Verify inputs
  const budgetNum = parseFloat(totalBudget);
  const isFormValid = useMemo(() => {
    return (
      !isNaN(budgetNum) &&
      budgetNum > 0 &&
      supplierAddress !== '' &&
      isAddress(supplierAddress) &&
      isConnected
    );
  }, [budgetNum, supplierAddress, isConnected]);

  // Calculate allocations and interest
  const strategy = useMemo(() => {
    return STRATEGIES.find(s => s.id === selectedStrategy) || STRATEGIES[0];
  }, [selectedStrategy]);

  const legs = useMemo(() => {
    if (isNaN(budgetNum) || budgetNum <= 0) return [];
    
    return TERMS_MAP.map((term, i) => {
      const pct = strategy.allocations[i];
      const amount = budgetNum * pct;
      const interest = amount * (term.apyBps / 10000) * (term.durationDays / 365);
      const maturityDate = new Date();
      maturityDate.setDate(maturityDate.getDate() + term.durationDays);

      return {
        ...term,
        percentage: pct * 100,
        amount,
        interest,
        maturityDate
      };
    });
  }, [budgetNum, strategy]);

  const summary = useMemo(() => {
    if (legs.length === 0) return { totalAllocated: 0, totalInterest: 0, weightedAPY: 0 };

    const totalAllocated = legs.reduce((sum, leg) => sum + leg.amount, 0);
    const totalInterest = legs.reduce((sum, leg) => sum + leg.interest, 0);
    
    // Weighted APY = Sum(Amount * APY) / TotalAmount
    const sumProduct = legs.reduce((sum, leg) => sum + (leg.amount * leg.apyBps), 0);
    const weightedAPY = sumProduct / totalAllocated / 100;

    return {
      totalAllocated,
      totalInterest,
      weightedAPY
    };
  }, [legs]);

  // Handle Smart Account Deploy (Atomic multi-call batching!)
  const handleSmartDeploy = async () => {
    if (!isSmartAccount || !circleAccount || !isFormValid) return;
    
    setSmartPending(true);
    try {
      toast.info("Preparing gasless atomic ladder deployment...");
      
      const totalAmountRaw = parseUnits(totalBudget, 6);
      
      // Call 1: Total allowance approval for the Vault contract
      const approveCall = {
        to: depositTokenAddress as `0x${string}`,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [VAULT_ADDRESS, totalAmountRaw],
        }),
      };

      // Calls 2-5: Create bonds for each leg of the ladder
      const depositCalls = legs.map((leg) => {
        const legAmountRaw = parseUnits(leg.amount.toFixed(6), 6);
        return {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'createBondWithIntent',
            args: [
              legAmountRaw,
              BigInt(leg.id),
              supplierAddress as `0x${string}`,
              Number(destChain),
            ]
          })
        };
      });

      // Combine all calls (Approve + 4 deposits)
      const allCalls = [approveCall, ...depositCalls];

      const userOpHash = await bundlerClient.sendUserOperation({
        account: circleAccount,
        calls: allCalls,
        paymaster: true,
      });

      toast.info("Deploying bond ladder to network. Waiting for confirmation...", {
        description: `UserOp Hash: ${userOpHash.slice(0, 10)}...`
      });

      setSmartPending(false);
      setSmartConfirming(true);

      const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
      setSmartTxHash(receipt.transactionHash);
      setSmartConfirming(false);
      
      toast.success("Bond ladder successfully deployed", {
        description: `All ${legs.length} payments have been staggered and scheduled.`,
        action: {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
        }
      });
      
      // Reset form
      setSupplierAddress('');
    } catch (error: any) {
      console.error("Smart Account Deploy Error:", error);
      setSmartPending(false);
      setSmartConfirming(false);
      if (error.message?.includes('User rejected') || error.code === 'NotAllowedError' || error.name === 'NotAllowedError') {
        toast.info("Transaction cancelled");
        return;
      }
      toast.error("Deployment failed", {
        description: error.message || "Failed to schedule the ladder. Check your parameters."
      });
    }
  };

  // Handle EOA sequential approvals (educational warning or manual trigger)
  const handleEOADeploy = () => {
    alert("Atomic batch transactions require a Circle Smart Account. Standard browser wallets require signing 5 sequential transactions (1 Approval + 4 Deposit intents). Please switch to a Passkey or Email Smart Account in the header for a single-click experience!");
  };

  return (
    <>
      <div className="w-full max-w-5xl mx-auto mb-12 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Form Settings Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card-surface p-5 space-y-4 shadow-sm" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <Layers className="text-[var(--primary)]" size={18} />
              <h3 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
                Ladder Parameters
              </h3>
            </div>

            {/* Total Budget Input */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--foreground)' }}>
                Total Allocation Budget
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  className="w-full pl-8 pr-16 py-2 rounded-xl text-sm font-semibold border bg-[var(--canvas)] transition-all focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="0.00"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
                  $
                </span>
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
                  {depositToken}
                </span>
              </div>
            </div>

            {/* Strategy Picker */}
            <div>
              <label className="text-xs font-semibold block mb-1.5" style={{ color: 'var(--foreground)' }}>
                Staggering Strategy
              </label>
              <div className="flex flex-col gap-2">
                {STRATEGIES.map((strat) => (
                  <button
                    key={strat.id}
                    onClick={() => setSelectedStrategy(strat.id)}
                    className="text-left p-3 rounded-xl border text-xs transition-all relative"
                    style={{ 
                      borderColor: selectedStrategy === strat.id ? 'var(--primary)' : 'var(--border)',
                      background: selectedStrategy === strat.id ? 'var(--primary-soft)' : 'var(--canvas)' 
                    }}
                  >
                    <div className="font-bold flex items-center justify-between" style={{ color: selectedStrategy === strat.id ? 'var(--primary)' : 'var(--foreground)' }}>
                      {strat.name}
                      {selectedStrategy === strat.id && <CheckCircle2 size={13} />}
                    </div>
                    <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>
                      {strat.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Assets */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Deposit Token
                </label>
                <CustomDropdown
                  value={depositToken}
                  onChange={(val: string) => {
                    setDepositToken(val);
                    if (swapAtDeposit) setSettlementToken(val);
                  }}
                  options={CURRENCY_OPTIONS}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Vendor Receives
                </label>
                <CustomDropdown
                  value={settlementToken}
                  onChange={(val: string) => setSettlementToken(val)}
                  options={CURRENCY_OPTIONS}
                />
              </div>
            </div>

            {/* Swap Timing Logic */}
            {depositToken !== settlementToken && (
              <div className="rounded-xl p-3 text-xs space-y-2 border border-dashed" style={{ background: 'var(--info-soft)', borderColor: 'var(--info-border)' }}>
                <span className="font-semibold block" style={{ color: 'var(--info-foreground)' }}>
                  StableFX Swap Required
                </span>
                <p style={{ color: 'var(--info-foreground)' }}>
                  Your deposit token differs from vendor settlement token. Swaps will be executed automatically.
                </p>
                <div className="flex gap-4 pt-1 font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={swapAtDeposit}
                      onChange={() => setSwapAtDeposit(true)}
                      className="accent-[var(--primary)]"
                    />
                    Swap at Deposit
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={!swapAtDeposit}
                      onChange={() => setSwapAtDeposit(false)}
                      className="accent-[var(--primary)]"
                    />
                    Swap at Maturity
                  </label>
                </div>
              </div>
            )}

            {/* Destination Vendor Form */}
            <div className="pt-2 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Vendor Address (Destination Receiver)
                </label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs border font-mono bg-[var(--canvas)] transition-all focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  style={{ borderColor: 'var(--border)' }}
                  placeholder="0x..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--foreground)' }}>
                  Delivery Network Method
                </label>
                <CustomDropdown
                  value={destChain}
                  onChange={(val: string) => setDestChain(val)}
                  options={TRANSFER_OPTIONS}
                />
              </div>
            </div>

            {/* Smart Account Banner */}
            {!isSmartAccount && (
              <div className="rounded-xl p-3 flex gap-2 border text-xs" style={{ background: 'var(--warning-soft)', borderColor: 'var(--warning-border)' }}>
                <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
                <div style={{ color: 'var(--warning-foreground)' }}>
                  <strong>Sequential Signing Required:</strong> You are currently using an EOA wallet. You will have to sign 5 separate transactions. Switch to biometrics/email login to deploy the entire ladder in **one click**.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card-surface p-4 text-center border" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
                Allocated Budget
                <Tooltip text="The sum of all USDC/EURC allocations scheduled across the active legs of the bond ladder." />
              </span>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--foreground)' }}>
                {summary.totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[9px] font-semibold opacity-75" style={{ color: 'var(--muted-foreground)' }}>
                {depositToken}
              </span>
            </div>
            
            <div className="card-surface p-4 text-center border" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
                Weighted APY
                <Tooltip text="The average annualized yield of the ladder, weighted by the capital allocated to each maturity duration." />
              </span>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--success)' }}>
                {summary.weightedAPY.toFixed(2)}%
              </p>
              <span className="text-[9px] font-semibold opacity-75" style={{ color: 'var(--muted-foreground)' }}>
                Staggered Average
              </span>
            </div>

            <div className="card-surface p-4 text-center border" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[10px] uppercase font-bold flex items-center justify-center" style={{ color: 'var(--muted-foreground)' }}>
                Projected Return
                <Tooltip text="The total estimated interest yield earned at maturity across all staggered legs." />
              </span>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--success)' }}>
                +{summary.totalInterest.toFixed(2)}
              </p>
              <span className="text-[9px] font-semibold opacity-75" style={{ color: 'var(--muted-foreground)' }}>
                {selectedStrategy === 'long' ? 'Yield Maximized' : 'Liquid Match'}
              </span>
            </div>
          </div>

          {/* Staggered Legs Details */}
          <div className="card-surface p-5 space-y-4 shadow-sm" style={{ border: '1px solid var(--border)' }}>
            <h4 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
              Staggered Maturity Schedule (Legs)
            </h4>

            <div className="space-y-3">
              {legs.map((leg, index) => {
                return (
                  <div key={leg.id} className="p-3.5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all hover:bg-[var(--muted)]/20"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                        Leg {index + 1}
                      </div>
                      <div>
                        <div className="font-bold text-xs" style={{ color: 'var(--foreground)' }}>
                          {leg.label} Term
                        </div>
                        <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          Matures: {leg.maturityDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 justify-between w-full sm:w-auto">
                      <div className="text-right sm:text-right">
                        <div className="text-xs font-bold" style={{ color: 'var(--foreground)' }}>
                          {leg.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {depositToken}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
                          ({leg.percentage.toFixed(0)}% allocation)
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs font-bold text-[var(--success-foreground)]">
                          +{leg.interest.toFixed(2)} {depositToken}
                        </div>
                        <div className="badge badge-success text-[9px] mt-0.5">
                          {leg.apyLabel}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Compliance warnings */}
            {!checkingCompliance && (!isVerified || isBlacklisted) && (
              <div className={`p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4 ${
                isBlacklisted 
                  ? 'bg-red-500/10 text-red-200 border border-red-500/30 animate-slide-up' 
                  : 'bg-amber-500/10 text-amber-200 border border-amber-500/30 animate-slide-up'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${isBlacklisted ? 'text-red-500' : 'text-amber-500'}`}>
                    <AlertOctagon size={16} />
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

            {/* Action Execution Footer */}
            <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <Shield size={14} className="text-[var(--success-foreground)]" />
                <span>All legs are secured under separate on-chain locks.</span>
              </div>

              <button
                onClick={isSmartAccount ? handleSmartDeploy : handleEOADeploy}
                disabled={!isFormValid || smartPending || smartConfirming || !isVerified || isBlacklisted}
                className="whitespace-nowrap shrink-0 px-6 py-3 gap-2.5 text-sm font-semibold justify-center items-center flex rounded-[var(--radius)] text-white bg-neutral-900 border border-amber-500/30 hover:border-amber-500/80 shadow-[0_2px_8px_-1px_rgba(0,0,0,0.1),0_0_12px_rgba(217,119,6,0.1)] hover:shadow-[0_4px_16px_rgba(217,119,6,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:scale-100 disabled:shadow-none disabled:border-transparent disabled:cursor-not-allowed"
                id="btn-deploy-ladder"
              >
                {smartPending ? (
                  <><Loader2 size={14} className="animate-spin" /> Preparing...</>
                ) : smartConfirming ? (
                  <><Loader2 size={14} className="animate-spin" /> Staggering...</>
                ) : (
                  <>Deploy Staggered Ladder <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

      {/* Workflow Success Modal */}
      {showSuccessWorkflowModal && isMounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="card-surface max-w-md w-full overflow-hidden shadow-2xl relative animate-scale-in p-6 text-left"
            style={{ border: '1px solid var(--border)', background: 'var(--canvas)' }}>
            
            {/* Modal Header */}
            <div className="text-center pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="w-12 h-12 rounded-full bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">
                Staggered Maturity Schedule Active!
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">
                Your staggered bond ladder has been successfully deployed on-chain.
              </p>
            </div>

            {/* Position Summary */}
            <div className="my-5 p-4 rounded-xl space-y-2.5 text-xs border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--muted-foreground)' }}>Total Budget:</span>
                <span className="font-semibold text-[var(--foreground)]">{totalBudget} {depositToken}</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--muted-foreground)' }}>Weighted APY:</span>
                <span className="font-semibold text-[var(--success)]">{summary.weightedAPY.toFixed(2)}% APY</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: 'var(--muted-foreground)' }}>Total Staggered Legs:</span>
                <span className="font-semibold text-[var(--foreground)]">{legs.length} Maturities</span>
              </div>
              <div className="flex justify-between items-start pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <span style={{ color: 'var(--muted-foreground)' }}>Target Vendor:</span>
                <span className="font-mono text-[10px] block truncate max-w-[180px] text-[var(--foreground)]">{supplierAddress || "0x3522...6b0a"}</span>
              </div>
            </div>

            {/* Next Steps Recommendations */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Recommended Actions:
              </h4>
              
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessWorkflowModal(false);
                    onNavigateToTab?.('calendar');
                  }}
                  className="w-full p-3 rounded-lg border text-left hover:bg-[var(--card-hover)] transition-all flex items-center justify-between group cursor-pointer"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center shrink-0">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)]">View Maturity Dates</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Visualize cash releases and automated settlement events.</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessWorkflowModal(false);
                    onNavigateToTab?.('treasury');
                  }}
                  className="w-full p-3 rounded-lg border text-left hover:bg-[var(--card-hover)] transition-all flex items-center justify-between group cursor-pointer"
                  style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[var(--info-soft)] text-[var(--info)] flex items-center justify-center shrink-0">
                      <TrendingUp size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)]">Monitor Interest Accrual</div>
                      <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Track daily yield accrual across your active bonds.</div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
                </button>

                {smartTxHash && (
                  <a
                    href={`https://testnet.arcscan.app/tx/${smartTxHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full p-3 rounded-lg border text-left hover:bg-[var(--card-hover)] transition-all flex items-center justify-between group cursor-pointer"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-neutral-100 text-neutral-600 flex items-center justify-center shrink-0">
                        <ArrowUpRight size={14} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--foreground)]">Verify Multi-Call Batch Transaction</div>
                        <div className="text-[10px] text-[var(--muted-foreground)] mt-0.5">Inspect the atomic user operation on Arc Explorer.</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[var(--muted-foreground)] group-hover:translate-x-0.5 transition-transform" />
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSuccessWorkflowModal(false)}
                className="btn-secondary text-xs px-4 py-2 font-bold w-full cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
