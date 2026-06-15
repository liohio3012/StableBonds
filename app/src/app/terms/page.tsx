"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';

export default function TermsPage() {
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

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        
        {/* Title */}
        <div className="space-y-3 border-b pb-6" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="inline-flex items-center gap-2 text-[var(--muted-foreground)]">
            <Scale size={16} />
            <span className="text-xs uppercase font-bold tracking-wider">Legal Framework</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Last modified: June 15, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-[var(--muted-foreground)] leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">1. General Undertaking</h2>
            <p>
              These Terms of Service governs the use of the StableBonds corporate treasury platforms, smart contracts, SDK packages, and auxiliary services. By accessing, connecting an EOA wallet, or interacting with the Smart Accounts, you acknowledge and agree to stay bound under these guidelines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">2. Blockchain Native Risk Acknowledgement</h2>
            <p>
              StableBonds operates as a non-custodial decentralized application deployed on the Arc blockchain network. All transactions, yield collection rules, settlements, and timelocks are executed strictly on-chain and are irreversible. You assume absolute responsibility for securing private keys, managing wallet credentials, and verifying destination vendor accounts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">3. Yield Accumulation & Assets</h2>
            <p>
              StableBonds supports automated yield streaming and interest payouts in USDC and EURC stablecoins. All stablecoin assets are issued by Circle Internet Financial, LLC. StableBonds does not guarantee third-party peg values, liquidity ratios, or operational uptime of external issuers or network RPC providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">4. Compliance & Licensing</h2>
            <p>
              You certify that your corporate treasury operations comply with relevant localized anti-money laundering (AML) laws and digital asset management statutes (including the MiCA regulations within the European Economic Area). StableBonds reserves the right to restrict application UI access in blacklisted jurisdictions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">5. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted under applicable laws, StableBonds and its developers shall not be liable for any direct, indirect, incidental, or consequential damages resulting from transaction delays, network outages, wallet compromises, or gas cost volatility on the Arc network.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  );
}
