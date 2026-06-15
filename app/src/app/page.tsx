"use client";

import React, { useState } from 'react';
import IntentBuilder from "@/components/enterprise/IntentBuilder";
import TreasuryDashboard from "@/components/enterprise/TreasuryDashboard";
import MaturityCalendar from "@/components/enterprise/MaturityCalendar";
import BondLadderBuilder from "@/components/enterprise/BondLadderBuilder";
import OTCDesk from "@/components/enterprise/OTCDesk";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield, CalendarClock, TrendingUp, ArrowRight, CheckCircle2, Lock, Clock } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import CircleAuthButton from '@/components/enterprise/CircleAuthButton';
import CompliancePortal from "@/components/enterprise/CompliancePortal";
import UnifiedBalance from "@/components/enterprise/UnifiedBalance";
import AgentManager from "@/components/enterprise/AgentManager";
import YieldStreamer from "@/components/enterprise/YieldStreamer";
import MultiSigDesk from "@/components/enterprise/MultiSigDesk";
import Auditing from "@/components/enterprise/Auditing";
import Logo from "@/components/enterprise/Logo";

const TABS = [
  { id: 'strategy', label: 'New Payment' },
  { id: 'unified', label: 'Unified Balance' },
  { id: 'ladder', label: 'Bond Ladder' },
  { id: 'calendar', label: 'Maturity Calendar' },
  { id: 'treasury', label: 'My Payments' },
  { id: 'otc', label: 'Secondary Market' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'agent', label: 'Agent Copilot' },
  { id: 'multisig', label: 'Multi-Sig' },
  { id: 'auditing', label: 'Audit Suite' },
] as const;

const TAB_META: Record<string, { title: string; description: string }> = {
  treasury: {
    title: 'Payment History',
    description: 'Track all scheduled payments. Your funds earn interest until each due date, then settle automatically.',
  },
  strategy: {
    title: 'Schedule a Payment',
    description: 'Set up a payment that earns tiered annual interest while it waits. Vendor gets paid on time — you keep the yield.',
  },
  unified: {
    title: 'Unified Balance',
    description: 'Aggregate and deploy USDC/EURC across EVM chains and Solana via Circle Gateway SDK.',
  },
  calendar: {
    title: 'Maturity Calendar',
    description: 'Visualize when cash flows mature and invoices settle on a calendar grid.',
  },
  ladder: {
    title: 'Bond Ladder Builder',
    description: 'Build staggered treasury bond portfolios aligned with future accounts payable.',
  },
  compliance: {
    title: 'Compliance Center',
    description: 'Verify corporate identity and manage compliance whitelist/blacklist parameters.',
  },
  otc: {
    title: 'Secondary Trading Desk',
    description: 'Buy and sell seasoned bonds for liquidity or higher yield-to-maturity on discounted debt.',
  },
  agent: {
    title: 'Agent Copilot',
    description: 'Deploy autonomous agents with spending limits to automate treasury allocations.',
  },
  multisig: {
    title: 'Multi-Sig Desk',
    description: 'Approve corporate allocations via decentralized consensus rules.',
  },
  auditing: {
    title: 'Audit Suite',
    description: 'Review ledger entries, reconcile balances, and export audit reports.',
  },
};

