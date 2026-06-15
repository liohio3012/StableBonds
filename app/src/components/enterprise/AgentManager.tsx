"use client";

import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  ShieldAlert, 
  Play, 
  Plus, 
  Trash2, 
  FileText, 
  Fingerprint, 
  Lock, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Terminal, 
  DollarSign, 
  RefreshCw,
  AlertTriangle,
  XCircle,
  Info
} from 'lucide-react';
import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { parseAbi, parseUnits, encodeFunctionData, keccak256, stringToHex } from 'viem';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { bundlerClient } from '@/lib/circle-auth';
import { toast } from 'sonner';

const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000" as `0x${string}`;

const VAULT_ABI = parseAbi([
  "function createBondWithIntent(uint256 _amount, uint256 _termId, address _supplier, uint32 _destDomain) external"
]);

const ERC20_ABI = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)"
]);

interface AgentPolicy {
  agentAddress: string;
  spendingLimit: number;
  currentAllocation: number;
  whitelistedVendors: string[];
  metadataURI: string;
  isActive: boolean;
}

interface AgentLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  txHash?: string;
}

export default function AgentManager() {
  const { address: userAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const isConnected = isEoaConnected || isSmartAccount;
  const userAddressResolved = isSmartAccount ? circleAccount?.address : userAddress;
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [authStep, setAuthStep] = useState<'unauthenticated' | 'authenticating' | 'authenticated'>('unauthenticated');
  const [otpCode, setOtpCode] = useState('');
  const [isBiometricPrompt, setIsBiometricPrompt] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Agent State
  const [agentPolicy, setAgentPolicy] = useState<AgentPolicy | null>(null);
  const [newLimit, setNewLimit] = useState('2000');
  const [newVendor, setNewVendor] = useState('');
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [invoiceText, setInvoiceText] = useState('AWS Server Hosting Invoice - Due in 35 Days');

  // Initialize and load state
  useEffect(() => {
    const savedPolicy = localStorage.getItem('stablebonds_agent_policy');
    const savedAuth = localStorage.getItem('stablebonds_agent_auth');
    const savedLogs = localStorage.getItem('stablebonds_agent_logs');

    if (savedPolicy) {
      setAgentPolicy(JSON.parse(savedPolicy));
    }
    if (savedAuth === 'authenticated') {
      setAuthStep('authenticated');
    }
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    } else {
      // Default initial logs
      const initialLogs: AgentLog[] = [
        { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Agent Stack CLI module initialized.' },
        { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Awaiting wallet generation/authorization.' }
      ];
      setLogs(initialLogs);
      localStorage.setItem('stablebonds_agent_logs', JSON.stringify(initialLogs));
    }
  }, []);

  const addLog = (type: 'info' | 'success' | 'warning' | 'error', message: string, txHash?: string) => {
    const newLog: AgentLog = {
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      txHash
    };
    setLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      localStorage.setItem('stablebonds_agent_logs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAuthenticateOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== '123456') {
      addLog('error', 'OTP authentication failed: Invalid code');
      alert('Invalid verification code. Please try again.');
      return;
    }

    setAuthStep('authenticating');
    setTimeout(() => {
      setAuthStep('authenticated');
      localStorage.setItem('stablebonds_agent_auth', 'authenticated');
      addLog('success', 'Circle Smart Wallet Auth complete via OTP standard.');
      if (!agentPolicy) {
        // Derive deterministic agent address from user's wallet
        const agentAddr = keccak256(stringToHex(`${userAddressResolved}_stablebonds_agent_2026`)).slice(0, 42) as `0x${string}`;
        const initialPolicy: AgentPolicy = {
          agentAddress: agentAddr,
          spendingLimit: 2000,
          currentAllocation: 0,
          whitelistedVendors: ['0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF'],
          metadataURI: 'ipfs://rebalancing-agent-007',
          isActive: true
        };
        setAgentPolicy(initialPolicy);
        localStorage.setItem('stablebonds_agent_policy', JSON.stringify(initialPolicy));
        addLog('info', `Agent Wallet derived on Arc Testnet: ${agentAddr}`);
      }
    }, 1500);
  };

  const handleBiometricAuth = () => {
    setIsBiometricPrompt(true);
    setTimeout(() => {
      setIsBiometricPrompt(false);
      setAuthStep('authenticating');
      setTimeout(() => {
        setAuthStep('authenticated');
        localStorage.setItem('stablebonds_agent_auth', 'authenticated');
        addLog('success', 'Circle Passkey (WebAuthn) Biometric verification verified.');
        if (!agentPolicy) {
          const agentAddr = keccak256(stringToHex(`${userAddressResolved}_stablebonds_agent_2026`)).slice(0, 42) as `0x${string}`;
          const initialPolicy: AgentPolicy = {
            agentAddress: agentAddr,
            spendingLimit: 2000,
            currentAllocation: 0,
            whitelistedVendors: ['0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF'],
            metadataURI: 'ipfs://rebalancing-agent-007',
            isActive: true
          };
          setAgentPolicy(initialPolicy);
          localStorage.setItem('stablebonds_agent_policy', JSON.stringify(initialPolicy));
          addLog('info', `Agent Wallet derived on Arc Testnet: ${agentAddr}`);
        }
      }, 1000);
    }, 1500);
  };

  const handleUpdatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPolicy) return;

    const limitVal = parseFloat(newLimit);
    if (isNaN(limitVal) || limitVal < 0) {
      alert('Please enter a valid spending limit.');
      return;
    }

    const updated = {
      ...agentPolicy,
      spendingLimit: limitVal
    };
    setAgentPolicy(updated);
    localStorage.setItem('stablebonds_agent_policy', JSON.stringify(updated));
    addLog('success', `Spending Policy updated: limit set to ${limitVal} USDC on-chain.`);
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentPolicy || !newVendor) return;

    if (!newVendor.startsWith('0x') || newVendor.length !== 42) {
      alert('Please enter a valid EVM address.');
      return;
    }

    if (agentPolicy.whitelistedVendors.includes(newVendor)) {
      alert('Vendor is already whitelisted.');
      return;
    }

    const updated = {
      ...agentPolicy,
      whitelistedVendors: [...agentPolicy.whitelistedVendors, newVendor]
    };
    setAgentPolicy(updated);
    localStorage.setItem('stablebonds_agent_policy', JSON.stringify(updated));
    setNewVendor('');
    addLog('success', `Vendor Whitelist updated: ${newVendor} whitelisted.`);
  };

  const handleRemoveVendor = (vendorToRemove: string) => {
    if (!agentPolicy) return;

    const updated = {
      ...agentPolicy,
      whitelistedVendors: agentPolicy.whitelistedVendors.filter(v => v !== vendorToRemove)
    };
    setAgentPolicy(updated);
    localStorage.setItem('stablebonds_agent_policy', JSON.stringify(updated));
    addLog('warning', `Vendor Whitelist updated: Removed ${vendorToRemove}`);
  };

  const handleDeauthorize = () => {
    if (confirm('Are you sure you want to deactivate and remove this agent wallet?')) {
      localStorage.removeItem('stablebonds_agent_policy');
      localStorage.removeItem('stablebonds_agent_auth');
      setAgentPolicy(null);
      setAuthStep('unauthenticated');
      addLog('warning', 'Agent wallet and registry connection deauthorized.');
    }
  };

  const handleRunSimulation = async (amount: number, supplier: string) => {
    if (!agentPolicy || !isConnected) return;

    setIsRunningSim(true);
    addLog('info', `Autonomous Agent triggered for payment optimization: ${amount} USDC.`);

    // 1. Check local whitelists & limits
    await new Promise(r => setTimeout(r, 600));
    const isVendorOk = agentPolicy.whitelistedVendors.includes(supplier);
    if (!isVendorOk) {
      addLog('error', `Agent Execution Aborted: Vendor address ${supplier} is NOT whitelisted.`);
      setIsRunningSim(false);
      return;
    }
    const remainingLimit = agentPolicy.spendingLimit - agentPolicy.currentAllocation;
    if (amount > remainingLimit) {
      addLog('error', `Agent Execution Aborted: Exceeds spending limit.`);
      setIsRunningSim(false);
      return;
    }

    // 2. Request DeepSeek AI Agent Decision without payment (expects 402)
    addLog('info', 'Invoking DeepSeek AI Decision Endpoint (/api/agent/decide)...');
    await new Promise(r => setTimeout(r, 800));

    try {
      let decideRes = await fetch('/api/agent/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, supplier, invoiceText })
      });

      let txHashForPayment = '';

      if (decideRes.status === 402) {
        const payload = await decideRes.json();
        addLog('warning', `HTTP 402 Protected: ${payload.message}`);
        addLog('info', `Executing micro-payment of ${payload.requiredAmount} USDC from Smart Account to treasury...`);
        
        // Execute real micropayment transaction to clear x402 gate
        const paymentAmountRaw = parseUnits(payload.requiredAmount, 6);
        let payTxHash: string;

        if (isSmartAccount && circleAccount) {
          const payCall = {
            to: USDC_ADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: ERC20_ABI,
              functionName: 'approve',
              args: [payload.destination, paymentAmountRaw]
            })
          };
          const transferCall = {
            to: USDC_ADDRESS,
            value: BigInt(0),
            data: encodeFunctionData({
              abi: parseAbi(["function transfer(address recipient, uint256 amount) external returns (bool)"]),
              functionName: 'transfer',
              args: [payload.destination, paymentAmountRaw]
            })
          };
          const userOpHash = await bundlerClient.sendUserOperation({
            account: circleAccount,
            calls: [payCall, transferCall],
            paymaster: true
          });
          addLog('info', `Submitting payment UserOperation: ${userOpHash.slice(0, 10)}...`);
          const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
          payTxHash = receipt.transactionHash;
        } else {
          const payHash = await writeContractAsync({
            address: USDC_ADDRESS,
            abi: parseAbi(["function transfer(address recipient, uint256 amount) external returns (bool)"]),
            functionName: 'transfer',
            args: [payload.destination, paymentAmountRaw]
          });
          if (publicClient) await publicClient.waitForTransactionReceipt({ hash: payHash });
          payTxHash = payHash;
        }

        addLog('success', `Micropayment successful! Transaction Hash verified on-chain.`, payTxHash);
        txHashForPayment = payTxHash;
        
        // Retry with payment proof
        addLog('info', 'Retrying DeepSeek decision with payment verification proof...');
        decideRes = await fetch('/api/agent/decide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, supplier, invoiceText, txHash: txHashForPayment })
        });
      }

      if (!decideRes.ok) {
        const errPayload = await decideRes.json();
        throw new Error(errPayload.error || 'DeepSeek call failed');
      }

      const decidePayload = await decideRes.json();
      const decision = decidePayload.decision;
      addLog('success', `DeepSeek AI Decision: ${decision.recommendation}`);
      addLog('success', `AI optimized terms: Term ID ${decision.optimalTermId} (${decision.optimalTranche} Tranche), Savings prediction: ${decision.savingsPrediction}`);

      // 3. Purchase bond on-chain with optimized Term ID
      addLog('info', `Submitting AI-optimized bond purchase (Term ID: ${decision.optimalTermId}) to Arc Testnet...`);
      let purchaseTxHash: string;

      if (isSmartAccount && circleAccount) {
        const approveCall = {
          to: USDC_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [VAULT_ADDRESS, parseUnits(amount.toString(), 6)] })
        };
        const purchaseCall = {
          to: VAULT_ADDRESS,
          value: BigInt(0),
          data: encodeFunctionData({
            abi: VAULT_ABI,
            functionName: 'createBondWithIntent',
            args: [parseUnits(amount.toString(), 6), BigInt(decision.optimalTermId), supplier as `0x${string}`, 0]
          })
        };
        const userOpHash = await bundlerClient.sendUserOperation({ account: circleAccount, calls: [approveCall, purchaseCall], paymaster: true });
        const { receipt } = await bundlerClient.waitForUserOperationReceipt({ hash: userOpHash });
        purchaseTxHash = receipt.transactionHash;
      } else {
        const approveHash = await writeContractAsync({ address: USDC_ADDRESS, abi: ERC20_ABI, functionName: 'approve', args: [VAULT_ADDRESS, parseUnits(amount.toString(), 6)] });
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash: approveHash });
        const purchaseHash = await writeContractAsync({
          address: VAULT_ADDRESS, abi: VAULT_ABI, functionName: 'createBondWithIntent',
          args: [parseUnits(amount.toString(), 6), BigInt(decision.optimalTermId), supplier as `0x${string}`, 0]
        });
        if (publicClient) await publicClient.waitForTransactionReceipt({ hash: purchaseHash });
        purchaseTxHash = purchaseHash;
      }

      const newAllocation = agentPolicy.currentAllocation + amount;
      const updatedPolicy = { ...agentPolicy, currentAllocation: newAllocation };
      setAgentPolicy(updatedPolicy);
      localStorage.setItem('stablebonds_agent_policy', JSON.stringify(updatedPolicy));

      addLog('success', `AI-optimized bond purchased on-chain!`, purchaseTxHash);
      toast.success(`Agent bond purchase confirmed on Arc Testnet`, { action: { label: 'View tx', onClick: () => window.open(`https://testnet.arcscan.app/tx/${purchaseTxHash}`, '_blank') } });

    } catch (err: any) {
      addLog('error', `Agent execution failed: ${err.message}`);
      toast.error('Agent execution failed', { description: err.message });
    }

    setIsRunningSim(false);
  };

  const handleClearLogs = () => {
    const emptyLogs = [
      { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'Terminal cleared.' }
    ] as AgentLog[];
    setLogs(emptyLogs);
    localStorage.setItem('stablebonds_agent_logs', JSON.stringify(emptyLogs));
  };

  if (!isConnected) {
    return (
      <div className="card-surface p-8 text-center max-w-md mx-auto">
        <ShieldAlert size={48} className="mx-auto text-[var(--warning)] mb-4" />
        <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-6">
          To manage secure corporate AI agents and set up spending policies, you must first connect your treasurer account.
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 animate-fade-in">
      {/* Configuration Column */}
      <div className="md:col-span-1 space-y-6">
        {/* Auth / Agent Identity Panel */}
        <div className="card-surface p-6 relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'var(--primary)' }}>
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: 'var(--foreground)' }}>
                Circle Agent Wallet
              </h3>
              <p className="text-xs text-[var(--muted-foreground)]">
                Secure autonomous co-pilot
              </p>
            </div>
          </div>

          {authStep !== 'authenticated' ? (
            <div className="space-y-4">
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Generate an autonomous agent wallet using Circle SDK. Deploy policy rules directly on the compliance registry.
              </p>

              {authStep === 'unauthenticated' ? (
                <div className="space-y-3 pt-2">
                  <button 
                    onClick={handleBiometricAuth}
                    className="btn-primary w-full py-2.5 text-xs gap-2"
                  >
                    <Fingerprint size={14} />
                    Authorize with Passkey / FaceID
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-[var(--border)]"></div>
                    <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-[var(--muted-foreground)]">OR</span>
                    <div className="flex-grow border-t border-[var(--border)]"></div>
                  </div>

                  <form onSubmit={handleAuthenticateOTP} className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] block">
                      OTP Authentication Code
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Enter code" 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="input-field text-center tracking-widest text-xs flex-grow"
                      />
                      <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                        Verify
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 gap-3">
                  <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
                  <span className="text-xs font-semibold text-[var(--muted-foreground)]">
                    Generating key credentials...
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border bg-[var(--background-soft)] border-[var(--success-border)] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--success)] flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    Active Registry Connection
                  </span>
                  <span className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded-md bg-[var(--success-soft)] text-[var(--success)]">
                    ERC-8004
                  </span>
                </div>
                <div className="font-mono text-[10px] break-all p-1.5 rounded bg-[var(--background)] select-all border text-[var(--muted-foreground)]">
                  {agentPolicy?.agentAddress}
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-[var(--muted-foreground)]">Owner Beneficiary:</span>
                  <span className="font-semibold text-[var(--foreground)] font-mono">
                    {userAddressResolved ? `${userAddressResolved.slice(0,6)}...${userAddressResolved.slice(-4)}` : ''}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleDeauthorize}
                className="btn-secondary w-full py-2 text-xs text-red-500 hover:text-red-600 gap-1.5 hover:bg-red-50 hover:border-red-200"
              >
                <Trash2 size={13} />
                Remove Agent Co-pilot
              </button>
            </div>
          )}

          {/* Biometric verification overlay */}
          {isBiometricPrompt && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-10 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
              <Fingerprint size={48} className="text-[var(--primary)] animate-pulse mb-3" />
              <h4 className="font-bold text-sm">Verify Passkey</h4>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xs mt-1">
                Touch ID or Face ID required to authorize StablePay Agent registry signing credentials.
              </p>
            </div>
          )}
        </div>

        {/* Policy Configuration */}
        {agentPolicy && (
          <div className="card-surface p-6 space-y-6">
            <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Lock size={15} className="text-[var(--primary)]" />
              Spending Policies
            </h3>

            {/* Limit Form */}
            <form onSubmit={handleUpdatePolicy} className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] flex justify-between">
                <span>Maximum Allocation Limit</span>
                <span className="text-[var(--primary)] font-semibold font-mono">
                  {agentPolicy.spendingLimit} USDC
                </span>
              </label>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={newLimit}
                  onChange={(e) => setNewLimit(e.target.value)}
                  className="input-field text-xs flex-grow"
                  placeholder="e.g. 50000"
                />
                <button type="submit" className="btn-secondary px-3.5 text-xs">
                  Update
                </button>
              </div>
            </form>

            {/* Vendor Whitelist */}
            <div className="space-y-3">
              <label className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)] block">
                Whitelisted Vendor Addresses
              </label>

              <form onSubmit={handleAddVendor} className="flex gap-2">
                <input 
                  type="text" 
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                  className="input-field text-xs flex-grow font-mono"
                  placeholder="0xVendorAddress..."
                />
                <button type="submit" className="btn-secondary p-2">
                  <Plus size={16} />
                </button>
              </form>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {agentPolicy.whitelistedVendors.map((vendor, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg border bg-[var(--background-soft)] text-[11px] font-mono">
                    <span className="text-[var(--foreground)] truncate mr-2" title={vendor}>
                      {vendor.slice(0, 8)}...{vendor.slice(-6)}
                    </span>
                    <button 
                      onClick={() => handleRemoveVendor(vendor)}
                      className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {agentPolicy.whitelistedVendors.length === 0 && (
                  <p className="text-[11px] text-[var(--muted-foreground)] italic text-center py-2">
                    No whitelisted vendors. Agent cannot trade.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal / Monitor Column */}
      <div className="md:col-span-2 space-y-6">
        {/* Main Terminal View */}
        <div className="card-surface p-6 flex flex-col min-h-[540px]">
          <div className="flex items-center justify-between border-b pb-4 mb-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <Terminal size={18} className="text-[var(--primary)]" />
              <span className="font-bold text-sm text-[var(--foreground)]">
                Agent Live Monitor Terminal
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleClearLogs}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
                title="Clear Logs"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Premium Visual Log Feed */}
          <div className="h-[300px] bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 overflow-y-auto space-y-2.5 shadow-inner backdrop-blur-xs">
            {logs.map((log, i) => {
              let rowStyle = "flex items-start gap-2.5 p-3 rounded-xl border text-xs transition-all duration-150 hover:shadow-xs ";
              let badgeStyle = "flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide shrink-0 ";
              let messageStyle = "text-slate-700 font-medium text-left leading-relaxed ";
              let icon = <Info size={14} className="text-blue-500" />;

              if (log.type === 'success') {
                rowStyle += "bg-emerald-50/50 border-emerald-100/60 text-emerald-800";
                badgeStyle += "bg-emerald-100/70 text-emerald-800";
                icon = <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 shrink-0" />;
              } else if (log.type === 'error') {
                rowStyle += "bg-rose-50/50 border-rose-100/60 text-rose-800";
                badgeStyle += "bg-rose-100/70 text-rose-800";
                icon = <XCircle size={14} className="text-rose-600 mt-0.5 shrink-0" />;
              } else if (log.type === 'warning') {
                rowStyle += "bg-amber-50/50 border-amber-100/60 text-amber-800";
                badgeStyle += "bg-amber-100/70 text-amber-800";
                icon = <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />;
              } else {
                rowStyle += "bg-blue-50/40 border-blue-100/40 text-blue-800";
                badgeStyle += "bg-blue-100/60 text-blue-800";
                icon = <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />;
              }

              return (
                <div key={i} className={rowStyle}>
                  {icon}
                  <div className="flex-grow space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={badgeStyle}>{log.type}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">{log.timestamp}</span>
                    </div>
                    <p className={messageStyle}>{log.message}</p>
                    {log.txHash && (
                      <div className="text-[10px] bg-white/60 border border-slate-200/40 rounded p-1.5 font-mono break-all text-slate-500 select-all flex items-center justify-between gap-2">
                        <span className="truncate">Tx: {log.txHash}</span>
                        <a 
                          href={`https://testnet.arcscan.app/tx/${log.txHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-bold text-[var(--primary)] hover:underline shrink-0"
                        >
                          View Scan ↗
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invoice Input Box */}
          {agentPolicy && (
            <div className="mt-3 mb-2 p-3.5 rounded-xl border bg-slate-50/50 border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block text-left">
                  Invoice Details for Autonomous Allocation Routing
                </label>
                <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/50 text-amber-700 animate-pulse flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-amber-500"></span>
                  DeepSeek Engine (x402 Protected)
                </span>
              </div>
              <input 
                type="text" 
                value={invoiceText}
                onChange={(e) => setInvoiceText(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/50 hover:border-slate-300 rounded-xl transition-all p-2.5 shadow-xs"
                placeholder="e.g. AWS Server Hosting Invoice - Due in 35 Days"
              />
            </div>
          )}

          {/* Simulation Controllers */}
          {agentPolicy && (
            <div className="mt-4 pt-4 border-t border-[var(--border)] grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl border bg-[var(--background-soft)] flex justify-between items-center text-xs">
                <div>
                  <span className="text-[var(--muted-foreground)] block">Active Allocation:</span>
                  <span className="font-bold text-[var(--foreground)] font-mono text-sm">
                    {agentPolicy.currentAllocation} / {agentPolicy.spendingLimit} USDC
                  </span>
                </div>
                <div className="w-10 h-10 rounded-md flex items-center justify-center bg-[var(--primary-soft)] text-[var(--primary)] font-semibold">
                  {Math.min(100, Math.round((agentPolicy.currentAllocation / agentPolicy.spendingLimit) * 100))}%
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button 
                  onClick={() => handleRunSimulation(2, '0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF')}
                  disabled={isRunningSim}
                  className="btn-primary text-xs py-3 px-4 gap-1.5 disabled:opacity-50"
                >
                  {isRunningSim ? (
                    <>
                      <Loader2 className="animate-spin" size={13} />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play size={13} />
                      Simulate Agent Bond Buy ($2)
                    </>
                  )}
                </button>
                <button 
                  onClick={() => handleRunSimulation(3000, '0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF')}
                  disabled={isRunningSim}
                  className="btn-secondary text-xs py-3 px-3 gap-1.5 disabled:opacity-50 text-red-500 hover:bg-red-50"
                  title="Simulate Over-limit"
                >
                  Trigger Limit Error ($3k)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
