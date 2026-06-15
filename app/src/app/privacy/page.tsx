"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';

export default function PrivacyPage() {
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
            <span className="text-xs uppercase font-bold tracking-wider">Data Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Last modified: June 15, 2026</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-xs text-[var(--muted-foreground)] leading-relaxed">
          
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">1. Information We Collect</h2>
            <p>
              StablePay enforces a strict data minimization protocol. We do not require usernames, passwords, or personal identity details to access the core treasury interface. The only data processed is public key wallet addresses, transaction payloads, and basic browser cookies used for analytical telemetry.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">2. Public Ledger Transparency</h2>
            <p>
              By design, all interactions with StablePay treasury vaults (deposits, yield stream triggers, payouts, multi-sig approvals) are recorded permanently on the Arc public blockchain network. This data is entirely public, indexed by nodes, and visible to third parties. We cannot remove, delete, or modify any information written to the block database.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">3. Circle Auth Integration</h2>
            <p>
              StablePay supports authenticated corporate sign-ons using Circle's developer tools. If you choose to configure a Circle profile, your credential processing is handled directly under Circle's independent Privacy Policy, utilizing secure JSON Web Tokens (JWT).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">4. Compliance & Third-Party Analytics</h2>
            <p>
              To maintain system performance and security, basic non-personally identifiable metadata (IP ranges, device specifications, error logs) is processed using security endpoints. This allows us to mitigate DDoS threats and trace system crashes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-[var(--foreground)]">5. Your Legal Rights</h2>
            <p>
              Under regional data privacy frameworks (such as the GDPR and CCPA), you hold rights to restrict or export the metadata we process. Because blockchain transactions are permanent, your Right to be Forgotten cannot be applied to ledger-native datasets.
            </p>
          </section>

        </div>

      </main>

      <Footer />
    </div>
  );
}
