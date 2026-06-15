"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Copy, Check, RefreshCw, QrCode, ArrowDownLeft, Network, Wallet, TrendingUp, Info, HelpCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Chain interface
interface ChainBalance {
  chainId: string;
  name: string;
  symbol: string;
  balance: number;
  iconColor: string;
  networkType: string;
}

export default function UnifiedBalance() {
  const [isLoading, setIsLoading] = useState(false);
  const [gatewayAddress, setGatewayAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState("5000");
  const [simulateChain, setSimulateChain] = useState("base-sepolia");

  // Load balances from localStorage or default
  const [balances, setBalances] = useState<ChainBalance[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stablebonds_unified_balances');
      if (saved) return JSON.parse(saved);
    }
    return [
      { chainId: "arc-testnet", name: "Arc Testnet", symbol: "USDC", balance: 12500.00, iconColor: "from-blue-500 to-indigo-600", networkType: "Native" },
      { chainId: "arbitrum-sepolia", name: "Arbitrum Sepolia", symbol: "USDC", balance: 8450.50, iconColor: "from-blue-400 to-cyan-500", networkType: "EVM Rollup" },
      { chainId: "base-sepolia", name: "Base Sepolia", symbol: "USDC", balance: 14200.00, iconColor: "from-blue-600 to-sky-400", networkType: "EVM Rollup" },
      { chainId: "ethereum-sepolia", name: "Ethereum Sepolia", symbol: "USDC", balance: 25000.00, iconColor: "from-indigo-400 to-purple-600", networkType: "EVM L1" },
      { chainId: "solana-devnet", name: "Solana Devnet", symbol: "USDC", balance: 5210.30, iconColor: "from-teal-400 to-emerald-500", networkType: "SVM L1" }
    ];
  });

  // Load deposit logs
  const [logs, setLogs] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('stablebonds_gateway_logs');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: "tx_01", timestamp: Date.now() - 4 * 3600000, chain: "Base Sepolia", amount: 2500.00, status: "Settled", txHash: "0x3f5c...921a" },
      { id: "tx_02", timestamp: Date.now() - 28 * 3600000, chain: "Ethereum Sepolia", amount: 15000.00, status: "Settled", txHash: "0xa81c...bb48" },
      { id: "tx_03", timestamp: Date.now() - 52 * 3600000, chain: "Solana Devnet", amount: 3000.00, status: "Settled", txHash: "5Fp2...K9sd" }
    ];
  });

  useEffect(() => {
    localStorage.setItem('stablebonds_unified_balances', JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem('stablebonds_gateway_logs', JSON.stringify(logs));
  }, [logs]);

  // Generate Gateway deposit address
  const handleGenerateAddress = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Deterministic Mock Gateway Address based on Circle Gateway SDK specification
      const mockAddr = "0x88fGwy" + Array.from({ length: 34 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setGatewayAddress(mockAddr);
      setIsLoading(false);
      setShowQR(true);
      toast.success("Circle Gateway deposit address successfully generated!");
    }, 1200);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gatewayAddress);
    setCopied(true);
    toast.success("Gateway address copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Sync / Refresh balances
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Small simulated balance adjustments
      setBalances(prev => prev.map(c => ({
        ...c,
        balance: c.balance + (Math.random() > 0.5 ? 50 : -30)
      })));
      setIsLoading(false);
      toast.success("Balances reconciled with Circle Gateway API");
    }, 800);
  };

  // Simulate Deposit through Gateway
  const handleSimulateDeposit = () => {
    const amountNum = parseFloat(simulateAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid deposit amount");
      return;
    }

    setIsLoading(true);
    const targetChain = balances.find(b => b.chainId === simulateChain);
    
    setTimeout(() => {
      // 1. Update balances state
      setBalances(prev => prev.map(c => {
        if (c.chainId === simulateChain) {
          return { ...c, balance: c.balance + amountNum };
        }
        return c;
      }));

      // 2. Add log entry
      const randomHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("").slice(0,6) + "..." + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("").slice(-4);
      const newLog = {
        id: "tx_" + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        chain: targetChain?.name || "External Chain",
        amount: amountNum,
        status: "Settled",
        txHash: randomHash
      };
      setLogs(prev => [newLog, ...prev]);

      setIsLoading(false);
      toast.success(`Gateway Transfer Settled (<450ms) ✓`, {
        description: `Successfully credited $${amountNum.toLocaleString()} USDC from ${targetChain?.name} into Unified Balance.`
      });
    }, 600);
  };

  // Calculate Total Unified Balance
  const totalBalance = balances.reduce((sum, chain) => sum + chain.balance, 0);

  return (
    <div className="space-y-6">
      {/* Overview and Info Panel */}
      <div className="card-surface p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient from-[var(--primary-soft)] to-transparent opacity-40 pointer-events-none rounded-md translate-x-12 -translate-y-12"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="badge badge-primary text-xs font-semibold px-2 py-1">
              <Sparkles size={11} className="mr-1" />
              Circle Gateway Powered
            </span>
            <h2 className="text-xl font-bold text-[var(--foreground)]">Unified Treasury Balance</h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-xl leading-relaxed">
              Consolidate cross-chain stablecoin liquidity into a single Unified Treasury balance. Deposit capital on Ethereum, Solana, Arbitrum, or Base, and deploy into yield-bearing bonds on Arc in sub-seconds without executing manual bridging.
            </p>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="btn-secondary h-10 w-fit shrink-0 self-start md:self-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Reconcile Balances
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Balances list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-surface p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)]">Aggregated USDC Liquidity</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Aggregating balances from 5 active testnets</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-[var(--foreground)]">
                  ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-[var(--success)] font-semibold flex items-center justify-end gap-1 mt-0.5">
                  <TrendingUp size={12} />
                  Unified Account Active
                </div>
              </div>
            </div>

            {/* Balances list */}
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
                          {chain.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] text-[var(--muted-foreground)]">{chain.symbol}</span>
                        </div>
                        <div className="text-[10px] text-[var(--muted-foreground)]">
                          {percentage.toFixed(1)}% weight
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[var(--muted)] rounded-md overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${chain.iconColor} rounded-md transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Logs */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
              <Network size={16} className="text-[var(--primary)]" />
              Reconciliation & Settlement Logs
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                    <th className="pb-2 font-semibold text-[var(--muted-foreground)]">Transaction ID</th>
                    <th className="pb-2 font-semibold text-[var(--muted-foreground)]">Source Chain</th>
                    <th className="pb-2 font-semibold text-[var(--muted-foreground)]">Amount</th>
                    <th className="pb-2 font-semibold text-[var(--muted-foreground)]">Status</th>
                    <th className="pb-2 font-semibold text-[var(--muted-foreground)]">Reconciliation Tx</th>
                    <th className="pb-2 font-semibold text-[var(--muted-foreground)]">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-[var(--muted-soft)]/20">
                      <td className="py-2.5 font-mono text-[var(--foreground)] font-semibold">{log.id}</td>
                      <td className="py-2.5 text-[var(--foreground)]">{log.chain}</td>
                      <td className="py-2.5 font-semibold text-[var(--foreground)]">${log.amount.toLocaleString()}</td>
                      <td className="py-2.5">
                        <span className="badge badge-success text-[10px] px-1.5 py-0.5 rounded-md font-semibold">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 font-mono text-[var(--muted-foreground)]">{log.txHash}</td>
                      <td className="py-2.5 text-[var(--muted-foreground)]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Gateway Panel */}
        <div className="space-y-6">
          {/* Gateway Deposit generator */}
          <div className="card-surface p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
              <Wallet size={16} className="text-[var(--primary)]" />
              Gateway Deposit Address
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Generate a designated Gateway deposit pool address. Send USDC to this address from Ethereum, Solana, Arbitrum, or Base to credit your unified balance.
            </p>

            {!gatewayAddress ? (
              <button 
                onClick={handleGenerateAddress}
                disabled={isLoading}
                className="btn-primary w-full py-2.5 font-semibold text-sm gap-2"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                Generate Deposit Address
              </button>
            ) : (
              <div className="space-y-4">
                {/* QR Code Container */}
                {showQR && (
                  <div className="flex justify-center p-4 bg-white rounded-xl border border-[var(--border)] max-w-[180px] mx-auto">
                    {/* Simulated SVG QR Code */}
                    <svg viewBox="0 0 100 100" className="w-full h-auto">
                      <rect width="100" height="100" fill="white" />
                      <rect x="10" y="10" width="30" height="30" fill="#111" />
                      <rect x="15" y="15" width="20" height="20" fill="white" />
                      <rect x="18" y="18" width="14" height="14" fill="#111" />
                      <rect x="60" y="10" width="30" height="30" fill="#111" />
                      <rect x="65" y="15" width="20" height="20" fill="white" />
                      <rect x="68" y="18" width="14" height="14" fill="#111" />
                      <rect x="10" y="60" width="30" height="30" fill="#111" />
                      <rect x="15" y="65" width="20" height="20" fill="white" />
                      <rect x="18" y="68" width="14" height="14" fill="#111" />
                      {/* Random noise squares to simulate QR data */}
                      <rect x="45" y="15" width="5" height="15" fill="#111" />
                      <rect x="45" y="35" width="10" height="5" fill="#111" />
                      <rect x="10" y="45" width="15" height="5" fill="#111" />
                      <rect x="35" y="45" width="25" height="5" fill="#111" />
                      <rect x="45" y="60" width="15" height="10" fill="#111" />
                      <rect x="70" y="45" width="10" height="15" fill="#111" />
                      <rect x="60" y="70" width="30" height="5" fill="#111" />
                      <rect x="65" y="80" width="15" height="10" fill="#111" />
                    </svg>
                  </div>
                )}

                {/* Address Box */}
                <div className="flex gap-2">
                  <div className="flex-1 font-mono text-[10px] p-2.5 rounded-lg border bg-[var(--muted-soft)]/30 border-[var(--border)] overflow-x-auto select-all text-[var(--foreground)] h-10 flex items-center">
                    {gatewayAddress}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="btn-secondary px-3 flex items-center justify-center hover:bg-[var(--muted)]"
                  >
                    {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border bg-[var(--info-soft)] text-[var(--info)] border-transparent">
                  <Info size={14} className="shrink-0" />
                  <p className="text-[10px] leading-relaxed">
                    USDC deposits sent to this address are dynamically auto-routed using Circle Gateway. Balance credit is instant.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Simulation console */}
          <div className="card-surface p-6 space-y-4 border border-[var(--border)]">
            <h3 className="font-bold text-sm text-[var(--foreground)] flex items-center gap-2">
              <ArrowDownLeft size={16} className="text-[var(--primary)]" />
              Gateway Deposit Simulator
            </h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Mock a real-time cross-chain transfer to test the instant Gateway settlement engine.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Select Source Network</label>
                <select 
                  value={simulateChain} 
                  onChange={(e) => setSimulateChain(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border bg-[var(--background-soft)] text-xs text-[var(--foreground)] border-[var(--border)] outline-none"
                >
                  <option value="base-sepolia">Base Sepolia</option>
                  <option value="arbitrum-sepolia">Arbitrum Sepolia</option>
                  <option value="ethereum-sepolia">Ethereum Sepolia</option>
                  <option value="solana-devnet">Solana Devnet</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Transfer Amount (USDC)</label>
                <input 
                  type="number" 
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                  className="w-full mt-1 p-2 rounded-lg border bg-[var(--background-soft)] text-xs text-[var(--foreground)] border-[var(--border)] outline-none"
                  placeholder="e.g. 5000"
                />
              </div>

              <button 
                onClick={handleSimulateDeposit}
                disabled={isLoading}
                className="btn-secondary w-full py-2.5 font-semibold text-xs border border-[var(--border)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] hover:border-transparent transition-all gap-2"
              >
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : null}
                Execute Simulated Deposit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
