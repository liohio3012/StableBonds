"use client";

import React from 'react';
import { Shield, CalendarClock, TrendingUp, ArrowRight, CheckCircle2, Lock, Clock, Calendar } from 'lucide-react';
import Logo from "@/components/enterprise/Logo";
import Footer from "@/components/enterprise/Footer";
import Link from 'next/link';

// Local Tooltip Component
function Tooltip({ text }: { text: string }) {
  const [isVisible, setIsVisible] = React.useState(false);
  return (
    <span className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors cursor-pointer"
        aria-label="More info"
      >
        <CheckCircle2 size={13} className="text-[var(--success)]" />
      </button>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs font-medium leading-snug w-52 z-50 shadow-lg animate-fade-in text-left"
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

function WelcomeOnboarding() {
  return (
    <div className="animate-fade-in relative">
      {/* Background Ambient Blobs */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-96 h-96 rounded-full bg-amber-400/5 blur-[140px] pointer-events-none"></div>

      {/* Hero */}
      <div className="max-w-3xl mx-auto text-center pt-10 pb-12">
        <Logo size={64} variant="icon" className="mx-auto mb-6 hover:rotate-12 transition-transform duration-300" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold mb-6"
          style={{ background: 'var(--success-soft)', color: 'var(--success-foreground)', border: '1px solid var(--success-border)' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--success)' }}></span>
          Live on Arc Testnet
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

        {/* Sleek Hero Graphic Illustration */}
        <div className="mt-14 max-w-4xl mx-auto rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] bg-white/50 dark:bg-black/50 backdrop-blur-xs p-2.5 animate-scale-in">
          <img 
            src="/stablepay_hero_graphic.png" 
            alt="StablePay Treasury Yield Growth Graphics" 
            className="w-full h-auto rounded-xl object-cover border border-neutral-100/50 dark:border-neutral-900/50"
          />
        </div>
      </div>

      {/* How it works — 3-column grid */}
      <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto mb-20">
        {[
          {
            icon: <CalendarClock size={20} />,
            title: "Schedule payment",
            desc: "Enter amount, due date, and vendor address. Choose your yield tier.",
          },
          {
            icon: <TrendingUp size={20} />,
            title: "Earn yield",
            desc: "Funds earn 4-12% APY in USDC bond vaults until the maturity date.",
          },
          {
            icon: <CheckCircle2 size={20} />,
            title: "Auto-settle",
            desc: "On the due date, principal is delivered to your vendor automatically.",
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

      {/* Yield tiers summary */}
      <div className="card-surface max-w-4xl mx-auto p-8 mb-20 shadow-sm border" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-sm text-[var(--foreground)]">Current Yield Tiers</h3>
          <span className="text-xs text-[var(--muted-foreground)] font-medium">Updated live from smart contract</span>
        </div>
        <div className="grid grid-cols-5 gap-3.5">
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
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--foreground)]"></span> Senior Tranche</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[var(--success)]"></span> Junior Tranche</span>
        </div>
      </div>

      {/* Interactive Testimonial Section */}
      <div className="max-w-4xl mx-auto mb-20 animate-fade-in">
        <h3 className="font-bold text-center text-xs uppercase tracking-wider text-[var(--muted-foreground)] mb-6">
          Trusted by Enterprise Treasuries
        </h3>
        
        <div className="card-surface p-8 relative overflow-hidden border flex flex-col md:flex-row items-center gap-8 shadow-sm" 
          style={{ borderColor: 'var(--border)', background: 'var(--canvas)' }}>
          {/* Quote icon background decoration */}
          <div className="absolute -top-4 -right-4 text-neutral-100/40 dark:text-neutral-900/40 pointer-events-none text-[120px] font-serif select-none leading-none">
            “
          </div>
          
          {/* Circular Headshot Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-emerald-500/30 shadow-md shrink-0 bg-neutral-100">
            <img 
              src="/treasurer_avatar.png" 
              alt="Marc Werner" 
              className="w-full h-full object-cover scale-105"
            />
          </div>

          <div className="space-y-3 flex-grow text-center md:text-left">
            <p className="text-sm md:text-base italic leading-relaxed text-[var(--foreground)] font-medium">
              "StablePay completely modernized our B2B vendor payouts. By placing our invoice settlement funds into Arc bond vaults, we earned over $45,000 in passive yield this quarter alone. The auto-maturity execution is flawless."
            </p>
            <div>
              <h4 className="font-bold text-sm text-[var(--foreground)]">Marc Werner</h4>
              <p className="text-xs text-[var(--muted-foreground)]">VP of Treasury, Helvetia Logistical Group</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trust footer */}
      <div className="border-t pt-8 pb-4" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
            <Shield size={14} className="text-[var(--success)]" />
            Bank-grade custody
          </div>
          <div className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
            <Lock size={14} />
            Circle WaaS + CCTP
          </div>
          <div className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
            <Clock size={14} />
            Sub-second finality
          </div>
          <div className="flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
            <CheckCircle2 size={14} />
            USDC gas fees
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col relative"
      style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {/* Navbar - Larger and easier to read */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo size={36} className="cursor-pointer" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app" className="btn-primary text-sm gap-2 px-6 py-2.5 flex items-center font-bold tracking-wide rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm">
              Launch App
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-grow flex max-w-7xl w-full mx-auto relative px-6 py-12">
        <main className="flex-grow">
          <WelcomeOnboarding />
        </main>
      </div>

      <Footer />
    </div>
  );
}
