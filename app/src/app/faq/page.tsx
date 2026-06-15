"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';

interface FAQItem {
  q: string;
  a: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Security & Trust",
    q: "Is StablePay secure and non-custodial?",
    a: "Absolutely. StablePay operates entirely via non-custodial smart contracts. We utilize Circle's Web3-as-a-Service (WaaS) to instantiate smart wallets that reside in your device's hardware security enclave (via WebAuthn Passkeys). StablePay never holds, acts as custodian for, or has access to your private credentials."
  },
  {
    category: "Risk & Protocol",
    q: "What is the difference between Senior and Junior bond tranches?",
    a: "Senior tranches have the highest payout priority upon bond maturity, minimizing risk while securing a stable baseline yield (e.g. 4-6% APY). Junior tranches absorb first-loss risk within the ladder program but are rewarded with highly leveraged, variable yield returns (e.g. 8-12% APY)."
  },
  {
    category: "AI Allocation Agent",
    q: "How does the Autonomous AI Copilot make deposit decisions?",
    a: "The Agent analyzes your raw corporate invoice metadata (due dates, priority labels, categories) via a secure DeepSeek AI routing pipeline. It determines the optimal yield ladder program, dividing capital across Senior/Junior tranches and maturities (30d, 90d, 180d) to ensure cash unlocks precisely when your vendor payments are due."
  },
  {
    category: "AI Allocation Agent",
    q: "What is the x402 Micropayment Protected gate?",
    a: "To secure our AI optimization routes against bot spam and denial-of-service attempts, we employ a custom HTTP 402 (Payment Required) filter. Using your smart account, the platform executes a micro-transaction of 0.001 USDC on-chain to unlock DeepSeek's decision engine, ensuring highly secure, pay-per-use machine-to-machine interactions."
  },
  {
    category: "Gas & Network",
    q: "Do I need native gas tokens (like ETH) to run transactions?",
    a: "No. StablePay is built natively on the Arc Testnet where gas fees are settled directly in USDC. Additionally, our Circle smart accounts support gasless transaction sponsorship via developer Paymaster contracts, providing a smooth, web2-like corporate dashboard experience."
  },
  {
    category: "General",
    q: "Is the platform free to use during the hackathon/sandbox?",
    a: "Yes. Testing on the Arc Testnet is completely free. We provide a visual unified balance panel and faucets within the dashboard so corporate treasurers and judges can immediately simulate capital streams without deploying real capital."
  },
  {
    category: "General",
    q: "How do I get started?",
    a: "Navigate to the /app portal, create a corporate wallet using your email or biometric Passkey, fund your test account with USDC, and start building staggered yield ladders or scheduling vendor payments."
  }
];

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const filteredFAQ = FAQ_ITEMS.filter(item => 
    item.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.a.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col justify-between">
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

      {/* Main Container */}
      <main className="flex-grow max-w-3xl w-full mx-auto px-6 py-16 space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <HelpCircle size={40} className="mx-auto text-[var(--primary)]" />
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Frequently Asked Questions</h1>
          <p className="text-sm text-[var(--muted-foreground)] max-w-md mx-auto">
            Find immediate answers regarding risk management, security enclaves, autonomous agents, and transaction flows.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
          <input 
            type="text" 
            placeholder="Search questions, categories, or keywords..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border bg-slate-50/50 dark:bg-neutral-900/50 shadow-inner focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {filteredFAQ.length > 0 ? (
            filteredFAQ.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index} 
                  className="card-surface p-4 transition-all duration-200 hover:shadow-xs cursor-pointer select-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="flex justify-between items-center gap-4">
                    <div className="space-y-1 text-left">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-soft)] px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <h3 className="font-semibold text-sm text-[var(--foreground)] mt-1">{item.q}</h3>
                    </div>
                    <div className="text-[var(--muted-foreground)] shrink-0">
                      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs leading-relaxed text-[var(--muted-foreground)] text-left animate-fade-in">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-xs text-[var(--muted-foreground)] card-surface">
              No answers found for "{searchTerm}". Try general terms like "USDC" or "Passkey".
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
}
