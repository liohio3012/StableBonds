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
  RefreshCw 
} from 'lucide-react';
import { useAccount } from 'wagmi';

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
  const { address: userAddress, isConnected } = useAccount();
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
      alert('Invalid code! Use "123456" for demo authentication.');
      return;
    }

    setAuthStep('authenticating');
    setTimeout(() => {
      setAuthStep('authenticated');
      localStorage.setItem('stablebonds_agent_auth', 'authenticated');
      addLog('success', 'Circle Smart Wallet Auth complete via OTP standard.');
      if (!agentPolicy) {
        // Generate mock agent wallet address
        const mockAgentAddr = '0x66808038E232E8c79949bccD0bc489B74e3ff92e';
        const initialPolicy: AgentPolicy = {
          agentAddress: mockAgentAddr,
          spendingLimit: 2000,
          currentAllocation: 0,
          whitelistedVendors: ['0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF'],
          metadataURI: 'ipfs://rebalancing-agent-007',
          isActive: true
        };
        setAgentPolicy(initialPolicy);
        localStorage.setItem('stablebonds_agent_policy', JSON.stringify(initialPolicy));
        addLog('info', `Autonomous Agent Wallet generated on Arc Testnet: ${mockAgentAddr}`);
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
          const mockAgentAddr = '0x66808038E232E8c79949bccD0bc489B74e3ff92e';
          const initialPolicy: AgentPolicy = {
            agentAddress: mockAgentAddr,
            spendingLimit: 2000,
            currentAllocation: 0,
            whitelistedVendors: ['0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF'],
            metadataURI: 'ipfs://rebalancing-agent-007',
            isActive: true
          };
          setAgentPolicy(initialPolicy);
          localStorage.setItem('stablebonds_agent_policy', JSON.stringify(initialPolicy));
          addLog('info', `Autonomous Agent Wallet generated on Arc Testnet: ${mockAgentAddr}`);
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
    addLog('info', `Autonomous trigger received: agent initiating bond purchase of ${amount} USDC.`);

    // 1. Simulate check compliance
    await new Promise(r => setTimeout(r, 800));
    addLog('info', `Checking compliance whitelists for agent beneficial owner (${userAddress})...`);
    
    // 2. Validate vendor whitelist
    await new Promise(r => setTimeout(r, 800));
    const isVendorOk = agentPolicy.whitelistedVendors.includes(supplier);
    if (!isVendorOk) {
      addLog('error', `Agent Execution Aborted: Vendor address ${supplier} is NOT in the whitelisted vendors policy list.`);
      setIsRunningSim(false);
      return;
    }
    addLog('success', `Vendor validation passed: supplier ${supplier} matches policy whitelist.`);

    // 3. Validate spending policy limits
    await new Promise(r => setTimeout(r, 800));
    const remainingLimit = agentPolicy.spendingLimit - agentPolicy.currentAllocation;
    if (amount > remainingLimit) {
      addLog('error', `Agent Execution Aborted: Bond allocation of ${amount} USDC exceeds remaining limit of ${remainingLimit} USDC (Limit: ${agentPolicy.spendingLimit} USDC).`);
      setIsRunningSim(false);
      return;
    }
    addLog('success', `Allocation limit verification passed: allocation of ${amount} USDC is within policy limits.`);

    // 4. Submit transaction to Arc Testnet
    await new Promise(r => setTimeout(r, 1200));
    const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    
    // Update local allocations
    const newAllocation = agentPolicy.currentAllocation + amount;
    const updatedPolicy = {
      ...agentPolicy,
      currentAllocation: newAllocation
    };
    setAgentPolicy(updatedPolicy);
    localStorage.setItem('stablebonds_agent_policy', JSON.stringify(updatedPolicy));

    // Register a new mock bond so it shows up in dashboard and calendar
    const savedBonds = localStorage.getItem('stablebonds_list');
    const bonds = savedBonds ? JSON.parse(savedBonds) : [];
    
    const termDays = 30;
    const rate = 0.04; // 4% APY
    const newBond = {
      id: bonds.length + 1,
      principal: amount,
      currency: 'USDC',
      termId: 1,
      rate: rate,
      termDays: termDays,
      maturityDate: new Date(Date.now() + termDays * 24 * 60 * 60 * 1000).toISOString(),
      supplier: supplier,
      owner: userAddress,
      agent: agentPolicy.agentAddress,
      isSettled: false,
      txHash: txHash
    };

    bonds.push(newBond);
    localStorage.setItem('stablebonds_list', JSON.stringify(bonds));

    addLog('success', `Bond successfully minted to Treasurer ${userAddress}. principal: ${amount} USDC, agent: ${agentPolicy.agentAddress}`, txHash);
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
                        placeholder="Enter 123456" 
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
                    {userAddress ? `${userAddress.slice(0,6)}...${userAddress.slice(-4)}` : ''}
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

          {/* Biometric Mock Modal overlay */}
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
        <div className="card-surface p-6 flex flex-col h-[520px]">
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

          {/* Console Output */}
          <div className="flex-grow bg-[#0c1017] rounded-xl p-4 font-mono text-xs overflow-y-auto text-green-400 space-y-2 border border-slate-800">
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                <span className="text-gray-500 mr-2">[{log.timestamp}]</span>
                <span className={`font-bold mr-1.5 ${
                  log.type === 'success' ? 'text-green-500' :
                  log.type === 'error' ? 'text-red-500' :
                  log.type === 'warning' ? 'text-amber-500' : 'text-blue-400'
                }`}>
                  {log.type.toUpperCase()}:
                </span>
                <span className="text-slate-100">{log.message}</span>
                {log.txHash && (
                  <div className="text-[10px] text-gray-500 pl-16">
                    tx: <span className="underline select-all">{log.txHash}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

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
                  onClick={() => handleRunSimulation(500, '0x98e1fa94CAcaB856f79CfBa238d983C4beDC3BfF')}
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
                      Simulate Agent Bond Buy ($500)
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
