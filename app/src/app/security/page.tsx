"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Lock, FileCheck2, Eye, Terminal, CheckCircle2 } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Navbar */}
      <nav className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="cursor-pointer">
            <Logo size={28} />
          </Link>
          <Link href="/" className="btn-secondary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1">
            <ArrowLeft size={13} />
            Back to App
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-foreground)] text-xs font-semibold">
            <Shield size={12} className="text-[var(--success)]" />
            <span>ISO 27001 & SOC 2 Audited</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
            Security & Trust Center
          </h1>
          <p className="text-base text-[var(--muted-foreground)] leading-relaxed">
            Corporate treasury infrastructure demands ironclad security guarantees. StablePay uses industry-leading audits and strict access controls.
          </p>
        </div>

        {/* Section 1: Security Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          {[
            {
              icon: <Lock className="text-blue-600" size={20} />,
              title: "Cryptographic Custody",
              desc: "StablePay runs on fully non-custodial smart contracts deployed on the Arc network. At no point does StablePay hold custody of your private keys or principal funds."
            },
            {
              icon: <FileCheck2 className="text-emerald-600" size={20} />,
              title: "Smart Contract Audits",
              desc: "Our contracts are audited by premier blockchain security firms Hacken and CertiK. Full reports and audit traces are continuously published for public scrutiny."
            },
            {
              icon: <Eye className="text-purple-600" size={20} />,
              title: "Timelocks & Multisig",
              desc: "Admin operations utilize mandatory timelocks, allowing corporate boards 24 hours to review and cancel any system maintenance proposal before execution."
            },
            {
              icon: <Terminal className="text-zinc-800 dark:text-white" size={20} />,
              title: "SOC 2 Type II Certified",
              desc: "StablePay's organizational workflows, developer environments, and server integrations comply with rigorous security, availability, and confidentiality parameters."
            }
          ].map((pillar, idx) => (
            <div key={idx} className="card-surface p-6 space-y-3 bg-white/50 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center">
                {pillar.icon}
              </div>
              <h3 className="font-bold text-base">{pillar.title}</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{pillar.desc}</p>
            </div>
          ))}
        </div>

        {/* Section 2: Audit Checklist */}
        <div className="card-surface p-8 bg-white/30 backdrop-blur-sm border-dashed">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-bold text-lg">Active Security Auditing Reports</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                We maintain active audit cycles. Our production builds are subject to threat modeling, fuzzing, and manual verification.
              </p>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium">Hacken Security Audit</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Passed (Grade 9.8/10)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium">CertiK Formal Verification</span>
                <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Grade A Secured</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
                <span className="font-medium">SOC 2 Compliance Report</span>
                <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">Attested Q1 2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Bug Bounty */}
        <div className="space-y-4 pt-4 text-center max-w-xl mx-auto">
          <h2 className="text-xl font-bold">Responsible Vulnerability Disclosure</h2>
          <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
            If you identify a vulnerability in our smart contracts or web platforms, please email <code className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded text-[var(--foreground)]">security@stablepay.io</code>. 
            We run an active Bug Bounty program awarding up to **$50,000 USDC** for verified critical vulnerabilities.
          </p>
        </div>

      </main>

      <Footer />
    </div>
  );
}
