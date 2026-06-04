"use client";

import React, { useState } from 'react';
import IntentBuilder from "@/components/enterprise/IntentBuilder";
import TreasuryDashboard from "@/components/enterprise/TreasuryDashboard";
import MaturityCalendar from "@/components/enterprise/MaturityCalendar";
import BondLadderBuilder from "@/components/enterprise/BondLadderBuilder";
import OTCDesk from "@/components/enterprise/OTCDesk";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield, CalendarClock, TrendingUp, ArrowRight, Sparkles, ChevronRight } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import CircleAuthButton from '@/components/enterprise/CircleAuthButton';
import CompliancePortal from "@/components/enterprise/CompliancePortal";
import UnifiedBalance from "@/components/enterprise/UnifiedBalance";
import AgentManager from "@/components/enterprise/AgentManager";
import YieldStreamer from "@/components/enterprise/YieldStreamer";
import MultiSigDesk from "@/components/enterprise/MultiSigDesk";
import Auditing from "@/components/enterprise/Auditing";

function WelcomeOnboarding({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: 'var(--primary-soft)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }}>
          <Sparkles size={12} />
          New: Your money earns while it waits
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight" style={{ color: 'var(--foreground)' }}>
          Pay vendors on time.<br />
          <span style={{ color: 'var(--primary)' }}>Earn interest automatically.</span>
        </h1>
        <p className="text-lg mt-4 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Schedule your business payments in advance. While your money waits for the 
          due date, it earns <strong className="font-semibold" style={{ color: 'var(--success)' }}>5% interest per year</strong> — 
          then gets delivered automatically. No manual work.
        </p>
      </div>

      {/* How It Works - Progressive Disclosure */}
      <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto mb-12">
        {[
          {
            icon: <CalendarClock size={22} />,
            step: "1",
            title: "Schedule a payment",
            desc: "Enter the amount, due date, and your vendor's account. Like setting up a bank transfer — but smarter.",
          },
          {
            icon: <TrendingUp size={22} />,
            step: "2",
            title: "Earn while you wait",
            desc: "Your money earns 5% annual interest in a secure holding account until the due date arrives.",
          },
          {
            icon: <Shield size={22} />,
            step: "3",
            title: "Auto-delivery on time",
            desc: "On the exact due date, your vendor receives the full payment automatically. You keep the interest earned.",
          },
        ].map((item, i) => (
          <div 
            key={i} 
            className="card-surface p-6 hover:shadow-md transition-all duration-300 animate-slide-up group cursor-default"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                style={{ background: 'var(--primary)' }}>
                {item.icon}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
                Step {item.step}
              </span>
            </div>
            <h3 className="font-semibold text-base mb-1.5" style={{ color: 'var(--foreground)' }}>{item.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <button 
          onClick={onGetStarted}
          className="btn-primary text-base px-8 py-3 gap-2 group"
        >
          Schedule Your First Payment
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
          Free to use · No hidden fees · Cancel anytime
        </p>
      </div>

      {/* Trust Indicators */}
      <div className="mt-16 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-xs font-medium" 
          style={{ color: 'var(--muted-foreground)' }}>
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: 'var(--success)' }} />
            Bank-grade security
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Powered by Circle
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--warning)' }}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Funds insured up to $250K
          </div>
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--info)' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            24/7 automatic settlement
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState<'treasury' | 'strategy' | 'calendar' | 'ladder' | 'compliance' | 'otc' | 'unified' | 'agent' | 'multisig' | 'auditing'>('strategy');
  const { isConnected: isEoaConnected } = useAccount();
  const { isSmartAccount } = useCircleAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Show onboarding only for disconnected users or first-time visitors
  const isConnected = mounted && (isEoaConnected || isSmartAccount);
  const shouldShowOnboarding = !isConnected && showOnboarding;

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="animate-pulse" style={{ color: 'var(--muted-foreground)' }}>Loading StablePay...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Premium Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl" 
        style={{ 
          borderColor: 'var(--border)', 
          background: 'rgba(250, 251, 252, 0.85)' 
        }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: 'var(--primary)' }}>
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-base tracking-tight" style={{ color: 'var(--foreground)' }}>
              StablePay
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">
            {isConnected && (
              <>
                <button 
                  onClick={() => { setActiveTab('strategy'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'strategy' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  New Payment
                </button>
                <button 
                  onClick={() => { setActiveTab('unified'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'unified' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Unified Balance
                </button>
                <button 
                  onClick={() => { setActiveTab('ladder'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'ladder' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Bond Ladder
                </button>
                <button 
                  onClick={() => { setActiveTab('calendar'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'calendar' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Maturity Calendar
                </button>
                <button 
                  onClick={() => { setActiveTab('treasury'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'treasury' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  My Payments
                </button>
                <button 
                  onClick={() => { setActiveTab('otc'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'otc' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Secondary Market
                </button>
                <button 
                  onClick={() => { setActiveTab('compliance'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'compliance' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Compliance Center
                </button>
                <button 
                  onClick={() => { setActiveTab('agent'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'agent' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Agent Copilot
                </button>
                <button 
                  onClick={() => { setActiveTab('multisig'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'multisig' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                  }`}
                >
                  Multi-Sig Desk
                </button>
                <button 
                  onClick={() => { setActiveTab('auditing'); setShowOnboarding(false); }}
                  className={`py-4 md:py-5 px-2 md:px-3 border-b-2 transition-all duration-200 text-xs md:text-sm ${
                    activeTab === 'auditing' 
                      ? 'border-[var(--primary)] text-[var(--foreground)] font-semibold' 
                      : 'border-transparent text-[var(--muted-foreground)] hover:text(--foreground)'
                  }`}
                >
                  Audit Suite
                </button>
                <div className="h-6 w-px mx-1 md:mx-2" style={{ background: 'var(--border)' }}></div>
              </>
            )}
            
            <CircleAuthButton />
            
            <ConnectButton 
              label="Connect Account"
              showBalance={false}
            />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12">
        {shouldShowOnboarding ? (
          <WelcomeOnboarding onGetStarted={() => setShowOnboarding(false)} />
        ) : (
          <>
            {/* Page Header */}
            <div className="mb-8 max-w-2xl animate-fade-in">
              {/* Live Status Indicator */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 shadow-xs"
                style={{ 
                  background: 'var(--success-soft)', 
                  color: 'var(--success-foreground)', 
                  border: '1px solid var(--success-border)' 
                }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></span>
                System online · All payments processing normally
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                {activeTab === 'treasury' && 'Your Payment History'}
                {activeTab === 'strategy' && 'Schedule a New Payment'}
                {activeTab === 'unified' && 'Unified Balance'}
                {activeTab === 'calendar' && 'Maturity Calendar'}
                {activeTab === 'ladder' && 'Bond Ladder Builder'}
                {activeTab === 'compliance' && 'Compliance Center'}
                {activeTab === 'otc' && 'Secondary OTC Trading Desk'}
                {activeTab === 'agent' && 'Autonomous Agent Copilot'}
                {activeTab === 'multisig' && 'Consensus Multi-Sig Desk'}
                {activeTab === 'auditing' && 'Enterprise Accounting & Auditing'}
              </h1>
              <p className="mt-2 text-base leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                {activeTab === 'treasury' && 'Track all your scheduled payments in one place. Your money earns interest until each due date, then gets delivered automatically.'}
                {activeTab === 'strategy' && 'Set up a payment that earns tiered annual interest while it waits. Your vendor gets paid on time, automatically — you keep the earnings.'}
                {activeTab === 'unified' && 'Aggregate, monitor, and deploy USDC/EURC held across major EVM chains and Solana using Circle Gateway SDK.'}
                {activeTab === 'calendar' && 'Visualize exactly when corporate cash flows mature and invoices get settled on a daily or monthly calendar grid.'}
                {activeTab === 'ladder' && 'Build a staggered treasury bond portfolio to align with future accounts payable, ensuring continuous cash flow cycles and maximum yield.'}
                {activeTab === 'compliance' && 'Verify your corporate identity to satisfy institutional regulatory guidelines and manage compliance whitelist/blacklist parameters.'}
                {activeTab === 'otc' && 'Buy and sell seasoned bonds to secure liquidity without early exit penalties, or capture higher yield-to-maturity (YTM) on discounted corporate debt.'}
                {activeTab === 'agent' && 'Deploy autonomous AI agent co-pilots with smart spending limits and whitelists to automate treasury allocations on Arc.'}
                {activeTab === 'multisig' && 'Approve corporate allocations and administrative actions via decentralized consensus rules.'}
                {activeTab === 'auditing' && 'Review live ledger entries, reconcile balances, and export financial audit reports.'}
              </p>
            </div>

            {/* Tab Content */}
            {activeTab === 'treasury' && (
              <div className="space-y-6 animate-fade-in">
                <YieldStreamer />
                <TreasuryDashboard 
                  onListOTC={(bond) => {
                    setActiveTab('otc');
                  }} 
                />
              </div>
            )}

            {activeTab === 'unified' && <UnifiedBalance />}
            
            {activeTab === 'calendar' && <MaturityCalendar />}
            
            {activeTab === 'ladder' && <BondLadderBuilder />}

            {activeTab === 'compliance' && <CompliancePortal />}

            {activeTab === 'otc' && <OTCDesk />}

            {activeTab === 'agent' && <AgentManager />}

            {activeTab === 'multisig' && <MultiSigDesk />}

            {activeTab === 'auditing' && <Auditing />}

            {activeTab === 'strategy' && (
              <div className="animate-fade-in">
                <IntentBuilder />
                
                {/* Trust & Safety Footer */}
                <div className="mt-10 text-center max-w-lg mx-auto">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: 'var(--primary)' }}>
                      <Shield size={14} />
                      Bank-grade security powered by Circle
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                      Your funds are held securely until the release date. You can cancel and withdraw early, 
                      subject to standard terms. All payments are tracked on a secure public ledger for full transparency.
                    </p>
                    <div className="flex items-center justify-center gap-4 text-[10px] font-medium pt-1" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Instant confirmation
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        No hidden fees
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        Cancel anytime
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t py-6 mt-12" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>© 2026 StablePay. Secure business payments, simplified.</span>
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">How It Works</span>
            <span className="hover:underline cursor-pointer">Security</span>
            <span className="hover:underline cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