function WelcomeOnboarding({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="max-w-2xl mx-auto text-center pt-8 pb-16">
        <Logo size={48} variant="icon" className="mx-auto mb-6" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-6"
          style={{ background: 'var(--success-soft)', color: 'var(--success-foreground)', border: '1px solid var(--success-border)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></span>
          Live on Arc Testnet
        </div>

        <h1 className="text-3xl md:text-[42px] font-semibold tracking-tight leading-[1.2] text-[var(--foreground)]">
          Corporate treasury infrastructure<br />
          that earns while it settles.
        </h1>

        <p className="text-base mt-5 leading-relaxed text-[var(--muted-foreground)] max-w-lg mx-auto">
          Schedule vendor payments on the Arc blockchain. Your funds earn up to
          <span className="font-semibold text-[var(--foreground)]"> 12% APY </span>
          in USDC bond vaults while waiting for the due date, then settle automatically.
        </p>

        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={onGetStarted} className="btn-primary gap-2 px-5 py-2.5 text-sm">
            Get Started
            <ArrowRight size={15} />
          </button>
          <button onClick={onGetStarted} className="btn-secondary px-5 py-2.5 text-sm">
            View Dashboard
          </button>
        </div>
      </div>

      {/* How it works — 3-column grid */}
      <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-16">
        {[
          {
            icon: <CalendarClock size={18} />,
            title: "Schedule payment",
            desc: "Enter amount, due date, and vendor address. Choose your yield tier.",
          },
          {
            icon: <TrendingUp size={18} />,
            title: "Earn yield",
            desc: "Funds earn 4-12% APY in USDC bond vaults until the maturity date.",
          },
          {
            icon: <CheckCircle2 size={18} />,
            title: "Auto-settle",
            desc: "On the due date, principal is delivered to your vendor automatically.",
          },
        ].map((item, i) => (
          <div key={i} className="card-surface p-5 animate-slide-up" style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 text-[var(--foreground)]"
              style={{ background: 'var(--muted)' }}>
              {item.icon}
            </div>
            <h3 className="font-semibold text-sm mb-1 text-[var(--foreground)]">{item.title}</h3>
            <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Yield tiers summary */}
      <div className="card-surface max-w-3xl mx-auto p-6 mb-16">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-[var(--foreground)]">Current Yield Tiers</h3>
          <span className="text-xs text-[var(--muted-foreground)]">Updated live from smart contract</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {[
            { term: '30d', senior: '4.0%', junior: '8.0%' },
            { term: '60d', senior: '4.5%', junior: '9.0%' },
            { term: '90d', senior: '5.0%', junior: '10.0%' },
            { term: '180d', senior: '5.5%', junior: '11.0%' },
            { term: '365d', senior: '6.0%', junior: '12.0%' },
          ].map((tier) => (
            <div key={tier.term} className="text-center p-3 rounded-lg" style={{ background: 'var(--muted)' }}>
              <div className="text-xs font-medium text-[var(--muted-foreground)] mb-1">{tier.term}</div>
              <div className="text-sm font-semibold text-[var(--foreground)]">{tier.senior}</div>
              <div className="text-xs text-[var(--success-foreground)] font-medium">{tier.junior}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--foreground)]"></span> Senior Tranche</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--success)]"></span> Junior Tranche</span>
        </div>
      </div>

      {/* Trust footer */}
      <div className="border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-medium text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-[var(--success)]" />
            Bank-grade custody
          </div>
          <div className="flex items-center gap-1.5">
            <Lock size={14} />
            Circle WaaS + CCTP
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} />
            Sub-second finality
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} />
            USDC gas fees
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

  const isConnected = mounted && (isEoaConnected || isSmartAccount);
  const shouldShowOnboarding = !isConnected && showOnboarding;
  const meta = TAB_META[activeTab];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-pulse text-sm text-[var(--muted-foreground)]">Loading StablePay...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Logo size={28} />

          <div className="flex items-center gap-2">
            <CircleAuthButton />
            <ConnectButton label="Connect" showBalance={false} />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {shouldShowOnboarding ? (
          <WelcomeOnboarding onGetStarted={() => setShowOnboarding(false)} />
        ) : (
          <>
            {/* Tab Navigation — underline style */}
            <div className="mb-6 overflow-x-auto scrollbar-none border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-0 flex-nowrap min-w-max">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id as any); setShowOnboarding(false); }}
                    className={`px-3.5 py-2.5 text-[13px] font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer border-b-2 -mb-px ${
                      activeTab === tab.id
                        ? 'border-[var(--foreground)] text-[var(--foreground)]'
                        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Header */}
            <div className="mb-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
                  {meta.title}
                </h1>
                <div className="badge badge-success">
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[var(--success)]"></span>
                  Live
                </div>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] max-w-xl">{meta.description}</p>
            </div>

            {/* Content */}
            {activeTab === 'treasury' && (
              <div className="space-y-6 animate-fade-in">
                <YieldStreamer />
                <TreasuryDashboard onListOTC={() => setActiveTab('otc')} />
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
                <div className="mt-8 text-center max-w-md mx-auto">
                  <div className="flex items-center justify-center gap-5 text-[11px] font-medium text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[var(--success)]" />
                      Instant confirmation
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[var(--success)]" />
                      No hidden fees
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-[var(--success)]" />
                      Cancel anytime
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t py-5 mt-12" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[var(--muted-foreground)]">
          <span>© 2026 StablePay · Treasury infrastructure on Arc</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-[var(--foreground)] cursor-pointer transition-colors">Documentation</span>
            <span className="hover:text-[var(--foreground)] cursor-pointer transition-colors">Security</span>
            <span className="hover:text-[var(--foreground)] cursor-pointer transition-colors">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
