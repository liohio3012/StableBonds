"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CalendarClock, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Clock, 
  Calendar, 
  Bot, 
  BookOpen, 
  Briefcase, 
  Users,
  Search,
  HelpCircle,
  Activity,
  ChevronDown,
  ChevronRight,
  Settings,
  DollarSign,
  AlertCircle,
  Server,
  MessageSquare,
  Command,
  RefreshCw,
  X
} from 'lucide-react';
import Logo from "@/components/enterprise/Logo";
import Footer from "@/components/enterprise/Footer";
import Link from 'next/link';

// GitHub SVG icon (exact brand mark)
const GithubIcon = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export default function Home() {
  // --- States for advanced interactive components ---
  const [activeUseCase, setActiveUseCase] = useState(0);
  const [activeScreenshotTab, setActiveScreenshotTab] = useState('dashboard');
  const [calcPrincipal, setCalcPrincipal] = useState(150000);
  const [calcDuration, setCalcDuration] = useState(90);
  const [calcTranche, setCalcTranche] = useState<'senior' | 'junior'>('senior');
  const [faqOpen, setFaqOpen] = useState<Record<number, boolean>>({});
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityLogs, setActivityLogs] = useState<Array<{id: number, time: string, action: string, type: 'success' | 'info' | 'warning'}>>([
    { id: 1, time: 'Just now', action: 'Direct treasury payout routed via Circle WaaS to Arc Testnet', type: 'success' },
    { id: 2, time: '3m ago', action: 'Secondary OTC secondary order filled: 4,800 USDC face value secured', type: 'success' },
    { id: 3, time: '7m ago', action: 'Autonomous AI Copilot optimized 180-day Senior tranche balance allocation', type: 'info' }
  ]);
  const [statusHealth, setStatusHealth] = useState({
    engine: 'healthy',
    network: 'healthy',
    routing: 'healthy',
    api: 'healthy'
  });
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState('');
  const [chatLogs, setChatLogs] = useState<Array<{sender: 'user' | 'agent', text: string}>>([
    { sender: 'agent', text: 'Hello! I am the StableBonds support assistant. How can I help you manage your digital asset treasury today?' }
  ]);

  // --- Real-time Activity Feed Simulation ---
  useEffect(() => {
    const actions = [
      'Settled mature 90-day Senior Tranche: 50,000 USDC delivered to supplier.eth',
      'Circle CCTP bridging route initialized for Base-to-Arc cross-chain treasury pool',
      'AI Coprocessor verified smart contract compliance signature for whitelisted vendor',
      'Secondary Bond secondary market desk filled OTC listing #3 at 4.2% discount',
      'Gasless paymaster transaction sponsored by StableBonds treasury engine',
      'Yield payout allocated: +1,250 USDC generated in 180-day Junior vault'
    ];
    
    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setActivityLogs(prev => [
        {
          id: Date.now(),
          time: 'Just now',
          action: randomAction,
          type: Math.random() > 0.2 ? 'success' : 'info'
        },
        ...prev.slice(0, 4)
      ]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // --- Keyboard Shortcuts Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Live Status Refresh Simulation ---
  const handleRefreshStatus = () => {
    setStatusHealth({
      engine: 'refreshing',
      network: 'healthy',
      routing: 'healthy',
      api: 'healthy'
    });
    setTimeout(() => {
      setStatusHealth({
        engine: 'healthy',
        network: 'healthy',
        routing: 'healthy',
        api: 'healthy'
      });
    }, 800);
  };

  // --- Support Chat Handler ---
  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    
    setChatLogs(prev => [...prev, { sender: 'user', text: supportMessage }]);
    const currentMsg = supportMessage;
    setSupportMessage('');

    setTimeout(() => {
      let reply = "Thank you. Our institutional treasury desk has been notified. You can also explore our technical specifications on /docs.";
      if (currentMsg.toLowerCase().includes('yield') || currentMsg.toLowerCase().includes('apy')) {
        reply = "StableBonds offers 4.0% - 12.0% APY across senior and junior tranches. Senior tranches offer capital protection, while junior tranches optimize yield.";
      } else if (currentMsg.toLowerCase().includes('security') || currentMsg.toLowerCase().includes('custody')) {
        reply = "Security is our priority. We leverage Circle Web3 Services (WaaS) and on-chain Multi-Sig desk controls with role-based policies.";
      }
      setChatLogs(prev => [...prev, { sender: 'agent', text: reply }]);
    }, 1000);
  };

  // --- ROI Calculator Logic ---
  const getCalculatedYield = () => {
    const rateMap = {
      30: { senior: 0.04, junior: 0.08 },
      60: { senior: 0.045, junior: 0.09 },
      90: { senior: 0.05, junior: 0.10 },
      180: { senior: 0.055, junior: 0.11 },
      365: { senior: 0.06, junior: 0.12 }
    };
    const rate = rateMap[calcDuration as keyof typeof rateMap]?.[calcTranche] || 0.05;
    const earnings = calcPrincipal * rate * (calcDuration / 365);
    const finalVal = calcPrincipal + earnings;
    return {
      rate: (rate * 100).toFixed(1),
      earnings: earnings.toLocaleString('en-US', { maximumFractionDigits: 2 }),
      finalVal: finalVal.toLocaleString('en-US', { maximumFractionDigits: 2 })
    };
  };

  const calculatorYieldInfo = getCalculatedYield();

  // --- Use Cases Configuration ---
  const useCases = [
    {
      title: "Corporate Treasury",
      badge: "Treasury Management",
      icon: TrendingUp,
      scenario: "A mid-sized corporate enterprise holds $500,000 in idle USDC awaiting invoice settlement. Instead of leaving it unproductive, they allocate it into StableBonds 90-day senior vaults at 5.0% APY. The capital accrues yield safely, earning ~$6,250 over the quarter before automatically settling the target invoice.",
      stats: [
        { label: "Principal Allocation", value: "$500,000 USDC" },
        { label: "Maturity Duration", value: "90-Day Term" },
        { label: "Accrued Yield (Est.)", value: "~$6,250 USDC", highlight: true },
        { label: "Settlement Protocol", value: "100% Automated" }
      ]
    },
    {
      title: "Automated Supply Chain",
      badge: "Escrow & Yield",
      icon: Briefcase,
      scenario: "A manufacturer locks $250,000 USDC in a StableBonds escrow vault to secure a bulk raw material purchase. During the 45-day transit and customs inspection period, the locked funds earn 4.2% APY, generating ~$1,290. Upon verified delivery, the supplier receives the payment, and the accrued yield is split per agreement.",
      stats: [
        { label: "Escrow Allocation", value: "$250,000 USDC" },
        { label: "Inspection Window", value: "45-Day Transit" },
        { label: "Accrued Yield (Est.)", value: "~$1,294 USDC", highlight: true },
        { label: "Settlement Trigger", value: "Proof of Delivery" }
      ]
    },
    {
      title: "Cross-Border Payroll",
      badge: "Pre-funded Operations",
      icon: Users,
      scenario: "A remote tech startup pre-funds their quarterly contractor payroll pool of $300,000 USDC 60 days early via Circle WaaS. The capital earns 5.2% APY in StableBonds vaults, accruing ~$2,560. On the automated due date, the platform payouts are executed to 80 international contractors, and the accrued yield offsets transaction costs.",
      stats: [
        { label: "Payroll Allocation", value: "$300,000 USDC" },
        { label: "Pre-fund Period", value: "60-Day Lock" },
        { label: "Accrued Yield (Est.)", value: "~$2,564 USDC", highlight: true },
        { label: "Payout Distribution", value: "80 Contractors" }
      ]
    }
  ];

  // --- FAQ Data ---
  const faqData = [
    { q: "How does StableBonds guarantee asset safety?", a: "StableBonds employs smart contracts built on the secure, EVM-compatible Arc blockchain network. We use Circle Web3 Services (WaaS) developer controls and customizable multi-sig approvals. Vault assets are secured natively on-chain without exposure to third-party lending desks." },
    { q: "What is the difference between Senior and Junior yield vaults?", a: "Senior tranches prioritize capital preservation, offering fully protected principal with highly stable yield (4.0% - 6.0% APY). Junior tranches offer boosted yields (8.0% - 12.0% APY) by absorbing short-term fluctuations, ideal for yield-focused treasuries." },
    { q: "How is the automated settlement executed?", a: "When you schedule a payment intent, the principal remains locked in the target bond vault earning yield. At the maturity date, the treasury engine automatically triggers a smart contract execution to transfer the principal directly to the recipient wallet." },
    { q: "How are gas fees managed on the Arc blockchain?", a: "Arc features native USDC gas fees, removing the need to hold secondary tokens like ETH. StableBonds integrates gasless paymasters to sponsor transaction fees for institutional customers, providing a completely seamless fiat-like payment experience." },
    { q: "Is the platform regulatory compliant?", a: "Yes. StableBonds features built-in compliance integrations including KYC/AML verification, whitelisted supplier controls, and automated transaction limits to meet enterprise governance rules." },
    { q: "Can I bridge USDC from other EVM chains to Arc?", a: "Yes. StableBonds integrates Circle Cross-Chain Transfer Protocol (CCTP) to bridge USDC instantly. You can route idle capital from Ethereum, Base, or Arbitrum directly to Arc vault contracts." },
    { q: "What is the role of the AI Coprocessor?", a: "Powered by Lepton LLM, the autonomous AI Copilot reviews treasury parameters, schedules payouts, maps optimal bond durations, and alerts finance teams of optimization opportunities." },
    { q: "Can we configure custom multi-signature workflows?", a: "Yes, our Multi-Sig Desk allows role-based approvals. You can establish policies (e.g., payouts >$10,000 require approval from both the CFO and Compliance Officer) enforced directly by blockchain consensus." }
  ];

  // --- Command Palette Items Filtration ---
  const navItems = [
    { name: "Launch Treasury Dashboard", desc: "Go to app payment view", url: "/app" },
    { name: "Active Bond Vaults", desc: "View senior and junior tranches", url: "/app" },
    { name: "System Status Page", desc: "Real-time service health check", url: "#status" },
    { name: "Technical Documentation", desc: "Circle WaaS & Arc APIs developer guide", url: "/docs" },
    { name: "Enterprise Compliance Center", desc: "Setup role-based policies", url: "/app" },
    { name: "A2A OTC Secondary Desk", desc: "Trade seasoned discounted bonds", url: "/app" }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col relative"
      style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {/* Sticky Announcement Bar */}
      <div className="w-full bg-[#18181b] text-white border-b border-zinc-800 text-[11px] font-bold tracking-wider py-2 px-6 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-2 mx-auto">
          <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded text-[9px] uppercase font-black">Arc Integration</span>
          <span>Native USDC treasury vaults now active on Arc Protocol integration layer.</span>
          <Link href="/docs" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 ml-1.5 font-extrabold">
            Learn More <ArrowRight size={10} />
          </Link>
        </div>
      </div>

      {/* Sticky Navbar */}
      <nav className="border-b sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo size={36} className="cursor-pointer" />
            </Link>
          </div>

          {/* Quick Search Shortcut */}
          <div className="hidden md:flex items-center gap-2 bg-[var(--muted)] border rounded-lg px-3 py-1.5 cursor-pointer max-w-xs w-56 text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-all"
            style={{ borderColor: 'var(--border)' }}
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search size={14} />
            <span className="text-[11px] font-semibold flex-grow text-left">Quick Search...</span>
            <div className="flex items-center gap-0.5 text-[9px] font-bold bg-neutral-200 dark:bg-neutral-800 px-1 py-0.2 rounded border" style={{ borderColor: 'var(--border)' }}>
              <Command size={8} />
              <span>K</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/liohio3012/StableBonds"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-200 hover:border-[var(--foreground)] hover:bg-[var(--muted)]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              <GithubIcon size={16} />
            </a>
            <Link
              href="/docs"
              className="w-9 h-9 rounded-lg border flex items-center justify-center transition-all duration-200 hover:border-[var(--foreground)] hover:bg-[var(--muted)]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
            >
              <BookOpen size={16} />
            </Link>

            <div className="w-px h-5 bg-[var(--border)] mx-1" />

            <Link href="/app" className="btn-primary text-sm gap-2 px-6 py-2.5 flex items-center font-bold tracking-wide rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm">
              Launch App
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container — Hero Section */}
      <div className="flex-grow flex max-w-7xl w-full mx-auto relative px-6 pt-12">
        <main className="flex-grow">
          
          {/* WelcomeHero Block */}
          <div className="animate-fade-in relative">
            <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-96 h-96 rounded-full bg-amber-400/5 blur-[140px] pointer-events-none"></div>

            <div className="max-w-3xl mx-auto text-center pt-10 pb-12">
              <Logo size={64} variant="icon" className="mx-auto mb-6 hover:rotate-12 transition-transform duration-300" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-6"
                style={{ background: 'var(--success-soft)', color: 'var(--success-foreground)', border: '1px solid var(--success-border)' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></span>
                Circle WaaS Network Active
              </div>

              <h1 className="text-4xl md:text-[52px] font-bold tracking-tight leading-[1.15] text-[var(--foreground)]">
                Corporate treasury infrastructure<br />
                that earns while it settles.
              </h1>

              <p className="text-base md:text-lg mt-6 leading-relaxed text-[var(--muted-foreground)] max-w-xl mx-auto">
                Schedule vendor payments on the Arc blockchain. Your funds earn up to
                <span className="font-semibold text-[var(--foreground)]"> 12% APY </span>
                in USDC bond vaults while waiting for the due date, then settle automatically.
              </p>

              <div className="flex items-center justify-center gap-4 mt-10">
                <Link href="/app" className="btn-primary gap-2.5 px-6 py-3.5 text-sm flex items-center font-bold shadow-md hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Get Started
                  <ArrowRight size={16} />
                </Link>
                <Link href="/app" className="btn-secondary px-6 py-3.5 text-sm flex items-center font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                  View Dashboard
                </Link>
              </div>

              {/* Sleek Hero Graphic Illustration & Treasury Visualizer */}
              <div className="mt-14 max-w-4xl mx-auto rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white/70 dark:bg-black/70 backdrop-blur-md overflow-hidden animate-scale-in text-left">
                {/* Mock Window Top Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400/80"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400/80"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400/80"></span>
                    <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 ml-2 font-mono">STABLEBONDS · TREASURY PLATFORM</span>
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-200/50 dark:bg-neutral-800/50 px-2.5 py-1 rounded-md text-[10px] font-bold text-[var(--success-foreground)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse"></span>
                    Engine Active
                  </div>
                </div>

                <div className="grid md:grid-cols-12 gap-6 p-6 items-center">
                  {/* Video */}
                  <div className="md:col-span-7 relative group">
                    <div className="absolute inset-0 rounded-2xl blur-2xl opacity-20 scale-95 pointer-events-none"
                      style={{ background: 'radial-gradient(ellipse at 50% 100%, #059669 0%, transparent 65%)' }} />
                    <div className="relative rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]">
                      <div className="relative" style={{ aspectRatio: '16/9' }}>
                        <video
                          src="/stablebounds.mp4"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Telemetry / Features Walkthrough */}
                  <div className="md:col-span-5 space-y-6">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">
                        Yield Engine Telemetry
                      </span>
                      <h3 className="text-xl font-bold mt-1 text-[var(--foreground)]">
                        Staggered Yield Optimization
                      </h3>
                      <p className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
                        StableBonds auto-routes payment schedules across low-risk senior/junior bond vaults. Watch your balance grow dynamically while awaiting settlement maturity dates.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">APY Range</span>
                        <div className="text-base font-bold text-[var(--success)] mt-0.5">4.0% - 12.0%</div>
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500">Fixed rate yield</span>
                      </div>
                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-xl p-3 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wide">Settlement</span>
                        <div className="text-base font-bold text-[var(--foreground)] mt-0.5">100% Auto</div>
                        <span className="text-[9px] text-neutral-400 dark:text-neutral-500">No transaction fees</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Trust Section: Infrastructure Partners */}
      <div className="w-full border-t border-b py-8 my-10 bg-neutral-50/30 dark:bg-zinc-950/20" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-6">
            TRUSTED BY INFRASTRUCTURE PARTNERS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all">
            <span className="text-base font-bold tracking-tight text-[var(--foreground)] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-[var(--primary)]"></span> Circle
            </span>
            <span className="text-base font-bold tracking-tight text-[var(--foreground)] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Arc Network
            </span>
            <span className="text-base font-bold tracking-tight text-[var(--foreground)] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> USDC
            </span>
            <span className="text-base font-bold tracking-tight text-[var(--foreground)] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Circle CCTP
            </span>
            <span className="text-base font-bold tracking-tight text-[var(--foreground)] flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-purple-500"></span> Lepton AI
            </span>
          </div>
        </div>
      </div>

      {/* Simulated Live Activity Feed */}
      <div className="max-w-4xl mx-auto px-6 mb-16">
        <div className="border rounded-2xl p-6 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shadow-xs" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">Real-Time Platform Event Stream</span>
            </div>
            <span className="text-[9px] text-[var(--muted-foreground)] font-mono">SIMULATED IN REAL TIME</span>
          </div>
          <div className="space-y-3">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start justify-between text-xs animate-slide-up bg-black/5 dark:bg-black/20 p-2.5 rounded-lg border border-transparent hover:border-[var(--border)] transition-all">
                <div className="flex items-start gap-2.5">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${log.type === 'success' ? 'bg-emerald-500' : 'bg-blue-400'}`}></span>
                  <span className="text-[var(--foreground)] font-medium">{log.action}</span>
                </div>
                <span className="text-[10px] text-[var(--muted-foreground)] font-mono shrink-0 ml-4">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section — inside max-width container */}
      <div className="flex-grow flex max-w-7xl w-full mx-auto relative px-6 pb-12">
        <main className="flex-grow">
          
          {/* WelcomeFeatures Section */}
          <div className="animate-fade-in">

            {/* How it works — 3-column grid */}
            <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-20">
              {[
                {
                  icon: <CalendarClock size={20} />,
                  title: "Schedule Payouts",
                  desc: "Configure transaction amounts, maturity parameters, and whitelisted vendor addresses.",
                },
                {
                  icon: <TrendingUp size={20} />,
                  title: "Deploy & Accrue",
                  desc: "Funds accrue fixed APY in safe senior/junior vault tranches dynamically until settlement.",
                },
                {
                  icon: <CheckCircle2 size={20} />,
                  title: "Automated Disbursal",
                  desc: "Smart contracts trigger and deliver the principal to the recipient automatically on the due date.",
                },
              ].map((item, i) => (
                <div key={i} className="card-surface p-6 animate-slide-up hover:scale-[1.01] hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300" style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-[var(--foreground)]"
                    style={{ background: 'var(--muted)' }}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-sm mb-1 text-[var(--foreground)]">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Enterprise Platform Interface Walkthrough Section */}
            <div className="max-w-4xl mx-auto mb-20 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Platform Tour</span>
              <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-1 mb-3">Enterprise Treasury Interface</h3>
              <p className="text-xs text-[var(--muted-foreground)] max-w-xl mx-auto mb-8">
                Explore the professional tools engineered for automated balance tracking, regulatory compliance, OTC secondary trade desks, and AI-driven bond scheduling.
              </p>

              {/* Tabs for Interface Selection */}
              <div className="flex flex-wrap justify-center gap-1.5 mb-6 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                {[
                  { id: 'dashboard', label: 'Treasury Cockpit', desc: 'Overview of assets, payouts, and flows.' },
                  { id: 'ladder', label: 'Bond Ladder Builder', desc: 'Staggered asset maturity duration tools.' },
                  { id: 'agent', label: 'AI Coprocessor Desk', desc: 'Autonomous negotiation & auto scheduling.' },
                  { id: 'otc', label: 'Secondary OTC Market', desc: 'Seasoned discounted bonds trade desk.' },
                  { id: 'compliance', label: 'Compliance & Limits', desc: 'Role approvals and KYC verification.' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveScreenshotTab(tab.id)}
                    className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      activeScreenshotTab === tab.id
                        ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)] shadow-xs'
                        : 'bg-white dark:bg-zinc-950 text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)] hover:border-neutral-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Screenshot Previewer with Browser frame */}
              <div className="border rounded-2xl overflow-hidden shadow-2xl bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
                {/* Browser bar */}
                <div className="flex items-center justify-between px-5 py-3 border-b bg-neutral-100/40 dark:bg-zinc-900/40" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
                    <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 ml-2 font-mono">
                      https://www.stablebonds.space/app/{activeScreenshotTab}
                    </span>
                  </div>
                  <div className="text-[9px] font-bold text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800/50 px-2 py-0.5 rounded uppercase">
                    Secured Layer
                  </div>
                </div>

                {/* Screenshot Display Box */}
                <div className="relative bg-neutral-100 dark:bg-zinc-900/50 p-2 min-h-[350px] flex items-center justify-center">
                  {activeScreenshotTab === 'dashboard' && (
                    <img
                      src="/screenshots/dashboard_overview.png"
                      alt="StableBonds Treasury Cockpit Giao diện"
                      className="rounded-lg border shadow-lg max-w-full h-auto object-contain animate-scale-in"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}
                  {activeScreenshotTab === 'ladder' && (
                    <img
                      src="/screenshots/bond_ladder.png"
                      alt="StableBonds Yield Ladder Builder Giao diện"
                      className="rounded-lg border shadow-lg max-w-full h-auto object-contain animate-scale-in"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}
                  {activeScreenshotTab === 'agent' && (
                    <img
                      src="/screenshots/agent_copilot.png"
                      alt="StableBonds AI Coprocessor Desk Giao diện"
                      className="rounded-lg border shadow-lg max-w-full h-auto object-contain animate-scale-in"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}
                  {activeScreenshotTab === 'otc' && (
                    <img
                      src="/screenshots/otc_secondary.png"
                      alt="StableBonds Secondary OTC Market Giao diện"
                      className="rounded-lg border shadow-lg max-w-full h-auto object-contain animate-scale-in"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}
                  {activeScreenshotTab === 'compliance' && (
                    <img
                      src="/screenshots/compliance.png"
                      alt="StableBonds Compliance Controls Giao diện"
                      className="rounded-lg border shadow-lg max-w-full h-auto object-contain animate-scale-in"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* AI Copilot Feature Banner */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="card-surface p-8 relative overflow-hidden border flex flex-col md:flex-row items-center gap-8 shadow-sm"
                style={{ borderColor: 'var(--border)', background: 'linear-gradient(to right, var(--canvas), rgba(16, 185, 129, 0.03))' }}>
                
                {/* Neon Glow decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] pointer-events-none rounded-full" />
                
                <div className="space-y-4 flex-grow text-left max-w-xl z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[var(--primary-soft)] text-[var(--primary)] border border-[var(--primary-border)]">
                    <Bot size={12} className="animate-pulse" />
                    Autonomous AI Copilot
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
                    Agentic Treasury Management
                  </h3>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    StableBonds integrates an intelligent AI Copilot powered by Lepton LLM. Simply describe your payouts, budget constraints, or yield targets in plain English:
                  </p>
                  <div className="bg-black/5 dark:bg-black/35 border rounded-xl p-3 font-mono text-[11px] text-[var(--primary)] border-[var(--border)]">
                    <span className="text-neutral-400 select-none">&gt; </span>
                    "Schedule 1,500 USDC to supply-vendor.eth for July 15th and maximize yield."
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--muted-foreground)]">
                    The agent automatically drafts optimized payment intents, calculates weighted maturity tranches, and queues multi-sig authorizations for compliance officers.
                  </p>
                </div>

                {/* Graphical Representation of AI Actions */}
                <div className="w-full md:w-64 border rounded-xl p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm space-y-3 shadow-inner shrink-0 z-10" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                    <Bot size={16} className="text-emerald-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground)]">Agent Telemetry</span>
                  </div>
                  
                  <div className="space-y-2 text-[10px]">
                    <div className="flex justify-between items-center bg-[var(--muted)] p-1.5 rounded">
                      <span className="text-neutral-400">Yield Strategy</span>
                      <span className="font-bold text-emerald-500">Max Yield (12% APY)</span>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--muted)] p-1.5 rounded">
                      <span className="text-neutral-400">Vault Allocation</span>
                      <span className="font-bold text-[var(--foreground)]">180d Junior Leg</span>
                    </div>
                    <div className="flex justify-between items-center bg-[var(--muted)] p-1.5 rounded">
                      <span className="text-neutral-400">Estimated Return</span>
                      <span className="font-bold text-emerald-500">+180.00 USDC</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[9px] text-neutral-400">
                    <span>Pending authorization</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Yield Tiers Summary */}
            <div className="card-surface max-w-4xl mx-auto p-8 mb-20 shadow-sm border" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-sm text-[var(--foreground)]">Current Yield Tiers</h3>
                <span className="text-xs text-[var(--muted-foreground)] font-medium">Rates updated in real-time</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                {[
                  { term: '30d', senior: '4.0%', junior: '8.0%' },
                  { term: '60d', senior: '4.5%', junior: '9.0%' },
                  { term: '90d', senior: '5.0%', junior: '10.0%' },
                  { term: '180d', senior: '5.5%', junior: '11.0%' },
                  { term: '365d', senior: '6.0%', junior: '12.0%' },
                ].map((tier) => (
                  <div key={tier.term} className="text-center p-4 rounded-xl border border-neutral-100/50 dark:border-neutral-900/50 transition-colors" style={{ background: 'var(--muted)' }}>
                    <div className="text-xs font-semibold text-[var(--muted-foreground)] mb-1.5 uppercase tracking-wide">{tier.term}</div>
                    <div className="text-base font-bold text-[var(--foreground)]">{tier.senior}</div>
                    <div className="text-xs text-[var(--success-foreground)] font-semibold mt-0.5">{tier.junior}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-4 text-[10px] text-[var(--muted-foreground)] font-medium">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--foreground)]"></span> Capital Protected</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--success)]"></span> Boosted Return</span>
              </div>
            </div>

            {/* Interactive ROI Calculator Section */}
            <div className="max-w-4xl mx-auto mb-20 border rounded-2xl p-8 bg-neutral-50/20 dark:bg-zinc-950/10 shadow-sm" style={{ borderColor: 'var(--border)' }}>
              <div className="text-center max-w-xl mx-auto mb-8">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Calculator</span>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-1">Project Your Treasury Return</h3>
                <p className="text-xs text-[var(--muted-foreground)] mt-2">Adjust your principal, duration, and risk profile to calculate your estimated yield return relative to typical bank cash deposits.</p>
              </div>

              <div className="grid md:grid-cols-12 gap-8 items-start">
                {/* Inputs */}
                <div className="md:col-span-7 space-y-6">
                  {/* Slider 1: Principal */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[var(--foreground)]">Treasury Allocation</span>
                      <span className="text-emerald-500 font-mono">${calcPrincipal.toLocaleString()} USDC</span>
                    </div>
                    <input 
                      type="range" 
                      min="10000" 
                      max="2000000" 
                      step="10000"
                      value={calcPrincipal} 
                      onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                      className="w-full accent-emerald-500" 
                    />
                    <div className="flex justify-between text-[10px] text-[var(--muted-foreground)] font-medium">
                      <span>$10,000 USDC</span>
                      <span>$2,000,000 USDC</span>
                    </div>
                  </div>

                  {/* Buttons 2: Duration */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--foreground)] block">Lock Duration</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[30, 60, 90, 180, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCalcDuration(d)}
                          className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                            calcDuration === d
                              ? 'bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]'
                              : 'bg-white dark:bg-zinc-900 border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Radio 3: Tranche */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[var(--foreground)] block">Risk / Yield Tranche</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setCalcTranche('senior')}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                          calcTranche === 'senior'
                            ? 'border-emerald-500 bg-emerald-500/5'
                            : 'border-[var(--border)] hover:border-neutral-400'
                        }`}
                      >
                        <span className="text-xs font-bold text-[var(--foreground)]">Senior Tranche</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">Capital protected. Standard yield curves (4.0% - 6.0% APY).</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalcTranche('junior')}
                        className={`p-3 text-left rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                          calcTranche === 'junior'
                            ? 'border-emerald-500 bg-emerald-500/5'
                            : 'border-[var(--border)] hover:border-neutral-400'
                        }`}
                      >
                        <span className="text-xs font-bold text-[var(--foreground)]">Junior Tranche</span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">Boosted yield curves (8.0% - 12.0% APY). Absorb short-term fluctuations.</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Outputs Panel */}
                <div className="md:col-span-5 border rounded-2xl p-6 bg-white dark:bg-zinc-950 space-y-5 shadow-inner" style={{ borderColor: 'var(--border)' }}>
                  <div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Yield Rate</span>
                    <span className="text-3xl font-extrabold text-emerald-500 font-mono">{calculatorYieldInfo.rate}% <span className="text-xs font-bold text-[var(--muted-foreground)]">APY</span></span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[var(--muted-foreground)]">Accrued Vault Yield</span>
                      <span className="font-bold text-emerald-500 font-mono">+${calculatorYieldInfo.earnings} USDC</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span className="text-[var(--muted-foreground)]">Traditional Bank Yield (0.1%)</span>
                      <span className="font-semibold text-neutral-400 font-mono">+${(calcPrincipal * 0.001 * (calcDuration / 365)).toFixed(2)} USDC</span>
                    </div>
                    <div className="flex justify-between items-center py-1 pt-3">
                      <span className="text-[var(--foreground)] font-bold">Total Settlement Value</span>
                      <span className="text-sm font-extrabold text-[var(--foreground)] font-mono">${calculatorYieldInfo.finalVal} USDC</span>
                    </div>
                  </div>
                  <div className="pt-2 text-[10px] text-[var(--muted-foreground)] leading-relaxed italic bg-[var(--muted)] p-2.5 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
                    Note: calculations are based on stable pool yield returns. Returns are simulated for illustration.
                  </div>
                </div>
              </div>
            </div>

            {/* Example Use Cases Section */}
            <div className="max-w-4xl mx-auto mb-20 animate-fade-in">
              <h3 className="font-bold text-center text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-6">
                Example Use Cases
              </h3>

              {/* Tab Buttons */}
              <div className="flex flex-wrap justify-center gap-2 mb-6 border-b pb-4" style={{ borderColor: 'var(--border)' }}>
                {useCases.map((item, idx) => {
                  const IconComponent = item.icon;
                  const isActive = activeUseCase === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveUseCase(idx)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border transition-all duration-200 cursor-pointer"
                      style={{
                        background: isActive ? 'var(--foreground)' : 'transparent',
                        borderColor: isActive ? 'var(--foreground)' : 'var(--border)',
                        color: isActive ? 'var(--background)' : 'var(--muted-foreground)',
                      }}
                    >
                      <IconComponent size={14} />
                      {item.title}
                    </button>
                  );
                })}
              </div>

              {/* Active Use Case Details */}
              <div className="card-surface p-8 relative overflow-hidden border flex flex-col gap-6 shadow-sm min-h-[220px] transition-all duration-300"
                style={{ borderColor: 'var(--border)', background: 'var(--canvas)' }}>
                
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border"
                    style={{ background: 'var(--muted)', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>
                    {useCases[activeUseCase].badge}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-[var(--muted-foreground)] uppercase">
                    Scenario #{activeUseCase + 1}
                  </span>
                </div>

                <p className="text-sm md:text-base italic leading-relaxed text-[var(--foreground)] font-medium z-10">
                  "{useCases[activeUseCase].scenario}"
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t z-10" style={{ borderColor: 'var(--border)' }}>
                  {useCases[activeUseCase].stats.map((stat, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <span className="text-[10px] uppercase font-bold tracking-wide text-[var(--muted-foreground)] block">
                        {stat.label}
                      </span>
                      <span className={`text-xs font-semibold ${stat.highlight ? 'text-[var(--success-foreground)] bg-[var(--success-soft)] px-2 py-0.5 rounded border border-[var(--success-border)] inline-block' : 'text-[var(--foreground)]'}`}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Decorative background quote mark */}
                <div className="absolute -top-4 -right-4 text-neutral-100/40 dark:text-neutral-900/40 pointer-events-none text-[120px] font-serif select-none leading-none">
                  "
                </div>
              </div>
            </div>

            {/* Why Teams Choose StableBonds */}
            <div className="max-w-4xl mx-auto mb-20 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Overview</span>
              <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-1 mb-8">Why Teams Choose StableBonds</h3>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                {[
                  { title: "Optimized Yield Generation", desc: "Access senior or junior tranche bond vaults structured to optimize idle corporate cash pools securely." },
                  { title: "Automated Smart Contract Settlements", desc: "No manual routing on maturity. Payout targets settle automatically at the scheduled block height." },
                  { title: "Circle WaaS & CCTP Integration", desc: "Seamless non-custodial custody integrations and cross-chain USDC bridging domains." },
                  { title: "EVM-Grade Security Standards", desc: "Audited smart contracts and strict role-based transaction policies enforced directly on-chain." },
                  { title: "Gasless Paymaster Support", desc: "We sponsor network transaction fees to eliminate complex gas token management for corporate finance." },
                  { title: "Autonomous Copilot Dispatch", desc: "Lepton LLM coprocessor reviews yield efficiency curves and schedules payout intents automatically." }
                ].map((item, idx) => (
                  <div key={idx} className="border rounded-xl p-5 bg-white/30 dark:bg-zinc-950/10 hover:border-emerald-500/50 transition-all" style={{ borderColor: 'var(--border)' }}>
                    <h4 className="text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Enterprise Security Section */}
            <div className="max-w-4xl mx-auto mb-20">
              <div className="text-center mb-8">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Security</span>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mt-1">Enterprise-Grade Security</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-5">
                {[
                  { title: "Smart Account Shield", icon: Lock, desc: "Leveraging Circle programmable wallets with passkeys and hardware signing." },
                  { title: "USDC Settlement Layer", icon: Shield, desc: "Direct settlement via Circle stablecoin rails, eliminating credit risks." },
                  { title: "Immutable Auditing Trail", icon: Clock, desc: "Every payout intent, approval step, and vault execution is logged on-chain." },
                  { title: "Compliance Controls", icon: CheckCircle2, desc: "AML/KYC integrations and transaction whitelisting built directly into vaults." },
                  { title: "Role-Based Approvals", icon: Users, desc: "Establish custom signature requirements (e.g., CFO approval required for >$20K)." },
                  { title: "Automated Approval Flows", icon: Calendar, desc: "Continuous checks against treasury bounds and target wallet verifications." }
                ].map((sec, idx) => {
                  const SecIcon = sec.icon;
                  return (
                    <div key={idx} className="border rounded-xl p-5 bg-white/20 dark:bg-zinc-950/5 hover:border-neutral-400 transition-all" style={{ borderColor: 'var(--border)' }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-500 mb-3 border border-emerald-500/20">
                        <SecIcon size={16} />
                      </div>
                      <h4 className="text-xs font-bold text-[var(--foreground)] mb-1.5">{sec.title}</h4>
                      <p className="text-[11px] text-[var(--muted-foreground)] leading-relaxed">{sec.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Operational Status Center */}
            <div id="status" className="max-w-4xl mx-auto mb-20 border rounded-2xl p-6 bg-white/40 dark:bg-zinc-950/40" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between pb-3 border-b mb-6" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">System Diagnostics</h3>
                </div>
                <button 
                  type="button" 
                  onClick={handleRefreshStatus}
                  className="flex items-center gap-1 text-[10px] font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--muted)] border rounded-md px-2 py-1 transition-all cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <RefreshCw size={10} className={statusHealth.engine === 'refreshing' ? 'animate-spin' : ''} />
                  <span>Refresh Node</span>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Treasury Engine", key: "engine", status: statusHealth.engine },
                  { name: "Settlement Network", key: "network", status: statusHealth.network },
                  { name: "USDC Routing Node", key: "routing", status: statusHealth.routing },
                  { name: "Compliance API", key: "api", status: statusHealth.api }
                ].map((s) => (
                  <div key={s.key} className="bg-black/5 dark:bg-black/20 p-3 rounded-lg border border-transparent hover:border-[var(--border)] transition-all">
                    <span className="text-[10px] font-bold text-[var(--muted-foreground)] block mb-1">{s.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'healthy' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider">{s.status === 'healthy' ? 'Operational' : 'Syncing'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Accordion Section */}
            <div className="max-w-3xl mx-auto mb-20">
              <h3 className="text-xl font-bold tracking-tight text-center text-[var(--foreground)] mb-8">
                Platform FAQ & Technical Details
              </h3>
              <div className="space-y-2">
                {faqData.map((faq, idx) => {
                  const isOpen = !!faqOpen[idx];
                  return (
                    <div 
                      key={idx} 
                      className="border rounded-xl overflow-hidden transition-all bg-white/20 dark:bg-zinc-950/10" 
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <button
                        type="button"
                        onClick={() => setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                        className="w-full flex items-center justify-between p-4 text-left font-bold text-xs text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={14} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-[11px] text-[var(--muted-foreground)] leading-relaxed border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Enterprise CTA & Book Demo Section */}
            <div className="max-w-4xl mx-auto mb-20 text-center border rounded-2xl p-10 bg-black text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 to-transparent pointer-events-none" />
              <Logo size={48} variant="icon" className="mx-auto mb-6 opacity-80" />
              <h3 className="text-2xl font-bold tracking-tight mb-2">Maximize your corporate capital efficiency</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mb-8">Schedule automated payment streams today. Secure yield via compliant bond tranches natively settled in USDC.</p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/app" className="bg-white text-black hover:bg-zinc-200 transition-all font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md">
                  <span>Launch Platform App</span>
                  <ArrowRight size={12} />
                </Link>
                <button 
                  type="button" 
                  onClick={() => setSupportOpen(true)}
                  className="bg-transparent border border-zinc-700 text-zinc-200 hover:text-white hover:border-white transition-all font-bold text-xs px-6 py-3 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Book Institution Demo</span>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      <Footer />

      {/* Global Floating Support Desk */}
      <div className="fixed bottom-6 right-6 z-50">
        {!supportOpen ? (
          <button
            type="button"
            onClick={() => setSupportOpen(true)}
            className="w-12 h-12 rounded-full bg-[#18181b] border border-zinc-800 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
            aria-label="Open support chat"
          >
            <MessageSquare size={20} className="text-emerald-400" />
          </button>
        ) : (
          <div className="w-80 h-96 bg-white dark:bg-zinc-950 border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in" style={{ borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="bg-[#18181b] text-white p-3.5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold">StableBonds Support Desk</span>
              </div>
              <button 
                type="button" 
                onClick={() => setSupportOpen(false)} 
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
            
            {/* Messages */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-neutral-50/50 dark:bg-black/50">
              {chatLogs.map((log, idx) => (
                <div key={idx} className={`flex ${log.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-2.5 rounded-xl text-[11px] max-w-[85%] leading-relaxed ${
                    log.sender === 'user' 
                      ? 'bg-black text-white dark:bg-zinc-800' 
                      : 'bg-white border text-[var(--foreground)] dark:bg-zinc-900'
                  }`} style={log.sender !== 'user' ? { borderColor: 'var(--border)' } : {}}>
                    {log.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Links Column */}
            <div className="px-4 py-2 border-t flex flex-wrap gap-1.5 bg-neutral-50 dark:bg-zinc-900/40 text-[9px] font-bold" style={{ borderColor: 'var(--border)' }}>
              <Link href="/docs" className="text-emerald-600 dark:text-emerald-500 hover:underline">API Reference</Link>
              <span className="text-neutral-400">·</span>
              <a href="#status" className="text-emerald-600 dark:text-emerald-500 hover:underline" onClick={() => setSupportOpen(false)}>System Health</a>
              <span className="text-neutral-400">·</span>
              <a href="https://github.com/liohio3012/StableBonds" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-500 hover:underline">GitHub</a>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendSupport} className="p-2 border-t flex gap-1.5" style={{ borderColor: 'var(--border)' }}>
              <input
                type="text"
                placeholder="Ask support..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                className="flex-grow bg-[var(--muted)] border rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-hidden focus:border-neutral-500"
                style={{ borderColor: 'var(--border)' }}
              />
              <button
                type="submit"
                className="bg-black text-white dark:bg-zinc-800 hover:bg-neutral-800 px-3 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Global Command Palette Overlay (Cmd/Ctrl + K) */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border rounded-2xl shadow-2xl overflow-hidden animate-scale-in" style={{ borderColor: 'var(--border)' }}>
            {/* Search Input */}
            <div className="p-4 border-b flex items-center gap-2.5 bg-neutral-50/50 dark:bg-zinc-900/50" style={{ borderColor: 'var(--border)' }}>
              <Search size={16} className="text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search resources, documents, or navigation paths..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow bg-transparent border-0 text-xs text-[var(--foreground)] focus:outline-hidden focus:ring-0"
                autoFocus
              />
              <button 
                type="button" 
                onClick={() => setCommandPaletteOpen(false)}
                className="text-[9px] font-bold bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded border text-[var(--muted-foreground)] cursor-pointer"
                style={{ borderColor: 'var(--border)' }}
              >
                ESC
              </button>
            </div>

            {/* Items List */}
            <div className="p-2 max-h-72 overflow-y-auto">
              <span className="text-[9px] font-bold text-[var(--muted-foreground)] uppercase tracking-wider px-3 py-1 block">NAVIGATION PATHS</span>
              {filteredNavItems.length > 0 ? (
                filteredNavItems.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.url}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all text-left"
                    onClick={() => setCommandPaletteOpen(false)}
                  >
                    <div>
                      <span className="text-xs font-bold text-[var(--foreground)] block">{item.name}</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">{item.desc}</span>
                    </div>
                    <ChevronRight size={12} className="text-neutral-400" />
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[var(--muted-foreground)] flex items-center justify-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>No results match your search query.</span>
                </div>
              )}
            </div>

            {/* Bottom Info */}
            <div className="bg-neutral-50 dark:bg-zinc-900/40 px-4 py-2.5 border-t text-[10px] text-[var(--muted-foreground)] flex justify-between font-medium" style={{ borderColor: 'var(--border)' }}>
              <span>Press Up/Down arrow to scroll</span>
              <span>Select route link to open</span>
            </div>
          </div>
        </div>
      )}

      {/* Structural full-width marquee from original (placed outside main flow) */}
      <div className="w-full overflow-hidden select-none" style={{ height: '56px', position: 'relative', margin: '3.5rem 0' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', transform: 'rotate(-1.2deg) scaleX(1.04)', transformOrigin: 'center' }}>
          <div className="w-full overflow-hidden border-y" style={{ padding: '11px 0', background: '#18181b', borderColor: '#27272a', boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 0 rgba(5,150,105,0.4) inset, 0 -2px 0 rgba(5,150,105,0.15) inset' }}>
            <style>{`
              @keyframes sbmarquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
              .animate-sb-marquee {
                display: flex;
                width: max-content;
                animation: sbmarquee 22s linear infinite;
              }
            `}</style>
            <div className="animate-sb-marquee flex gap-0">
              {[1, 2].map((loop) => (
                <div key={loop} className="flex shrink-0 items-center gap-8 px-10 text-[11px] font-black tracking-widest whitespace-nowrap" style={{ color: '#fafafa' }}>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m13 2-3 6.5h5L9 22"/></svg>
                    POWERED BY STABLEBONDS AI
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    CIRCLE WAAS &amp; SMART ACCOUNTS
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    LIVE ON ARC BLOCKCHAIN
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    APY UP TO 12.0%
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                    GASLESS USDC PAYMENTS
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    CROSS-CHAIN VIA CCTP
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                    AUTONOMOUS AI COPILOT
                  </span>
                  <span style={{ color: '#52525b' }}>—</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
}
