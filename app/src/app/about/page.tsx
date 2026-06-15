"use client";

import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Code, Users, Cpu, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <Logo size={28} />
          </Link>
          <Link href="/app" className="btn-secondary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1">
            <ArrowLeft size={13} />
            Back to App
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-foreground)] text-xs font-semibold">
            <Sparkles size={12} />
            <span>Swiss-Institutional Finance Model</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
            About StableBonds
          </h1>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            The next-generation corporate treasury and payment automation protocol built natively on the Arc blockchain. We enable enterprise cash to work smarter.
          </p>
        </div>

        {/* Section 1: The Core Protocol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">The Treasury Paradigm Shift</h2>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Traditional corporate treasuries hold massive fiat balances earning zero yields, subject to bank clearance times, processing delays, and expensive wire transfers. 
            </p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              StableBonds bridges enterprise finance with blockchain efficiency. By deploying funds on the **Arc blockchain** using native Circle **USDC** and **EURC**, companies can lock, stream, settle, and trade assets with sub-second finality and near-zero cost.
            </p>
          </div>
          <div className="card-surface p-6 space-y-4 bg-white/50 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
              <Cpu size={20} className="text-[var(--primary)]" />
            </div>
            <h3 className="font-semibold text-base">Arc Network Infrastructure</h3>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Leveraging the Arc Testnet, StableBonds utilizes USDC as a native gas token, eliminating the need for volatile third-party layer-1 utility coins. All operations confirm instantly with mathematical certainty.
            </p>
          </div>
        </div>

        {/* Section 2: Features Grid */}
        <div className="space-y-6 pt-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Our Core Design Principles</h2>
            <p className="text-xs text-[var(--muted-foreground)]">Engineered for absolute durability, compliance, and speed.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Shield size={18} />,
                title: "Absolute Security",
                desc: "Built with multi-signature governance, strict timelocks, and external double-audited vaults to guarantee absolute protection of assets."
              },
              {
                icon: <Code size={18} />,
                title: "Developer First",
                desc: "Every contract features comprehensive API bindings and SDK packages, making integrations into enterprise ERP software trivial."
              },
              {
                icon: <Users size={18} />,
                title: "Regulatory Ready",
                desc: "Engineered under strict compliance architectures compatible with MiCA requirements and corporate financial audit rules."
              }
            ].map((feature, i) => (
              <div key={i} className="card-surface p-5 space-y-3 bg-white/50 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Value Checklist */}
        <div className="card-surface p-8 bg-white/30 backdrop-blur-sm border-dashed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Why Global Firms Choose StableBonds</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                We design financial tools that match the speed of modern internet commerce. No cut-off times, no arbitrary limits, and automated smart triggers.
              </p>
            </div>
            <div className="space-y-2.5">
              {[
                "Sub-second transactional settlement times",
                "USDC-native gas token mechanics (no wallet noise)",
                "Full audit trails compatible with corporate compliance",
                "Fully non-custodial smart contracts",
                "MiCA-ready digital asset management framework"
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-[var(--muted-foreground)]">
                  <CheckCircle2 size={14} className="text-[var(--success)] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
