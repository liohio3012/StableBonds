"use client";

import React, { useState } from 'react';
import IntentBuilder from "@/components/enterprise/IntentBuilder";
import TreasuryDashboard from "@/components/enterprise/TreasuryDashboard";
import MaturityCalendar from "@/components/enterprise/MaturityCalendar";
import BondLadderBuilder from "@/components/enterprise/BondLadderBuilder";
import OTCDesk from "@/components/enterprise/OTCDesk";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield, CalendarClock, TrendingUp, ArrowRight, CheckCircle2, Lock, Clock, PlusCircle, Wallet, Layers, Calendar, Bot, Users, ClipboardList, Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useCircleAuth } from '@/lib/CircleAuthContext';
import CircleAuthButton from '@/components/enterprise/CircleAuthButton';
import CompliancePortal from "@/components/enterprise/CompliancePortal";
import UnifiedBalance from "@/components/enterprise/UnifiedBalance";
import AgentManager from "@/components/enterprise/AgentManager";
import YieldStreamer from "@/components/enterprise/YieldStreamer";
import MultiSigDesk from "@/components/enterprise/MultiSigDesk";
import Auditing from "@/components/enterprise/Auditing";
import Logo from "@/components/enterprise/Logo";
import Footer from "@/components/enterprise/Footer";

const SIDEBAR_GROUPS = [
  {
    title: 'Payments & Assets',
    items: [
      { id: 'strategy', label: 'New Payment', icon: PlusCircle },
      { id: 'treasury', label: 'My Payments', icon: CalendarClock },
      { id: 'unified', label: 'Unified Balance', icon: Wallet },
    ]
  },
  {
    title: 'Treasury & Yield',
    items: [
      { id: 'ladder', label: 'Bond Ladder', icon: Layers },
      { id: 'calendar', label: 'Maturity Calendar', icon: Calendar },
      { id: 'otc', label: 'Secondary Market', icon: TrendingUp },
    ]
  },
  {
    title: 'Operations',
    items: [
      { id: 'compliance', label: 'Compliance Center', icon: Shield },
      { id: 'agent', label: 'Agent Copilot', icon: Bot },
      { id: 'multisig', label: 'Multi-Sig Desk', icon: Users },
      { id: 'auditing', label: 'Audit Suite', icon: ClipboardList },
    ]
  }
] as const;

