"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: "Starter Corp",
      tagline: "For early stage startups managing initial reserves.",
      priceMonthly: 0,
      priceAnnual: 0,
      features: [
        "Up to 2 Active Treasury Vaults",
        "Standard Yield Streaming (USDC/EURC)",
        "Single-signer Vault Operations",
        "Standard Arc Testnet RPC access",
        "Community & Forum Technical Support",
        "MiCA standard compliance reporting"
      ],
      cta: "Launch Starter",
      popular: false
    },
    {
      name: "Enterprise Desk",
      tagline: "For mid-to-large institutions requiring automation.",
      priceMonthly: 199,
      priceAnnual: 149,
      features: [
        "Unlimited Treasury Vaults",
        "Accelerated Yield Compound Streaming",
        "Multi-Signature desk (up to 7 signers)",
        "Keeper automation (scheduled payouts)",
        "Priority dedicated Arc API access",
        "Advanced Agent Copilot assistance",
        "Next-business-day SLA support",
        "SOC 2 compliance reporting tool"
      ],
      cta: "Contact Sales / Try Enterprise",
      popular: true
    },
    {
      name: "Custom Custody",
      tagline: "For multi-national groups and sovereign funds.",
      priceMonthly: "Custom",
      priceAnnual: "Custom",
      features: [
        "Bespoke smart contract deployments",
        "Private dedicated node RPC instances",
        "Multi-signature desk (unlimited signers)",
        "On-premise hardware security (HSM) setups",
        "Full SOC 2 Type II audit data room",
        "24/7/365 Dedicated Discord & Phone support",
        "Custom DPA (Data Processing Agreement)"
      ],
      cta: "Schedule Consultation",
      popular: false
    }
  ];

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

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        
        {/* Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-foreground)] text-xs font-semibold">
            <Sparkles size={12} />
            <span>Transparent Pricing · Arc Native Gas</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
            Institutional Pricing Plans
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
            Configure the ideal scale for your corporate treasury operations. No hidden management charges. All fees settle directly in USDC/EURC.
          </p>

          {/* Billing Switch */}
          <div className="pt-4 flex items-center justify-center gap-2">
            <div className="inline-flex p-1 rounded-lg border bg-white" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  billingPeriod === 'monthly' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)]'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  billingPeriod === 'annual' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted-foreground)]'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[9px] bg-[var(--success-soft)] text-[var(--success-foreground)] border border-[var(--success-border)] px-1 rounded">Save 25%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, i) => {
            const isCustom = typeof plan.priceAnnual === 'string';
            const price = billingPeriod === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            
            return (
              <div 
                key={i} 
                className={`card-surface p-6 flex flex-col justify-between relative bg-white/60 backdrop-blur-sm transition-all duration-200 ${
                  plan.popular ? 'border-2' : ''
                }`}
                style={{ 
                  borderColor: plan.popular ? 'var(--primary)' : 'var(--border)',
                  boxShadow: plan.popular ? '0 10px 30px rgba(0,0,0,0.06)' : 'var(--shadow-xs)'
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider bg-[var(--primary)] text-white">
                    Most Popular
                  </div>
                )}
                
                <div className="space-y-5">
                  <div>
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">{plan.tagline}</p>
                  </div>

                  <div className="py-2 border-b border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-3xl font-extrabold tracking-tight">
                      {isCustom ? price : `$${price}`}
                    </span>
                    {!isCustom && (
                      <span className="text-xs text-[var(--muted-foreground)] ml-1">
                        / month {billingPeriod === 'annual' ? '(billed annually)' : ''}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted-foreground)]">
                        <Check size={14} className="text-[var(--success)] shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                  <Link href="/" className={`w-full block text-center py-2 px-4 rounded-lg text-xs font-semibold transition-all ${
                    plan.popular 
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}>
                    {plan.cta}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gas explanation banner */}
        <div className="card-surface p-6 bg-white/40 backdrop-blur-sm border-dashed flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/10 flex items-center justify-center shrink-0">
              <AlertCircle size={20} className="text-blue-600" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm">USDC Gas Architecture Details</h4>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed max-w-xl">
                Unlike Ethereum/Base, StableBonds transactions on Arc consume USDC directly to pay network fees. You never need to hold volatile network tokens like ETH or SOL.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 font-mono text-[10px] font-bold rounded-lg border border-blue-200 shrink-0">
            Average transaction cost: ~0.01 USDC
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
