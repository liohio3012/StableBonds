"use client";

import React, { useState } from 'react';
import IntentBuilder from "@/components/enterprise/IntentBuilder";
import TreasuryDashboard from "@/components/enterprise/TreasuryDashboard";
import MaturityCalendar from "@/components/enterprise/MaturityCalendar";
import BondLadderBuilder from "@/components/enterprise/BondLadderBuilder";
import OTCDesk from "@/components/enterprise/OTCDesk";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Shield, CalendarClock, TrendingUp, ArrowRight, CheckCircle2, Lock, Clock, PlusCircle, Wallet, Layers, Calendar, Bot, Users, ClipboardList, Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, AlertTriangle, ArrowLeft } from 'lucide-react';
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
import Link from 'next/link';

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

export default function AppPortal() {
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = useState<'treasury' | 'strategy' | 'calendar' | 'ladder' | 'compliance' | 'otc' | 'unified' | 'agent' | 'multisig' | 'auditing'>('strategy');
  const { address: eoaAddress, isConnected: isEoaConnected } = useAccount();
  const { account: circleAccount, isSmartAccount } = useCircleAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar collapsible states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Compliance (KYC) state
  const userAddress = isSmartAccount ? circleAccount?.address : eoaAddress;
  const [isKycVerified, setIsKycVerified] = useState(true);

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

  const isConnected = mounted && (isEoaConnected || isSmartAccount);
  const meta = TAB_META[activeTab];

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="animate-pulse text-sm text-[var(--muted-foreground)]">Loading StablePay...</div>
      </div>
    );
  }

  // If not connected, render a clean locked state to encourage wallet connection
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between">
        {/* Navbar */}
        <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
            <Link href="/">
              <Logo size={28} className="cursor-pointer" />
            </Link>
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

        {/* Content */}
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="max-w-md w-full card-surface p-8 text-center space-y-6 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <Lock size={20} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)]">Access Authorized Portal</h2>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Connect your EOA wallet or log in with your corporate Circle Passkey to access the Treasury Dashboard.
              </p>
            </div>
            <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2.5">
              <div className="flex items-center justify-center gap-2">
                <span className="h-px bg-[var(--border)] flex-grow"></span>
                <span className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-bold">Use Corporate Portal</span>
                <span className="h-px bg-[var(--border)] flex-grow"></span>
              </div>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                If you have a corporate account, use the <strong>Circle WaaS</strong> Passkey login button in the header above to authenticate.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <Link href="/" className="btn-secondary text-xs gap-1 px-4 py-2">
                <ArrowLeft size={13} />
                Back to Home
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-md hover:bg-[var(--muted)] text-[var(--muted-foreground)] cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link href="/">
              <Logo size={28} className="cursor-pointer" />
            </Link>
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
        {/* Sidebar - Desktop (Collapsible) */}
        <aside className={`relative hidden md:flex flex-col shrink-0 border-r py-6 transition-all duration-300 ease-in-out sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto ${isSidebarCollapsed ? 'w-16 pr-0 items-center' : 'w-60 pr-6'}`}
          style={{ borderColor: 'var(--border)' }}>
          
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
      </div>

      <Footer />
    </div>
  );
}
