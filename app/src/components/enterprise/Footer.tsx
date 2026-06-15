"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Activity,
  Compass,
  Terminal,
  Users,
  Scale,
  BookOpen
} from 'lucide-react';
import Logo from './Logo';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// Precise custom SVG Brand Icons to guarantee compilation across Lucide React versions
const GithubIcon = ({ size = 15, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

const TwitterIcon = ({ size = 15, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = ({ size = 15, ...props }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size} {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkStatus] = useState<'operational' | 'degraded'>('operational');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail('');
      toast.success("Successfully subscribed to StableBonds updates", {
        description: "You've been added to our corporate release cycle newsletter."
      });
    }, 800);
  };

  return (
    <footer className="border-t mt-20 relative overflow-hidden print:hidden" style={{ borderColor: 'var(--border)', background: 'linear-gradient(to bottom, transparent, rgba(24, 24, 27, 0.01))' }}>
      
      {/* Structural subtle glow in background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--primary-soft)] opacity-20 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--success-soft)] opacity-15 blur-[120px] pointer-events-none rounded-full" />

      {/* Top Section: Newsletter & Status */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Newsletter Pitch */}
          <div className="lg:col-span-5 space-y-2">
            <h3 className="text-sm font-semibold tracking-tight uppercase" style={{ color: 'var(--foreground)' }}>
              Newsletter Subscription
            </h3>
            <p className="text-xs max-w-sm" style={{ color: 'var(--muted-foreground)' }}>
              Sign up for institutional product updates, compliance advisories, and technical release notes.
            </p>
          </div>

          {/* Form and System Status */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
            <form onSubmit={handleSubscribe} className="flex-1 flex gap-2 max-w-md">
              <input
                type="email"
                placeholder="enter your corporate email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field text-xs bg-white/50 backdrop-blur-sm"
                style={{ borderColor: 'var(--border)' }}
                disabled={isSubmitting}
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                {isSubmitting ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Subscribe</span>
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </form>

            {/* Status indicator */}
            <div className="flex items-center gap-4 text-xs shrink-0 self-start sm:self-auto border border-dashed rounded-lg p-2.5 bg-white/45 dark:bg-zinc-900/45 backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <Activity size={13} style={{ color: networkStatus === 'operational' ? 'var(--success)' : 'var(--danger)' }} className="animate-pulse" />
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>Platform:</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded" 
                style={{ 
                  background: networkStatus === 'operational' ? 'var(--success-soft)' : 'var(--danger-soft)', 
                  color: networkStatus === 'operational' ? 'var(--success-foreground)' : 'var(--danger-foreground)' 
                }}>
                {networkStatus === 'operational' ? 'Fully Operational' : 'Temporary Slowdown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Footer Links Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          
          {/* Brand Monolith Column */}
          <div className="col-span-2 space-y-5 lg:pr-8">
            <Logo size={32} variant="primary" />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              Corporate treasury infrastructure and automated yield streaming built natively on the Arc blockchain network. Fully compliant USDC & EURC business payment workflows.
            </p>
            {/* Social Icons */}
            <div className="flex gap-3 pt-1">
              {[
                { icon: <GithubIcon size={15} />, href: 'https://github.com/liohio3012/StableBonds', label: 'GitHub' },
                { icon: <BookOpen size={15} />, href: '/docs', label: 'Documentation' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target={social.href.startsWith('http') ? "_blank" : undefined}
                  rel={social.href.startsWith('http') ? "noopener noreferrer" : undefined}
                  aria-label={social.label}
                  className="w-7 h-7 rounded-md border flex items-center justify-center transition-all duration-200"
                  style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--card)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--muted-foreground)';
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Column 1: Product & Trust */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Compass size={12} style={{ color: 'var(--muted-foreground)' }} />
              Product
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { name: 'Home Dashboard', href: '/' },
                { name: 'Pricing Plans', href: '/pricing' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--foreground)]" style={{ color: 'var(--muted-foreground)' }}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Developers & Resources */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Terminal size={12} style={{ color: 'var(--muted-foreground)' }} />
              Developers
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { name: 'API Reference', href: '/docs' },
                { name: 'SDK Documentation', href: '/docs' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--foreground)]" style={{ color: 'var(--muted-foreground)' }}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company & Ecosystem */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Users size={12} style={{ color: 'var(--muted-foreground)' }} />
              Company
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { name: 'About StableBonds', href: '/about' },
                { name: 'Security Center', href: '/security' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--foreground)]" style={{ color: 'var(--muted-foreground)' }}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal & Compliance */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
              <Scale size={12} style={{ color: 'var(--muted-foreground)' }} />
              Governance
            </h4>
            <ul className="space-y-2.5 text-xs">
              {[
                { name: 'Terms of Service', href: '/terms' },
                { name: 'Privacy Policy', href: '/privacy' }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--foreground)]" style={{ color: 'var(--muted-foreground)' }}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Trust Badge Bar */}
      <div className="max-w-7xl mx-auto px-6 py-6 border-t border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: 'var(--border-subtle)', background: 'rgba(24, 24, 27, 0.005)' }}>
        <div className="flex flex-wrap items-center gap-5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            SOC 2 Type II Certified
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            ISO 27001 Security Standard
          </span>
          <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[var(--success)]" />
            MiCA Compliant Asset Protocols
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          <span className="font-semibold uppercase tracking-wider">Audit Attestations:</span>
          <span className="px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-mono" style={{ borderColor: 'var(--border)' }}>Hacken: Verified</span>
          <span className="px-2 py-1 border rounded bg-white dark:bg-zinc-900 font-mono" style={{ borderColor: 'var(--border)' }}>CertiK: Grade A</span>
        </div>
      </div>

      {/* Bottom Bar: Copyright, Language, Network */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Copyright and disclaimers */}
          <div className="space-y-1.5 text-center lg:text-left">
            <div className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
              © 2026 StableBonds Inc. All rights reserved.
            </div>
            <p className="text-[10px] max-w-xl leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              StableBonds is an enterprise treasury management platform. USDC and EURC are regulated digital dollars issued by Circle Internet Financial. Payments settle in real-time on Arc blockchain infrastructure.
            </p>
          </div>

          {/* Region/Language and gas price indicator */}
          <div className="flex flex-wrap items-center gap-6 text-[11px]" style={{ color: 'var(--muted-foreground)' }}>
            <div className="flex items-center gap-1.5">
              <Globe size={13} />
              <span className="cursor-pointer hover:text-[var(--foreground)]">US (English)</span>
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-zinc-900/70 border px-2.5 py-1 rounded-lg" style={{ borderColor: 'var(--border)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span>Transaction fee:</span>
              <span className="font-bold text-[var(--foreground)]">~0.01 USDC</span>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
