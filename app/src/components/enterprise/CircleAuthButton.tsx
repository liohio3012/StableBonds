"use client";

import React, { useState } from 'react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import { useAccount, useDisconnect } from 'wagmi';
import { Fingerprint, Mail, LogOut, Copy, ChevronDown, User, Loader2, Wallet, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CircleAuthButton() {
  const { 
    account, 
    session, 
    loading: circleLoading, 
    registerWithPasskey, 
    loginWithPasskey, 
    sendEmailOTP, 
    verifyEmailOTP, 
    logout 
  } = useCircleAuth();

  const { isConnected, address: eoaAddress } = useAccount();
  const { disconnect: disconnectEOA } = useDisconnect();

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<'select' | 'email' | 'otp' | 'register'>('select');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePasskeyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    setSubmitting(true);
    try {
      await registerWithPasskey(username);
      setShowModal(false);
      setStep('select');
    } catch (err) {
      // Error is handled in context toast
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setSubmitting(true);
    try {
      await loginWithPasskey();
      setShowModal(false);
    } catch (err) {
      // Error is handled in context toast
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const sent = await sendEmailOTP(email);
      if (sent) {
        setStep('otp');
      }
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setSubmitting(true);
    try {
      await verifyEmailOTP(email, otp);
      setShowModal(false);
      setStep('select');
      setOtp('');
    } catch (err) {
      // Error handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  // Connected via Circle Smart Account
  if (account && session) {
    const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
    return (
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm font-medium hover:bg-[var(--muted)] transition-colors cursor-pointer bg-white"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs font-semibold bg-[var(--primary)]">
            {session.type === 'passkey' ? <Fingerprint size={12} /> : <User size={12} />}
          </div>
          <div className="text-left hidden md:block">
            <div className="font-medium text-xs leading-none text-[var(--foreground)]">{session.username}</div>
            <div className="text-[10px] text-[var(--muted-foreground)] font-mono mt-0.5">{shortAddress}</div>
          </div>
          <span className="badge badge-success text-[9px] py-0 px-1.5">SCA</span>
          <ChevronDown size={14} className="text-[var(--muted-foreground)]" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-white p-4 shadow-lg z-50 animate-fade-in"
            style={{ borderColor: 'var(--border)' }}>
            <div className="mb-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Smart Account</div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="font-mono text-xs text-[var(--foreground)] break-all select-all">{account.address}</span>
                <button 
                  onClick={() => handleCopy(account.address)}
                  className="p-1 rounded hover:bg-[var(--muted)] transition-colors text-[var(--muted-foreground)] cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-[var(--muted-foreground)] mb-4">
              <div className="flex justify-between">
                <span>Auth Method</span>
                <span className="font-medium text-[var(--foreground)] capitalize">{session.type}</span>
              </div>
              {session.email && (
                <div className="flex justify-between">
                  <span>Email</span>
                  <span className="font-medium text-[var(--foreground)] truncate max-w-[120px]">{session.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Network</span>
                <span className="font-medium text-[var(--foreground)]">Arc Testnet</span>
              </div>
              <div className="flex justify-between">
                <span>Gas Fees</span>
                <span className="font-medium text-[var(--success)]">Sponsored</span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md border text-xs font-medium hover:bg-[var(--danger-soft)] text-[var(--danger)] cursor-pointer bg-white transition-colors"
              style={{ borderColor: 'var(--danger-border)' }}
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Sign In button
  return (
    <>
      <button 
        onClick={() => { setShowModal(true); setStep('select'); }}
        className="btn-primary text-xs gap-1.5 px-3 py-1.5"
      >
        <Fingerprint size={14} />
        Sign In
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-xl border p-6 shadow-lg animate-scale-in relative"
            style={{ borderColor: 'var(--border)' }}>
            
            <button 
              onClick={() => { setShowModal(false); setStep('select'); }}
              className="absolute right-4 top-4 p-1 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>

            {/* Step: Selection */}
            {step === 'select' && (
              <div className="text-center pt-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-4 bg-[var(--primary)] text-[var(--primary-foreground)]">
                  <Fingerprint size={20} />
                </div>
                <h3 className="font-semibold text-base text-[var(--foreground)]">Sign in to StablePay</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-1 mb-6">
                  Gasless smart account. No seed phrases required.
                </p>

                <div className="space-y-2.5">
                  <button 
                    onClick={handlePasskeyLogin}
                    disabled={submitting}
                    className="btn-primary w-full gap-2 py-2.5"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                    Sign In with Passkey
                  </button>

                  <button 
                    onClick={() => setStep('register')}
                    className="btn-secondary w-full gap-2 py-2.5"
                  >
                    Register New Passkey
                  </button>

                  <button 
                    onClick={() => setStep('email')}
                    className="btn-secondary w-full gap-2 py-2.5"
                  >
                    <Mail size={16} />
                    Sign In with Email OTP
                  </button>
                </div>

                <div className="relative flex py-3 items-center mt-2">
                  <div className="flex-grow border-t" style={{ borderColor: 'var(--border)' }}></div>
                  <span className="flex-shrink mx-4 text-[10px] text-[var(--muted-foreground)] font-semibold uppercase tracking-wider">Web3 Option</span>
                  <div className="flex-grow border-t" style={{ borderColor: 'var(--border)' }}></div>
                </div>

                <p className="text-[11px] text-[var(--muted-foreground)] leading-normal">
                  Connect external wallet via the &quot;Connect&quot; button in the navigation bar.
                </p>
              </div>
            )}

            {/* Step: Passkey Register */}
            {step === 'register' && (
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">Create Passkey Account</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  Set up a secure biometric passkey stored only on your device.
                </p>

                <form onSubmit={handlePasskeyRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">Username</label>
                    <input 
                      type="text" required
                      placeholder="e.g., alice_treasury"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button type="button" onClick={() => setStep('select')} className="btn-secondary flex-1 py-2 text-xs">Back</button>
                    <button type="submit" disabled={submitting || !username} className="btn-primary flex-1 py-2 text-xs gap-1.5">
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Register
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step: Email */}
            {step === 'email' && (
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">Sign In with Email</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  We&apos;ll send a one-time code to generate your smart account.
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">Email Address</label>
                    <input 
                      type="email" required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button type="button" onClick={() => setStep('select')} className="btn-secondary flex-1 py-2 text-xs">Back</button>
                    <button type="submit" disabled={submitting || !email} className="btn-primary flex-1 py-2 text-xs gap-1.5">
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Send Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step: OTP */}
            {step === 'otp' && (
              <div>
                <h3 className="font-semibold text-sm text-[var(--foreground)] mb-1">Verify Code</h3>
                <p className="text-xs text-[var(--muted-foreground)] mb-4">
                  Enter the 6-digit code sent to <strong className="text-[var(--foreground)]">{email}</strong>.
                </p>

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--foreground)] mb-1.5">Verification Code</label>
                    <input 
                      type="text" required
                      maxLength={6} pattern="\d{6}" placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="input-field tracking-widest text-center font-semibold"
                    />
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5">
                      Test code: <strong className="text-[var(--foreground)]">123456</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 pt-1">
                    <button type="button" onClick={() => setStep('email')} className="btn-secondary flex-1 py-2 text-xs">Back</button>
                    <button type="submit" disabled={submitting || otp.length !== 6} className="btn-primary flex-1 py-2 text-xs gap-1.5">
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Verify
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
