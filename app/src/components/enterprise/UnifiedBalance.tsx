"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Sparkles, Copy, Check, RefreshCw, QrCode, ArrowDownLeft, Network, Wallet, TrendingUp, Info, HelpCircle, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { arcTestnet } from 'viem/chains';
import { useAccount } from 'wagmi';
import { useCircleAuth } from '@/lib/CircleAuthContext';

// USDC ERC-20 ABI (6 decimals on all chains)
const USDC_BALANCE_ABI = parseAbi([
  "function balanceOf(address account) view returns (uint256)"
]);

// Chain configurations with real USDC contract addresses
const CHAIN_CONFIGS = [
  {
    chainId: "arc-testnet",
    name: "Arc Testnet",
    symbol: "USDC",
    iconColor: "from-blue-500 to-indigo-600",
    networkType: "Native",
    rpcUrl: "https://rpc.testnet.arc.network",
    usdcAddress: "0x3600000000000000000000000000000000000000" as `0x${string}`,
    decimals: 6,
    explorerUrl: "https://testnet.arcscan.app/address/",
    viemChain: arcTestnet,
  },
] as const;

// Chain interface
interface ChainBalance {
  chainId: string;
  name: string;
  symbol: string;
  balance: number;
  iconColor: string;
  networkType: string;
  rawBalance: bigint;
  explorerUrl: string;
}

