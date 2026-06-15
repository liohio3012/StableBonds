"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal, Copy, Check, Shield, Code2, Server } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';
import { toast } from 'sonner';

export default function DocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast.success("Code snippet copied to clipboard");
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const codeSnippets = {
    setup: `// Install SDK
npm install @StableBonds/sdk-core viem

// Configure Client on Arc Testnet
import { createPublicClient, http } from 'viem';
import { arcTestnet } from '@StableBonds/chains';

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network')
});`,

    yield: `// Initialize Yield Stream
import { YieldStreamerClient } from '@StableBonds/sdk-core';

const streamer = new YieldStreamerClient({
  vaultAddress: '0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A',
  signer: privateKeyOwner
});

// Deposit & start earning 5% native interest instantly
const tx = await streamer.depositAndStream({
  amount: 5000000000n, // 5,000 USDC (6 decimals)
  recipient: '0xVendorAddress...'
});

console.log('Stream active. Tx Hash:', tx.hash);`,

    multisig: `// Initiate automated Multi-Signature proposal
const proposal = await vault.proposeTransaction({
  to: '0xRecipientAddress...',
  value: 0n,
  data: '0x...', // call payload
  timelockSeconds: 86400 // 24 hours governance lock
});

// Listen for signers approval
await vault.approveProposal(proposal.id);`
  };

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

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Navigation (Sidebar) */}
          <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-20 h-fit">
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Developer Guides</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#quickstart" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Quickstart Setup</a></li>
                <li><a href="#yield-streaming" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Yield Streaming API</a></li>
                <li><a href="#multisig" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Multi-Sig Architecture</a></li>
                <li><a href="#contract-addresses" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Contract Addresses</a></li>
              </ul>
            </div>

            <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2 text-xs">
                <Terminal size={14} className="text-[var(--muted-foreground)]" />
                <span className="font-semibold">Client Version:</span>
                <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded text-[10px]">v1.4.2</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Server size={14} className="text-[var(--muted-foreground)]" />
                <span className="font-semibold">Arc Network:</span>
                <span className="font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">Active</span>
              </div>
            </div>
          </div>

          {/* Right Side: Docs Content & Code Blocks */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* Header info */}
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-gradient">StableBonds Developer Documentation</h1>
              <p className="text-sm text-[var(--muted-foreground)] max-w-2xl">
                Learn how to programmatically interact with StableBonds treasury vaults, deploy multi-signature approvals, and trigger automated yield streaming on the Arc blockchain.
              </p>
            </div>

            {/* Section 1: Quickstart */}
            <div id="quickstart" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">1</div>
                <h2 className="text-lg font-bold">Quickstart Installation & Client Setup</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                To start programmatically interacting with the StableBonds system, install the core SDK and initialize a Viem client configured for Arc Testnet RPC endpoints.
              </p>

              {/* Code Panel */}
              <div className="relative rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100 font-mono text-xs p-4 shadow-lg" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => copyToClipboard(codeSnippets.setup, 'setup')}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1.5 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  {copiedSection === 'setup' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{codeSnippets.setup}</pre>
              </div>
            </div>

            {/* Section 2: Yield Streaming API */}
            <div id="yield-streaming" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">2</div>
                <h2 className="text-lg font-bold">Programmatic Yield Streaming API</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Deploy vaults that accumulate interest automatically. By streaming yield, you keep control of your principal while dispatching continuous interest settlements to vendors.
              </p>

              {/* Code Panel */}
              <div className="relative rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100 font-mono text-xs p-4 shadow-lg" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => copyToClipboard(codeSnippets.yield, 'yield')}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1.5 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  {copiedSection === 'yield' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{codeSnippets.yield}</pre>
              </div>
            </div>

            {/* Section 3: Multi-Sig Desk */}
            <div id="multisig" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">3</div>
                <h2 className="text-lg font-bold">Multi-Signature Vault Governance</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                For corporate safety, large outflows require multiple signatures. The SDK supports submitting, indexing approvals, and triggering executions once thresholds are reached.
              </p>

              {/* Code Panel */}
              <div className="relative rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100 font-mono text-xs p-4 shadow-lg" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => copyToClipboard(codeSnippets.multisig, 'multisig')}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1.5 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  {copiedSection === 'multisig' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{codeSnippets.multisig}</pre>
              </div>
            </div>

            {/* Section 4: Contract Addresses */}
            <div id="contract-addresses" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">4</div>
                <h2 className="text-lg font-bold">Verified Smart Contract Addresses (Arc Testnet)</h2>
              </div>
              <div className="card-surface overflow-hidden bg-white/40 backdrop-blur-sm">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--muted)' }}>
                      <th className="p-3 font-semibold text-[var(--foreground)]">Contract Name</th>
                      <th className="p-3 font-semibold text-[var(--foreground)]">Chain ID</th>
                      <th className="p-3 font-semibold text-[var(--foreground)]">On-Chain Contract Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="p-3 font-medium">StableVaultManager</td>
                      <td className="p-3 font-mono">5042002 (Arc)</td>
                      <td className="p-3 font-mono text-[var(--primary)]">0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A</td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="p-3 font-medium">YieldRegistry</td>
                      <td className="p-3 font-mono">5042002 (Arc)</td>
                      <td className="p-3 font-mono text-[var(--primary)]">0x8B321fde2767bE818Cd2F6846b0A3522E90D3496</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">USDC GasWrapper</td>
                      <td className="p-3 font-mono">5042002 (Arc)</td>
                      <td className="p-3 font-mono text-[var(--primary)]">0x0000000000000000000000000000000000000009</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
