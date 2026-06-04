"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useReadContract, usePublicClient, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseAbi, formatUnits, encodeFunctionData } from 'viem';
import { toast } from 'sonner';
import { TrendingUp, ShieldAlert, Sparkles, RefreshCw, Zap, Landmark, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';

const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const VAULT_ABI = parseAbi([
  "function nextBondId() view returns (uint256)",
  "function bonds(uint256) view returns (address owner, uint256 principal, uint256 yieldBps, uint256 maturityDate, bool isSettled, uint256 termId, address depositToken, address settlementToken, bool swapAtDeposit, (address supplier, uint32 destDomain, bool isConfigured) intent, address agent, uint256 creationTimestamp, uint8 tranche)",
  "function claimedInterest(uint256) view returns (uint256)",
  "function claimAccruedYield(uint256 _bondId) external",
  "function calculateAccruedYield(uint256 _bondId) view returns (uint256)"
]);

const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const EURC_ADDRESS = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";

const getTokenSymbol = (addr: string) => {
  if (!addr) return "USDC";
  if (addr.toLowerCase() === USDC_ADDRESS.toLowerCase()) return "USDC";
  if (addr.toLowerCase() === EURC_ADDRESS.toLowerCase()) return "EURC";
  return "USDC";
};

type ActiveStream = {
  id: number;
  principal: number;
  yieldBps: number;
  maturityDate: number;
  creationTimestamp: number;
  depositToken: string;
  settlementToken: string;
  swapAtDeposit: boolean;
  tranche: number; // 0 = Senior, 1 = Junior
  claimedInterest: number;
};

export default function YieldStreamer() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const publicClient = usePublicClient();
  const [activeStreams, setActiveStreams] = useState<ActiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tick, setTick] = useState(0);

  // Claim Tx State
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [smartClaimPending, setSmartClaimPending] = useState(false);

  const { data: nextBondIdData, refetch: refetchNextId } = useReadContract({
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'nextBondId',
  });

  const { data: claimHash, writeContract: writeClaim, isPending: isClaiming } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: claimHash });

  // Load active bonds/streams
  const fetchActiveStreams = async () => {
    if (!publicClient || !nextBondIdData || !address) return;
    setIsLoading(true);
    try {
      const nextId = Number(nextBondIdData);
      const startId = Math.max(1, nextId - 20);
      const bondsCalls = [];
      const claimedCalls = [];

      for (let i = nextId - 1; i >= startId; i--) {
        bondsCalls.push({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'bonds',
          args: [BigInt(i)]
        });
        claimedCalls.push({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'claimedInterest',
          args: [BigInt(i)]
        });
      }

      const [bondsRes, claimedRes] = await Promise.all([
        publicClient.multicall({ contracts: bondsCalls }),
        publicClient.multicall({ contracts: claimedCalls })
      ]);

      const streams: ActiveStream[] = [];
      bondsRes.forEach((res, index) => {
        if (res.status === 'success' && res.result) {
          const b = res.result as any;
          const claimed = claimedRes[index]?.status === 'success' ? Number(formatUnits(claimedRes[index].result as bigint, 6)) : 0;
          
          if (b[0].toLowerCase() === address.toLowerCase() && !b[4]) { // owned and not settled
            streams.push({
              id: nextId - 1 - index,
              principal: Number(formatUnits(b[1], 6)),
              yieldBps: Number(b[2]),
              maturityDate: Number(b[3]),
              depositToken: getTokenSymbol(b[6]),
              settlementToken: getTokenSymbol(b[7]),
              swapAtDeposit: b[8],
              creationTimestamp: Number(b[11]),
              tranche: Number(b[12]),
              claimedInterest: claimed
            });
          }
        }
      });

      setActiveStreams(streams);
    } catch (err) {
      console.error("Failed to load active streams:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveStreams();
  }, [nextBondIdData, address, publicClient]);

  // Second-by-second ticker update
  useEffect(() => {
    if (activeStreams.length === 0) return;
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 100);
    return () => clearInterval(interval);
  }, [activeStreams]);

  // Handle claim confirmation
  useEffect(() => {
    if (isClaimSuccess) {
      toast.success("Yield claimed successfully! 🎉", {
        description: "Your streamed interest has been transferred to your wallet."
      });
      setClaimingId(null);
      refetchNextId();
      fetchActiveStreams();
    }
  }, [isClaimSuccess]);

  // Accrued yield calculation logic (matches contract formula: principal * yieldBps * elapsed / (365 days * 10000))
  const liveAccrued = useMemo(() => {
    let usdcSum = 0;
    let eurcSum = 0;
    const now = Date.now() / 1000;

    const streamsData = activeStreams.map(s => {
      const endTimestamp = now > s.maturityDate ? s.maturityDate : now;
      const elapsed = Math.max(0, endTimestamp - s.creationTimestamp);
      const totalAccrued = (s.principal * s.yieldBps * elapsed) / (365 * 24 * 60 * 60 * 10000);
      const claimable = Math.max(0, totalAccrued - s.claimedInterest);
      
      const currency = s.swapAtDeposit ? s.settlementToken : s.depositToken;
      if (currency === 'USDC') {
        usdcSum += claimable;
      } else {
        eurcSum += claimable;
      }

      return {
        ...s,
        currentClaimable: claimable,
        totalAccrued,
        currency
      };
    });

    return {
      usdcSum,
      eurcSum,
      streamsData
    };
  }, [activeStreams, tick]);

  const handleClaimYield = async (bondId: number) => {
    setClaimingId(bondId);
    
    if (isSmartAccount && circleAccount) {
      setSmartClaimPending(true);
      try {
        toast.info("Preparing gasless yield claim user operation...");
        
        const executeCall = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'claimAccruedYield',
            args: [BigInt(bondId)],
          }),
        };

        const userOpHash = await bundlerClient.sendUserOperation({
          account: circleAccount,
          calls: [executeCall],
          paymaster: true,
        });

        toast.info("Transaction sent to bundler. Awaiting execution...", {
          description: `UserOp Hash: ${userOpHash.slice(0, 10)}...`,
        });

        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        
        toast.success("Yield claimed successfully! 🎉", {
          description: "Your streamed interest has been transferred to your smart account.",
          action: {
            label: 'View receipt',
            onClick: () => window.open(`https://testnet.arcscan.app/tx/${receipt.transactionHash}`, '_blank')
          }
        });
        
        refetchNextId();
        fetchActiveStreams();
      } catch (error: any) {
        console.error("Smart Account Claim Error:", error);
        toast.error("Claim operation failed", {
          description: error.message || "Failed to execute claimAccruedYield."
        });
      } finally {
        setSmartClaimPending(false);
        setClaimingId(null);
      }
    } else {
      try {
        if (!publicClient || !address) return;
        
        const { request } = await publicClient.simulateContract({
          account: address,
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'claimAccruedYield',
          args: [BigInt(bondId)],
        });
        
        writeClaim(request);
      } catch (error: any) {
        console.error(error);
        toast.error("Claim operation failed", {
          description: error.shortMessage || error.message || "Failed to submit claim."
        });
        setClaimingId(null);
      }
    }
  };

  if (!isConnected || activeStreams.length === 0) return null;

  return (
    <div className="card-surface overflow-hidden relative border border-[var(--border-subtle)] shadow-lg hover:shadow-xl transition-all duration-300">
      
      {/* Decorative Gradient Background overlay */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="p-6 md:p-8">
        
        {/* Header Widget Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md animate-pulse">
              <TrendingUp size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                Real-Time Yield Streamer
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                  Live
                </span>
              </h3>
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                Watch your corporate treasury accrue yield second-by-second.
              </p>
            </div>
          </div>
          <button 
            onClick={() => { refetchNextId(); fetchActiveStreams(); }}
            className="p-2 rounded-lg border border-[var(--border)] hover:bg-[var(--muted)]/30 transition-all text-[var(--muted-foreground)]"
            disabled={isLoading}
            title="Refresh streams"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Digital Led Live Counter Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
          {/* USDC Counter */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2 flex items-center gap-1">
              <Zap size={10} className="fill-emerald-400" /> USDC Accrued Balance
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight font-mono text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              ${liveAccrued.usdcSum.toFixed(6)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">
              Claimable instantly in USDC
            </div>
          </div>

          {/* EURC Counter */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-left relative overflow-hidden group shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2 flex items-center gap-1">
              <Zap size={10} className="fill-emerald-400" /> EURC Accrued Balance
            </div>
            <div className="text-2xl md:text-3xl font-bold tracking-tight font-mono text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
              €{liveAccrued.eurcSum.toFixed(6)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-sans">
              Claimable instantly in EURC
            </div>
          </div>

        </div>

        {/* Streaming Positions List */}
        <div className="space-y-3.5">
          <div className="text-xs font-bold uppercase tracking-wider mb-2 text-[var(--muted-foreground)]">
            Active Streaming Positions
          </div>

          {liveAccrued.streamsData.map((stream) => {
            const isStreamClaiming = claimingId === stream.id && (isClaiming || isClaimConfirming || smartClaimPending);
            return (
              <div 
                key={stream.id} 
                className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary-border)] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Details left */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--muted)] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[var(--muted-foreground)]">#{stream.id}</span>
                    <span className="text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 px-1 rounded">
                      {stream.tranche === 0 ? "SR" : "JR"}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                        {stream.principal.toLocaleString()} {stream.depositToken}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--muted-foreground)]">
                        at {(stream.yieldBps / 100).toFixed(1)}% APY
                      </span>
                    </div>
                    <div className="text-[10px] mt-0.5 flex items-center gap-1 text-[var(--muted-foreground)]">
                      <span>Tranche: {stream.tranche === 0 ? "🛡️ Senior (Low Risk)" : "🔥 Junior (Waterfall)"}</span>
                    </div>
                  </div>
                </div>

                {/* Accrued Ticker Right */}
                <div className="flex items-center justify-between sm:justify-end gap-5">
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-bold font-mono text-emerald-500">
                      +{stream.currentClaimable.toFixed(6)} {stream.currency}
                    </div>
                    <div className="text-[9px] text-[var(--muted-foreground)] uppercase tracking-wider font-semibold">
                      Streaming Live
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimYield(stream.id)}
                    disabled={stream.currentClaimable <= 0.000001 || isStreamClaiming}
                    className="btn-primary text-xs px-3.5 py-1.5 font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1"
                    id={`btn-claim-yield-widget-${stream.id}`}
                  >
                    {isStreamClaiming ? (
                      <><Loader2 size={11} className="animate-spin" /> Claiming...</>
                    ) : (
                      <>Claim Yield</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
