"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseAbi, parseUnits } from 'viem';
import { toast } from 'sonner';
import { ExternalLink, Shield, HelpCircle, CheckCircle2, Clock, ArrowRight, Info, Wallet, Building2, Calendar, DollarSign, Loader2 } from 'lucide-react';

// Arc Testnet Constants
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"; 
const VAULT_ADDRESS = "0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" as `0x${string}`;

const USDC_ABI = parseAbi(["function approve(address spender, uint256 amount) external returns (bool)"]);
const VAULT_ABI = parseAbi(["function createBondWithIntent(uint256 _amount, uint256 _durationDays, address _supplier, uint32 _destDomain) external"]);

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
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
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
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [destChain, setDestChain] = useState('3');
  const [showPreview, setShowPreview] = useState(false);

  // Web3 Hooks — Approval
  const { data: approveHash, writeContract: writeApprove, isPending: isApproving } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Web3 Hooks — Payment Execution
  const { data: bondHash, writeContract: writeBond, isPending: isBonding } = useWriteContract();
  const { isLoading: isBondConfirming, isSuccess: isBondSuccess } = useWaitForTransactionReceipt({ hash: bondHash });

  // Human-friendly toast messages
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("Balance verified ✓", {
        description: "Your account has enough funds. You can now schedule the payment.",
        action: approveHash ? {
          label: 'View receipt',
          onClick: () => window.open(`https://testnet.arcscan.app/tx/${approveHash}`, '_blank')
        } : undefined
      });
    }
  }, [isApproveSuccess, approveHash]);

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

  // Projected interest calculation
  const yieldBps = 500; 
  const projectedYield = useMemo(() => {
    if (!amount || !duration) return '0.00';
    return (parseFloat(amount) * (yieldBps / 10000) * (parseInt(duration) / 365)).toFixed(2);
  }, [amount, duration]);

  const releaseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(duration || '0'));
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, [duration]);

  const isFormValid = amount && parseFloat(amount) > 0 && supplierAddress && duration;

  const currentStep = isApproveSuccess ? 2 : 1;

  const handleApprove = async () => {
    try {
      if (!publicClient || !address) return;
      
      const { request } = await publicClient.simulateContract({
        account: address,
        address: USDC_ADDRESS,
        abi: USDC_ABI,
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
    try {
      if (!publicClient || !address) return;
      
      const { request } = await publicClient.simulateContract({
        account: address,
        address: VAULT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'createBondWithIntent',
        args: [parseUnits(amount, 6), BigInt(duration), supplierAddress as `0x${string}`, parseInt(destChain)],
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
  };

  // Not connected state
  if (!isConnected) {
    return (
      <div className="w-full max-w-2xl mx-auto card-surface p-8 md:p-12 text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
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
                Your money will be held securely and earn <strong>5% interest per year</strong>. On the date you choose, 
                the full amount is automatically sent to your vendor. No reminders, no manual transfers — it just works.
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {/* Amount Input */}
            <div>
              <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                <DollarSign size={14} style={{ color: 'var(--primary)' }} />
                How much do you want to pay?
                <Tooltip text="Enter the total amount you want to send to your vendor. This amount will earn interest until the due date." />
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
                  USD
                </span>
              </div>

              {/* Interest Preview — Dynamic */}
              {amount && parseFloat(amount) > 0 && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs animate-fade-in"
                  style={{ background: 'var(--success-soft)', border: '1px solid var(--success-border)' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--success)' }} />
                  <span style={{ color: 'var(--success-foreground)' }}>
                    You'll earn approximately <strong className="font-bold">${projectedYield}</strong> in interest before the due date
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Duration */}
              <div>
                <label className="flex items-center gap-1 text-sm font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                  <Calendar size={14} style={{ color: 'var(--primary)' }} />
                  When should the vendor be paid?
                  <Tooltip text="Choose how many days from today the payment should be delivered. The longer you wait, the more interest you earn." />
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="30"
                    className="input-field pr-16 font-medium"
                    id="payment-duration"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium"
                    style={{ color: 'var(--muted-foreground)' }}>
                    days
                  </span>
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
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>${parseFloat(amount).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Interest you'll earn</span>
                      <span className="font-semibold" style={{ color: 'var(--success)' }}>+${projectedYield} USD</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Delivery date</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{releaseDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted-foreground)' }}>Vendor receives</span>
                      <span className="font-semibold" style={{ color: 'var(--foreground)' }}>${parseFloat(amount).toLocaleString()} USD</span>
                    </div>
                    <div className="pt-2 mt-2" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="flex justify-between">
                        <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Your net benefit</span>
                        <span className="font-bold" style={{ color: 'var(--success)' }}>+${projectedYield} USD earned</span>
                      </div>
                    </div>
                  </div>

                  {/* What Happens Next */}
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--muted-foreground)' }}>What happens next?</p>
                    <div className="space-y-2">
                      {[
                        "Your funds will be securely held in a protected account",
                        `You'll earn ~$${projectedYield} in interest over ${duration} days`,
                        `On ${releaseDate}, the vendor automatically receives $${parseFloat(amount || '0').toLocaleString()}`,
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
          {bondHash && (
            <div className="mt-8 banner-success flex items-center justify-between animate-slide-up">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success-foreground)' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>
                  <strong>Payment confirmed!</strong> 
                  <span className="ml-1 opacity-70">Receipt: {bondHash.slice(0,8)}…{bondHash.slice(-6)}</span>
                </span>
              </div>
              <a 
                href={`https://testnet.arcscan.app/tx/${bondHash}`} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-semibold hover:underline shrink-0"
                style={{ color: 'var(--success-foreground)' }}
              >
                View details <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ borderTop: '1px solid var(--border)', background: 'var(--muted)' }}>
          <div className="flex flex-col">
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {isApproveSuccess ? "Funds verified — ready to schedule!" : "Two quick steps to schedule"}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              {isApproveSuccess 
                ? "Click 'Schedule Payment' to lock in your interest and set the delivery date." 
                : "First we'll check your balance, then you confirm the schedule."}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Step 1 Button */}
            <button 
              onClick={handleApprove}
              disabled={isApproving || isApproveConfirming || isApproveSuccess || !isConnected || !isFormValid}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isApproveSuccess 
                  ? 'border text-[var(--success-foreground)]' 
                  : 'btn-secondary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              style={isApproveSuccess ? { 
                background: 'var(--success-soft)', 
                borderColor: 'var(--success-border)', 
                color: 'var(--success-foreground)' 
              } : {}}
              id="btn-verify"
            >
              {isApproveConfirming ? (
                <><Loader2 size={14} className="animate-spin" /> Checking...</>
              ) : isApproveSuccess ? (
                <><CheckCircle2 size={14} /> Balance verified</>
              ) : (
                <>Step 1: Check balance</>
              )}
            </button>

            {/* Step 2 Button */}
            <button 
              onClick={handleExecute}
              disabled={!isApproveSuccess || isBonding || isBondConfirming || !isConnected}
              className="w-full sm:w-auto btn-primary px-6 py-2.5 gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              id="btn-schedule"
            >
              {isBondConfirming ? (
                <><Loader2 size={14} className="animate-spin" /> Scheduling...</>
              ) : (
                <>Step 2: Schedule Payment <ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
