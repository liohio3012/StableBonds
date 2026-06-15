"use client";

import React from 'react';
import { Shield, CalendarClock, TrendingUp, ArrowRight, CheckCircle2, Lock, Clock } from 'lucide-react';
import Logo from "@/components/enterprise/Logo";
import Footer from "@/components/enterprise/Footer";
import Link from 'next/link';

function WelcomeOnboarding() {
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
          <Link href="/app" className="btn-primary gap-2 px-5 py-2.5 text-sm flex items-center">
            Get Started
            <ArrowRight size={15} />
          </Link>
          <Link href="/app" className="btn-secondary px-5 py-2.5 text-sm flex items-center">
            View Dashboard
          </Link>
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
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo size={28} className="cursor-pointer" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app" className="btn-primary text-xs gap-1.5 px-4 py-1.5 flex items-center font-semibold tracking-wide">
              Launch App
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-grow flex max-w-7xl w-full mx-auto relative px-4 md:px-6 py-8">
        <main className="flex-grow">
          <WelcomeOnboarding />
        </main>
      </div>

      <Footer />
    </div>
  );
}
