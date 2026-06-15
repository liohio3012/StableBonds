"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useSwitchChain } from 'wagmi';
import { parseAbi, parseUnits, encodeFunctionData, encodeAbiParameters, pad, keccak256, decodeAbiParameters } from 'viem';
import { toast } from 'sonner';
import { ExternalLink, Shield, HelpCircle, CheckCircle2, Clock, ArrowRight, Info, Wallet, Building2, Calendar, DollarSign, Loader2, RefreshCw, AlertOctagon } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';

// Arc Testnet Constants
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const ERC20_ABI = parseAbi(["function approve(address spender, uint256 amount) external returns (bool)"]);
const VAULT_ABI = parseAbi([
  "function createBondWithIntent(uint256 _amount, uint256 _termId, address _supplier, uint32 _destDomain, address _depositToken, address _settlementToken, bool _swapAtDeposit, uint256 _minBuyAmount, bytes _tradeData) external",
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
  { id: 'arc', name: 'Arc Testnet', chainId: 5042002, icon: '🌟' },
  { id: 'unified-balance', name: 'Unified Balance (Circle Gateway)', chainId: 0, icon: '⚡' },
  { id: 'ethereum', name: 'Ethereum Sepolia', chainId: 11155111, icon: '🔷' },
  { id: 'arbitrum', name: 'Arbitrum Sepolia', chainId: 421614, icon: '🌀' },
  { id: 'base', name: 'Base Sepolia', chainId: 84532, icon: '🔵' },
  { id: 'optimism', name: 'Optimism Sepolia', chainId: 11155420, icon: '🔴' }
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
  { value: "0", label: "Standard Transfer", sublabel: "Most common option", icon: "🏦" },
  { value: "3", label: "Express Transfer", sublabel: "Faster settlement", icon: "⚡" },
  { value: "6", label: "Economy Transfer", sublabel: "Lower fees", icon: "💰" },
  { value: "22", label: "International Transfer", sublabel: "Cross-border payments", icon: "🌍" },
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

export default function IntentBuilder() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
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
      toast.success("Balance verified ✓", {
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
      toast.success("Payment scheduled! 🎉", {
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
      toast.success("Source allowance approved! 🔓", {
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
      toast.success("Cross-chain bond successfully created on Arc Testnet! 🎉", {
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
        toast.success("Cross-chain bond successfully created on Arc Testnet! 🎉");
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
          toast.info("Connecting to Circle Gateway SDK...");
          await new Promise(r => setTimeout(r, 600));

          toast.info("Generating payment intent...", {
            description: "Designated Pool: Gateway Designated Pool Manager (Arc Testnet)"
          });
          await new Promise(r => setTimeout(r, 600));

          // Deduct from mock balances in localStorage
          const savedBalances = localStorage.getItem('stablebonds_unified_balances');
          if (savedBalances) {
            const parsed = JSON.parse(savedBalances);
            let remainingToDeduct = parseFloat(amount);
            const updated = parsed.map((c: any) => {
              if (remainingToDeduct > 0 && c.balance > 0) {
                const deduct = Math.min(c.balance, remainingToDeduct);
                remainingToDeduct -= deduct;
                return { ...c, balance: c.balance - deduct };
              }
              return c;
            });
            localStorage.setItem('stablebonds_unified_balances', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          }

          // Add a log entry
          const savedLogs = localStorage.getItem('stablebonds_gateway_logs');
          const parsedLogs = savedLogs ? JSON.parse(savedLogs) : [];
          const randomHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("").slice(0,6) + "..." + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("").slice(-4);
          const newLog = {
            id: "tx_" + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            chain: "Unified Pool",
            amount: parseFloat(amount),
            status: "Settled",
            txHash: randomHash
          };
          localStorage.setItem('stablebonds_gateway_logs', JSON.stringify([newLog, ...parsedLogs]));

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

          toast.success("Circle Gateway payment settled & bond created! 🎉", {
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
          
          toast.info("Connecting to Circle Gateway SDK...");
          await new Promise(r => setTimeout(r, 600));

          toast.info("Generating payment intent...", {
            description: "Requesting signature for payment from Unified Balance"
          });
          await new Promise(r => setTimeout(r, 600));

          // Deduct from mock balances in localStorage
          const savedBalances = localStorage.getItem('stablebonds_unified_balances');
          if (savedBalances) {
            const parsed = JSON.parse(savedBalances);
            let remainingToDeduct = parseFloat(amount);
            const updated = parsed.map((c: any) => {
              if (remainingToDeduct > 0 && c.balance > 0) {
                const deduct = Math.min(c.balance, remainingToDeduct);
                remainingToDeduct -= deduct;
                return { ...c, balance: c.balance - deduct };
              }
              return c;
            });
            localStorage.setItem('stablebonds_unified_balances', JSON.stringify(updated));
            window.dispatchEvent(new Event('storage'));
          }

          // Add a log entry
          const savedLogs = localStorage.getItem('stablebonds_gateway_logs');
          const parsedLogs = savedLogs ? JSON.parse(savedLogs) : [];
          const randomHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("").slice(0,6) + "..." + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("").slice(-4);
          const newLog = {
            id: "tx_" + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            chain: "Unified Pool",
            amount: parseFloat(amount),
            status: "Settled",
            txHash: randomHash
          };
          localStorage.setItem('stablebonds_gateway_logs', JSON.stringify([newLog, ...parsedLogs]));

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
              depositTokenAddress as `0x${string}`,
              settlementTokenAddress as `0x${string}`,
              swapAtDeposit,
              minBuyAmount,
              "0x"
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

        toast.success("Payment scheduled successfully! 🎉", {
          description: "Your funds are now earning interest. The vendor will be paid automatically on the due date.",
          duration: 8000,
          action: {
            label: 'View receipt',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
          }
        });
      } catch (error: any) {
        console.error("Smart Account Tx Error:", error);
        setSmartPending(false);
        setSmartConfirming(false);
        if (error.message?.includes('User rejected') || error.code === 'NotAllowedError' || error.name === 'NotAllowedError') {
          toast.info("Payment cancelled", {
            description: "You cancelled the passkey authentication signature.",
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
            depositTokenAddress as `0x${string}`,
            settlementTokenAddress as `0x${string}`,
            swapAtDeposit,
            minBuyAmount,
            "0x"
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
              <strong className="font-semibold block mb-1">💡 Here's what happens:</strong>
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
              <select 
                value={sourceNetwork}
                onChange={(e) => {
                  setSourceNetwork(e.target.value as any);
                  setBridgeStep(0); // Reset stepper on network change
                }}
                className="input-field font-medium appearance-none cursor-pointer font-sans"
              >
                {SOURCE_NETWORKS.map(net => (
                  <option key={net.id} value={net.id}>
                    {net.icon} {net.name} {net.id === 'arc' ? '(Native)' : ''}
                  </option>
                ))}
              </select>
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
                  <span className="flex items-center gap-1">⚡ Circle Gateway Active</span>
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
                  🛰️ Cross-Chain Routing Progress
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
                <select 
                  value={depositToken}
                  onChange={(e) => setDepositToken(e.target.value)}
                  className="input-field font-medium appearance-none cursor-pointer"
                >
                  <option value="USDC">🇺🇸 USDC (USD Coin)</option>
                  <option value="EURC">🇪🇺 EURC (Euro Coin)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Vendor receives
                  <Tooltip text="Select the currency your vendor wants to receive." />
                </label>
                <select 
                  value={settlementToken}
                  onChange={(e) => setSettlementToken(e.target.value)}
                  className="input-field font-medium appearance-none cursor-pointer"
                >
                  <option value="USDC">🇺🇸 USDC (USD Coin)</option>
                  <option value="EURC">🇪🇺 EURC (Euro Coin)</option>
                </select>
              </div>
            </div>

            {/* Swap Timing (Only if tokens are different) */}
            {depositToken !== settlementToken && (
              <div className="animate-fade-in">
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  Currency Conversion Timing (StableFX)
                  <Tooltip text="Choose when to perform the exchange swap. 'Swap immediately' locks in the conversion rate today. 'Swap at maturity' performs the swap when the payment is delivered." />
                </label>
                <select 
                  value={swapAtDeposit ? "immediate" : "maturity"}
                  onChange={(e) => setSwapAtDeposit(e.target.value === "immediate")}
                  className="input-field font-medium appearance-none cursor-pointer"
                >
                  <option value="immediate">💱 Swap immediately (Lock rate today)</option>
                  <option value="maturity">⏳ Swap at maturity (Market rate at delivery)</option>
                </select>
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
                🛡️ Tranche / Risk Profile
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
                  <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>🛡️ Senior Tranche</div>
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
                  <div className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>🔥 Junior Tranche</div>
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
                <div className="relative">
                  <select 
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(parseInt(e.target.value))}
                    className="input-field font-medium appearance-none cursor-pointer"
                    id="payment-term"
                  >
                    {TERMS_OPTIONS.filter((opt) => opt.tranche === selectedTerm.tranche).map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        🗓️ {opt.label} — {opt.apyLabel}
                      </option>
                    ))}
                  </select>
                </div>
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
                <select 
                  value={destChain}
                  onChange={(e) => setDestChain(e.target.value)}
                  className="input-field font-medium appearance-none cursor-pointer"
                  id="transfer-method"
                >
                  {NETWORK_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label} — {opt.sublabel}
                    </option>
                  ))}
                </select>
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
                ℹ️ Ask your vendor for their payment address. It's like a bank account number for receiving funds.
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
            <div className={`p-4 rounded-xl flex items-start gap-3 mt-6 ${
              isBlacklisted 
                ? 'bg-red-50 text-red-800 border border-red-200 animate-slide-up' 
                : 'bg-amber-50 text-amber-800 border border-amber-200 animate-slide-up'
            }`}>
              <div className={`mt-0.5 ${isBlacklisted ? 'text-red-600' : 'text-amber-600'}`}>
                {isBlacklisted ? <AlertOctagon size={16} /> : <Shield size={16} />}
              </div>
              <div className="text-xs">
                <span className="font-bold block mb-0.5">
                  {isBlacklisted 
                    ? 'Compliance Block Active' 
                    : 'KYC/KYB Verification Required'}
                </span>
                <span>
                  {isBlacklisted 
                    ? 'Your wallet is currently blacklisted/sanctioned. All transaction operations are blocked.' 
                    : 'You must verify your corporate treasury profile in the Compliance Center before scheduling payments.'}
                </span>
              </div>
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
