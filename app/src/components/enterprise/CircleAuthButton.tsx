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

  // If connected via Circle Smart Account (MSCA)
  if (account && session) {
    const shortAddress = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
    return (
      <div className="relative">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-neutral-50 transition-all cursor-pointer bg-white"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold"
            style={{ background: 'var(--primary)' }}>
            {session.type === 'passkey' ? <Fingerprint size={12} /> : <User size={12} />}
          </div>
          <div className="text-left hidden md:block">
            <div className="font-semibold text-xs leading-none text-neutral-900">{session.username}</div>
            <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{shortAddress}</div>
          </div>
          <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
            SCA
          </span>
          <ChevronDown size={14} className="text-neutral-500" />
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-white p-4 shadow-xl z-50 animate-fade-in"
            style={{ borderColor: 'var(--border)' }}>
            <div className="mb-3 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Smart Account Wallet</div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <span className="font-mono text-xs text-neutral-800 break-all select-all">{account.address}</span>
                <button 
                  onClick={() => handleCopy(account.address)}
                  className="p-1 rounded hover:bg-neutral-100 transition-all text-neutral-500 cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            
            <div className="space-y-2 text-xs text-neutral-600 mb-4">
              <div className="flex justify-between">
                <span>Auth Method</span>
                <strong className="font-medium text-neutral-900 capitalize">{session.type}</strong>
              </div>
              {session.email && (
                <div className="flex justify-between">
                  <span>Email</span>
                  <strong className="font-medium text-neutral-900 truncate max-w-[120px]">{session.email}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span>Network</span>
                <strong className="font-medium text-neutral-900">Arc Testnet</strong>
              </div>
              <div className="flex justify-between">
                <span>Gas Fees</span>
                <strong className="font-medium text-green-600">100% Sponsored</strong>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold transition-all cursor-pointer bg-white"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // Fallback EOA is handled by standard ConnectButton. Let's show "Sign In" modal trigger button
  return (
    <>
      <button 
        onClick={() => { setShowModal(true); setStep('select'); }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer border shadow-xs"
        style={{ 
          background: 'var(--foreground)', 
          color: 'var(--background)',
          borderColor: 'var(--foreground)'
        }}
      >
        <Fingerprint size={14} />
        Sign In
      </button>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl border p-6 shadow-2xl animate-scale-in relative"
            style={{ borderColor: 'var(--border)' }}>
            
            {/* Close Button */}
            <button 
              onClick={() => { setShowModal(false); setStep('select'); }}
              className="absolute right-4 top-4 p-1 rounded-lg hover:bg-neutral-100 text-neutral-500 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Step 1: Selection */}
            {step === 'select' && (
              <div className="text-center pt-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}>
                  <Fingerprint size={24} />
                </div>
                <h3 className="font-semibold text-lg text-neutral-900">Sign in to StablePay</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-6">
                  SaaS business payments with 100% sponsored gas. No seed phrases required.
                </p>

                <div className="space-y-3">
                  <button 
                    onClick={handlePasskeyLogin}
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer bg-neutral-900 text-white hover:bg-neutral-800"
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Fingerprint size={16} />}
                    Sign In with Passkey
                  </button>

                  <button 
                    onClick={() => setStep('register')}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer border hover:bg-neutral-50 text-neutral-700 bg-white"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    Register New Passkey
                  </button>

                  <button 
                    onClick={() => setStep('email')}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer border hover:bg-neutral-50 text-neutral-700 bg-white"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <Mail size={16} />
                    Sign In with Email OTP
                  </button>
                </div>

                <div className="relative flex py-3 items-center">
                  <div className="flex-grow border-t border-neutral-200"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Web3 Option</span>
                  <div className="flex-grow border-t border-neutral-200"></div>
                </div>

                <p className="text-[11px] text-neutral-500 leading-normal mb-1">
                  Are you a crypto native? Connect standard external wallet.
                </p>
                <div className="flex justify-center text-xs mt-2">
                  <span className="text-[10px] text-neutral-400 font-medium">Use the "Connect Account" button on the navigation bar</span>
                </div>
              </div>
            )}

            {/* Step: Passkey Register */}
            {step === 'register' && (
              <div>
                <h3 className="font-semibold text-base text-neutral-900 mb-1">Create Passkey Smart Account</h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Set up a secure biometric passkey. Your key is stored on your device and never sent to any server.
                </p>

                <form onSubmit={handlePasskeyRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Choose Username
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., alice_treasury"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setStep('select')}
                      className="flex-1 py-2 px-3 rounded-lg border text-xs font-semibold hover:bg-neutral-50 text-neutral-700 cursor-pointer bg-white"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting || !username}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Register TouchID
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step: Email Input */}
            {step === 'email' && (
              <div>
                <h3 className="font-semibold text-base text-neutral-900 mb-1">Sign In with Email</h3>
                <p className="text-xs text-neutral-500 mb-4">
                  We will send a one-time verification code to generate your gasless smart account.
                </p>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Business Email Address
                    </label>
                    <input 
                      type="email" 
                      required
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white focus:ring-1 focus:ring-black outline-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setStep('select')}
                      className="flex-1 py-2 px-3 rounded-lg border text-xs font-semibold hover:bg-neutral-50 text-neutral-700 cursor-pointer bg-white"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting || !email}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Send Code
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step: OTP Input */}
            {step === 'otp' && (
              <div>
                <h3 className="font-semibold text-base text-neutral-900 mb-1">Verify Verification Code</h3>
                <p className="text-xs text-neutral-500 mb-4">
                  Enter the 6-digit verification code sent to <strong className="text-neutral-800">{email}</strong>.
                </p>

                <form onSubmit={handleOtpVerify} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      6-Digit Code
                    </label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      pattern="\d{6}"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-neutral-50 focus:bg-white tracking-widest text-center font-bold focus:ring-1 focus:ring-black outline-hidden"
                      style={{ borderColor: 'var(--border)' }}
                    />
                    <p className="text-[10px] text-neutral-400 mt-1.5">
                      Hint: Use test verification code <strong className="text-neutral-600">123456</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setStep('email')}
                      className="flex-1 py-2 px-3 rounded-lg border text-xs font-semibold hover:bg-neutral-50 text-neutral-700 cursor-pointer bg-white"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      Back
                    </button>
                    <button 
                      type="submit"
                      disabled={submitting || otp.length !== 6}
                      className="flex-1 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {submitting && <Loader2 size={13} className="animate-spin" />}
                      Verify & Log In
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