export default function UnifiedBalance() {
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const address = isSmartAccount ? circleAccount?.address : eoaAddress;

  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState<ChainBalance[]>([]);
  const [lastRefresh, setLastRefresh] = useState<number>(0);

  // Fetch real on-chain USDC balances
  const fetchBalances = useCallback(async () => {
    if (!address) {
      setBalances([]);
      return;
    }

    setIsLoading(true);

    try {
      const balancePromises = CHAIN_CONFIGS.map(async (chain) => {
        try {
          const client = createPublicClient({
            chain: chain.viemChain,
            transport: http(chain.rpcUrl),
          });

          const rawBalance = await client.readContract({
            address: chain.usdcAddress,
            abi: USDC_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          });

          const balance = parseFloat(formatUnits(rawBalance as bigint, chain.decimals));

          return {
            chainId: chain.chainId,
            name: chain.name,
            symbol: chain.symbol,
            balance,
            iconColor: chain.iconColor,
            networkType: chain.networkType,
            rawBalance: rawBalance as bigint,
            explorerUrl: chain.explorerUrl,
          };
        } catch (err) {
          console.error(`Failed to fetch balance from ${chain.name}:`, err);
          return {
            chainId: chain.chainId,
            name: chain.name,
            symbol: chain.symbol,
            balance: 0,
            iconColor: chain.iconColor,
            networkType: chain.networkType,
            rawBalance: BigInt(0),
            explorerUrl: chain.explorerUrl,
          };
        }
      });

      const results = await Promise.all(balancePromises);
      setBalances(results);
      setLastRefresh(Date.now());
      toast.success("Balances updated successfully");
    } catch (err) {
      console.error("Failed to fetch balances:", err);
      toast.error("Failed to fetch on-chain balances");
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Fetch balances when address changes
  useEffect(() => {
    if (address) {
      fetchBalances();
    }
  }, [address, fetchBalances]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Wallet address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate Total Unified Balance
  const totalBalance = balances.reduce((sum, chain) => sum + chain.balance, 0);

  return (
    <div className="space-y-6">
      {/* Overview Panel */}
      <div className="card-surface p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[var(--primary-soft)] to-transparent opacity-40 pointer-events-none rounded-md translate-x-12 -translate-y-12"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="badge badge-primary text-xs font-semibold px-2 py-1">
              <Sparkles size={11} className="mr-1" />
              Live Balance
            </span>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Unified Treasury Balance</h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl leading-relaxed">
              Your current USDC balance across all connected accounts, updated in real time.
            </p>
          </div>
          <button 
            onClick={fetchBalances} 
            disabled={isLoading || !address}
            className="btn-secondary h-10 w-fit shrink-0 self-start md:self-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh Balances
          </button>
        </div>
      </div>

      {/* Not Connected State */}
      {!isConnected && (
        <div className="card-surface p-12 text-center flex flex-col items-center justify-center gap-3">
          <Wallet className="text-[var(--muted-foreground)] opacity-50" size={36} />
          <h4 className="font-semibold text-[var(--foreground)]">Connect Your Wallet</h4>
          <p className="text-sm text-[var(--muted-foreground)] max-w-sm">
            Connect a wallet or sign in with a Circle Smart Account to view your real-time USDC balances across supported chains.
          </p>
        </div>
      )}

      {/* Main Grid */}
      {isConnected && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Balances list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card-surface p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-[var(--foreground)]">USDC Balance</h3>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    Reading from {CHAIN_CONFIGS.length} chain{CHAIN_CONFIGS.length !== 1 ? 's' : ''}
                    {lastRefresh > 0 && (
                      <span className="ml-2 text-[var(--muted-foreground)]">
                        · Last updated {new Date(lastRefresh).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-[var(--foreground)]">
                    ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </div>
                  <div className="text-xs text-[var(--success)] font-semibold flex items-center justify-end gap-1 mt-0.5">
                    <TrendingUp size={12} />
                    Verified Balance
                  </div>
                </div>
              </div>

              {/* Loading state */}
              {isLoading && balances.length === 0 && (
                <div className="flex items-center justify-center gap-3 py-8">
                  <Loader2 className="animate-spin text-[var(--primary)]" size={24} />
                  <p className="text-sm text-[var(--muted-foreground)]">Fetching your latest balance&hellip;</p>
                </div>
              )}

              {/* Balances list */}
              {balances.length > 0 && (
                <div className="space-y-4">
                  {balances.map((chain) => {
                    const percentage = totalBalance > 0 ? (chain.balance / totalBalance) * 100 : 0;
                    return (
                      <div key={chain.chainId} className="space-y-2 p-3 rounded-xl border bg-[var(--background-soft)]/50 border-[var(--border)] hover:border-[var(--primary)] transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${chain.iconColor} flex items-center justify-center text-white font-bold text-xs`}>
                              {chain.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--foreground)]">{chain.name}</div>
                              <div className="text-[10px] text-[var(--muted-foreground)]">{chain.networkType}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-[var(--foreground)]">
                              {chain.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })} <span className="text-[10px] text-[var(--muted-foreground)]">{chain.symbol}</span>
                            </div>
                            {totalBalance > 0 && (
                              <div className="text-[10px] text-[var(--muted-foreground)]">
                                {percentage.toFixed(1)}% of total
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        {totalBalance > 0 && (
                          <div className="w-full h-1.5 bg-[var(--muted)] rounded-md overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${chain.iconColor} rounded-md transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && balances.length > 0 && totalBalance === 0 && (
                <div className="flex items-center gap-2 p-4 rounded-lg border bg-[var(--info-soft)] text-[var(--info)] border-transparent">
                  <Info size={14} className="shrink-0" />
                  <p className="text-xs leading-relaxed">
                    Your wallet has no USDC balance yet. To get started, top up from{' '}
                    <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                      faucet.circle.com
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Wallet Info */}
          <div className="space-y-6">
            {/* Connected Wallet */}
            <div className="card-surface p-6 space-y-4">
              <h3 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                <Wallet size={16} className="text-[var(--primary)]" />
                Connected Wallet
              </h3>
              
              {address && (
                <div className="space-y-3">
                  {/* Address Box */}
                  <div className="flex gap-2">
                    <div className="flex-1 font-mono text-[10px] p-2.5 rounded-lg border bg-[var(--muted-soft)]/30 border-[var(--border)] overflow-x-auto select-all text-[var(--foreground)] h-10 flex items-center">
                      {address}
                    </div>
                    <button 
                      onClick={copyAddress}
                      className="btn-secondary px-3 flex items-center justify-center hover:bg-[var(--muted)]"
                    >
                      {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Account type badge */}
                  <div className="flex items-center gap-2">
                    <span className={`badge text-[10px] px-2 py-0.5 font-semibold ${isSmartAccount ? 'badge-success' : 'badge-primary'}`}>
                      {isSmartAccount ? 'Circle Smart Account' : 'EOA Wallet'}
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">
                      Arc Network
                    </span>
                  </div>

                  {/* Explorer link */}
                  <a
                    href={`https://testnet.arcscan.app/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-[var(--primary)] hover:underline"
                  >
                    <ExternalLink size={12} />
                    View on Arc Explorer
                  </a>
                </div>
              )}
            </div>

            {/* How it works */}
            <div className="card-surface p-6 space-y-4 border border-[var(--border)]">
              <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
                <Info size={16} className="text-[var(--primary)]" />
                How It Works
              </h3>
              <div className="space-y-3 text-xs text-[var(--muted-foreground)] leading-relaxed">
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                  <p>Your balance is read automatically and updated in real time when you connect your account.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                  <p>USDC balances reflect spendable funds available for scheduling payments or investing in bond vaults.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                  <p>Need USDC to get started? Top up from <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-semibold">faucet.circle.com</a></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