function SidebarContent({ 
  activeTab, 
  setActiveTab,
  isSidebarCollapsed = false,
  collapsedGroups = {},
  toggleGroup = () => {}
}: { 
  activeTab: string; 
  setActiveTab: (tab: any) => void; 
  isSidebarCollapsed?: boolean;
  collapsedGroups?: Record<string, boolean>;
  toggleGroup?: (title: string) => void;
}) {
  return (
    <div className="space-y-6">
      {SIDEBAR_GROUPS.map((group) => {
        const isCollapsed = collapsedGroups[group.title];
        return (
          <div key={group.title} className="space-y-1.5">
            {!isSidebarCollapsed ? (
              <button
                onClick={() => toggleGroup(group.title)}
                className="w-full flex items-center justify-between text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider px-3 mb-2 cursor-pointer hover:text-[var(--foreground)] transition-colors text-left"
              >
                <span>{group.title}</span>
                {isCollapsed ? <ChevronRight size={10} /> : <ChevronDown size={10} />}
              </button>
            ) : (
              <div className="border-t border-[var(--border)] my-3 mx-1 opacity-50" />
            )}
            
            {(!isCollapsed || isSidebarCollapsed) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={item.label}
                      className={`w-full flex items-center rounded-md transition-all cursor-pointer ${
                        isSidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2 text-xs font-semibold'
                      } ${
                        isActive 
                          ? 'bg-[var(--primary)] text-white shadow-sm' 
                          : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-white' : 'text-[var(--muted-foreground)]'} />
                      {!isSidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, session, isSmartAccount } = useCircleAuth();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar collapsible states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Compliance (KYC) state
  const userAddress = isSmartAccount ? circleAccount?.address : eoaAddress;
  const [isKycVerified, setIsKycVerified] = useState(true);

  // Tenant diagnostic state
  const [diagnosticResult, setDiagnosticResult] = useState<{
    clientKeyConfigured: boolean;
    apiKeyConfigured: boolean;
    tenantMismatch: boolean;
    clientTenant: string;
    apiTenant: string;
  } | null>(null);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Poll local storage for compliance status
  React.useEffect(() => {
    if (!userAddress) {
      setIsKycVerified(true);
      return;
    }
    const checkKyc = () => {
      const verified = localStorage.getItem(`kyc_verified_${userAddress}`) === 'true';
      setIsKycVerified(verified);
    };
    checkKyc();
    window.addEventListener('storage', checkKyc);
    const interval = setInterval(checkKyc, 1000);
    return () => {
      window.removeEventListener('storage', checkKyc);
      clearInterval(interval);
    };
  }, [userAddress]);

  // Fetch tenant key mismatch diagnostics
  React.useEffect(() => {
    fetch('/api/diagnostics')
      .then(res => res.json())
      .then(data => setDiagnosticResult(data))
      .catch(err => console.error('Failed to fetch diagnostics:', err));
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
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!shouldShowOnboarding && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Logo size={28} />
          </div>

          <div className="flex items-center gap-2">
            <CircleAuthButton />
            <ConnectButton.Custom>
              {({ account, chain, openConnectModal, openAccountModal, openChainModal, mounted }) => {
                const connected = mounted && account && chain;
                return (
                  <div {...(!mounted && { 'aria-hidden': true, style: { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
                    {(() => {
                      if (!connected) {
                        return (
                          <button onClick={openConnectModal} className="btn-primary text-xs gap-1.5 px-3 py-1.5">
                            Connect
                          </button>
                        );
                      }
                      if (chain.unsupported) {
                        return (
                          <button onClick={openChainModal} className="btn-primary text-xs gap-1.5 px-3 py-1.5 !bg-red-600 !border-red-600">
                            Wrong Network
                          </button>
                        );
                      }
                      return (
                        <button onClick={openAccountModal} className="btn-secondary text-xs gap-1.5 px-3 py-1.5 font-mono">
                          {account.displayName}
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        {shouldShowOnboarding ? (
          <main className="flex-1 px-4 md:px-6 py-8">
            <WelcomeOnboarding onGetStarted={() => setShowOnboarding(false)} />
          </main>
        ) : (
          <>
            {/* Sidebar - Desktop (Collapsible) */}
            <aside className={`relative hidden md:flex flex-col shrink-0 border-r py-6 transition-all duration-300 ease-in-out sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto ${isSidebarCollapsed ? 'w-16 pr-0 items-center' : 'w-60 pr-6'}`}
              style={{ borderColor: 'var(--border)' }}>
              
              {/* Collapse Trigger Chevron */}
              <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="absolute right-2 top-2 z-10 w-6 h-6 rounded-md border bg-[var(--muted)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-all cursor-pointer shadow-sm"
                style={{ borderColor: 'var(--border)' }}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {isSidebarCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
              </button>

              <div className="w-full mt-4">
                <SidebarContent 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  isSidebarCollapsed={isSidebarCollapsed}
                  collapsedGroups={collapsedGroups}
                  toggleGroup={toggleGroup}
                />
              </div>
            </aside>

            {/* Sidebar - Mobile Drawer */}
            {mobileMenuOpen && (
              <div className="fixed inset-0 z-40 md:hidden bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setMobileMenuOpen(false)}>
                <aside 
                  className="fixed bottom-0 top-14 left-0 w-64 bg-[var(--background)] border-r p-5 shadow-2xl animate-slide-right flex flex-col"
                  style={{ borderColor: 'var(--border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SidebarContent activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMobileMenuOpen(false); }} />
                </aside>
              </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 px-4 md:px-8 py-8 overflow-y-auto">
              
              {/* Diagnostic warning banner for Tenant ID Mismatch hidden as requested */}

              {/* Global KYC compliance warning banner */}
              {!isKycVerified && (
                <div className="mb-6 p-4 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-200 animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-3 text-left">
                    <Shield className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <div>
                      <h4 className="font-semibold text-sm text-amber-400">Compliance Verification Required</h4>
                      <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                        You must complete corporate onboarding before scheduling payments or investing in bond ladders.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('compliance')} 
                    className="btn-primary text-xs whitespace-nowrap bg-amber-600 hover:bg-amber-500 border-amber-500 text-white gap-1.5 px-4 py-2 self-start sm:self-center flex items-center font-semibold"
                  >
                    Start KYC Onboarding
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}

              {/* Page Header */}
              <div className="mb-6 animate-fade-in text-left">
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
              {activeTab === 'ladder' && <BondLadderBuilder onNavigateToCompliance={() => setActiveTab('compliance')} />}
              {activeTab === 'compliance' && <CompliancePortal />}
              {activeTab === 'otc' && <OTCDesk />}
              {activeTab === 'agent' && <AgentManager />}
              {activeTab === 'multisig' && <MultiSigDesk />}
              {activeTab === 'auditing' && <Auditing />}
              {activeTab === 'strategy' && (
                <div className="animate-fade-in">
                  <IntentBuilder onNavigateToCompliance={() => setActiveTab('compliance')} />
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
            </main>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
