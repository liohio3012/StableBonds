"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Terminal, Copy, Check, Shield, Server, ExternalLink, BookOpen, Zap, Wallet } from 'lucide-react';
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
    setup: `// StableBonds uses viem + wagmi — no custom SDK required
// Install dependencies
npm install viem wagmi @circle-fin/web3-services-sdk

// Configure a public client on Arc Testnet
import { createPublicClient, http } from 'viem';
import { arcTestnet } from 'viem/chains';

const client = createPublicClient({
  chain: arcTestnet,               // Chain ID: 5042002
  transport: http('https://rpc.testnet.arc.network')
});

// Verify connection
const block = await client.getBlockNumber();
console.log('Connected to Arc. Block:', block);`,

    balance: `// Read your USDC balance on Arc Testnet
import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { arcTestnet } from 'viem/chains';

const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

const client = createPublicClient({
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network')
});

const USDC_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)'
]);

const rawBalance = await client.readContract({
  address: USDC_ADDRESS,
  abi: USDC_ABI,
  functionName: 'balanceOf',
  args: ['0xYourWalletAddress']
});

// USDC uses 6 decimals
const balance = formatUnits(rawBalance, 6);
console.log('USDC Balance:', balance);`,

    bond: `// Schedule a payment bond via the StableBonds vault contract
// The vault is deployed at: 0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A
import { createWalletClient, http, parseUnits } from 'viem';
import { arcTestnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

const VAULT_ADDRESS = '0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A';
const USDC_ADDRESS  = '0x3600000000000000000000000000000000000000';

const account = privateKeyToAccount('0xYourPrivateKey');
const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http('https://rpc.testnet.arc.network')
});

// Step 1 — Approve vault to spend USDC
const approveHash = await walletClient.writeContract({
  address: USDC_ADDRESS,
  abi: parseAbi(['function approve(address spender, uint256 amount) returns (bool)']),
  functionName: 'approve',
  args: [VAULT_ADDRESS, parseUnits('1000', 6)]   // 1,000 USDC
});

// Step 2 — Deposit into vault to start earning yield
const depositHash = await walletClient.writeContract({
  address: VAULT_ADDRESS,
  abi: parseAbi(['function deposit(uint256 amount, address recipient, uint256 maturityDays)']),
  functionName: 'deposit',
  args: [parseUnits('1000', 6), '0xVendorAddress', 90n]  // 90-day bond
});

console.log('Bond created. Tx:', depositHash);`,

    auth: `// Sign in with Circle Smart Account (Passkey / WebAuthn)
// StableBonds uses Circle WaaS — no seed phrase required

import { W3SSdk } from '@circle-fin/web3-services-sdk';

const sdk = new W3SSdk({
  appId: process.env.NEXT_PUBLIC_CIRCLE_APP_ID
});

// Trigger passkey login (Touch ID / Face ID / Windows Hello)
await sdk.execute(userToken, encryptionKey, [
  { type: 'createWallet' }   // creates Circle Smart Account
]);

// Once logged in, the Smart Account address is available
// and all transactions are gasless on Arc (fees sponsored by Circle)`
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
              <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Getting Started</h4>
              <ul className="space-y-2 text-xs">
                <li><a href="#setup" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Connect to Arc Testnet</a></li>
                <li><a href="#balance" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Read USDC Balance</a></li>
                <li><a href="#bond" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Schedule a Bond Payment</a></li>
                <li><a href="#auth" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Circle Smart Account Auth</a></li>
                <li><a href="#contracts" className="hover:text-[var(--foreground)] font-medium text-[var(--muted-foreground)] block py-1">Contract Addresses</a></li>
              </ul>
            </div>

            <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2 text-xs">
                <Terminal size={14} className="text-[var(--muted-foreground)]" />
                <span className="font-semibold">viem:</span>
                <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded text-[10px]">2.49.x</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Server size={14} className="text-[var(--muted-foreground)]" />
                <span className="font-semibold">Arc Testnet:</span>
                <span className="font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px]">Online</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Shield size={14} className="text-[var(--muted-foreground)]" />
                <span className="font-semibold">Chain ID:</span>
                <span className="font-mono bg-[var(--muted)] px-1.5 py-0.5 rounded text-[10px]">5042002</span>
              </div>
            </div>

            {/* External links */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-widest text-[var(--muted-foreground)] text-[10px]">Resources</h4>
              <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-0.5">
                <ExternalLink size={11} /> Arc Explorer
              </a>
              <a href="https://faucet.circle.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-0.5">
                <ExternalLink size={11} /> USDC Faucet
              </a>
              <a href="https://developers.circle.com/w3s" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-0.5">
                <ExternalLink size={11} /> Circle WaaS Docs
              </a>
              <a href="https://viem.sh" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-0.5">
                <ExternalLink size={11} /> viem Docs
              </a>
              <a href="https://github.com/liohio3012/StableBonds" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] py-0.5">
                <ExternalLink size={11} /> GitHub Repository
              </a>
            </div>
          </div>

          {/* Right Side: Docs Content & Code Blocks */}
          <div className="lg:col-span-9 space-y-16">
            
            {/* Header info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen size={20} className="text-[var(--primary)]" />
                <h1 className="text-3xl font-extrabold tracking-tight">StableBonds Documentation</h1>
              </div>
              <p className="text-sm text-[var(--muted-foreground)] max-w-2xl leading-relaxed">
                StableBonds is built on <strong>viem</strong>, <strong>wagmi</strong>, and <strong>Circle Web3 Services (WaaS)</strong>. 
                There is no proprietary SDK — all on-chain interactions use standard EVM tooling on Arc Testnet.
              </p>
              <div className="flex flex-wrap gap-2 text-[10px]">
                {['viem 2.49', 'wagmi 2.x', 'Circle WaaS SDK', 'Arc Testnet', 'USDC ERC-20', 'Circle CCTP'].map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full border font-semibold" style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}>{t}</span>
                ))}
              </div>
            </div>

            {/* Section 1: Connect to Arc */}
            <div id="setup" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">1</div>
                <h2 className="text-lg font-bold">Connect to Arc Testnet</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Arc Testnet (Chain ID <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded">5042002</code>) uses USDC as its native gas token. 
                Connect using <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded">viem</code> — the <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded">arcTestnet</code> chain config is included in <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded">viem/chains</code>.
              </p>
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

            {/* Section 2: Read USDC Balance */}
            <div id="balance" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">2</div>
                <h2 className="text-lg font-bold">Read USDC Balance</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                USDC on Arc Testnet is a standard ERC-20 token deployed at 
                <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded mx-1">0x3600000000000000000000000000000000000000</code>.
                Read balances using the standard <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded">balanceOf</code> call. USDC uses 6 decimal places.
              </p>
              <div className="relative rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100 font-mono text-xs p-4 shadow-lg" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => copyToClipboard(codeSnippets.balance, 'balance')}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1.5 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  {copiedSection === 'balance' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{codeSnippets.balance}</pre>
              </div>
            </div>

            {/* Section 3: Schedule a Bond */}
            <div id="bond" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">3</div>
                <h2 className="text-lg font-bold">Schedule a Bond Payment</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Two-step process: first <strong>approve</strong> the vault to spend your USDC, then call <strong>deposit</strong> to lock funds into a yield-bearing bond. 
                The vault address is <code className="font-mono bg-[var(--muted)] px-1 py-0.5 rounded">0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A</code>.
              </p>
              <div className="relative rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100 font-mono text-xs p-4 shadow-lg" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => copyToClipboard(codeSnippets.bond, 'bond')}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1.5 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  {copiedSection === 'bond' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{codeSnippets.bond}</pre>
              </div>
            </div>

            {/* Section 4: Circle WaaS Auth */}
            <div id="auth" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">4</div>
                <h2 className="text-lg font-bold">Circle Smart Account Authentication</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                StableBonds uses <strong>Circle Web3 Services (WaaS)</strong> for user authentication. 
                Users sign in via Passkey (Touch ID / Face ID / Windows Hello) — no seed phrase, no browser extension required.
                The resulting <strong>Circle Smart Account</strong> gets gasless transactions on Arc.
              </p>
              <div className="relative rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100 font-mono text-xs p-4 shadow-lg" style={{ borderColor: 'var(--border)' }}>
                <button 
                  onClick={() => copyToClipboard(codeSnippets.auth, 'auth')}
                  className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1.5 rounded bg-zinc-900 border border-zinc-800 transition-all cursor-pointer"
                >
                  {copiedSection === 'auth' ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <pre className="overflow-x-auto whitespace-pre">{codeSnippets.auth}</pre>
              </div>
            </div>

            {/* Section 5: Contract Addresses */}
            <div id="contracts" className="space-y-4 scroll-mt-20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)] font-bold text-xs">5</div>
                <h2 className="text-lg font-bold">Contract Addresses — Arc Testnet</h2>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                All contracts below are deployed on Arc Testnet (Chain ID: 5042002). 
                Verify on <a href="https://testnet.arcscan.app" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline font-semibold">testnet.arcscan.app</a>.
              </p>
              <div className="card-surface overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)', background: 'var(--muted)' }}>
                      <th className="p-3 font-semibold text-[var(--foreground)]">Contract</th>
                      <th className="p-3 font-semibold text-[var(--foreground)]">Chain ID</th>
                      <th className="p-3 font-semibold text-[var(--foreground)]">Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="p-3 font-medium">USDC (ERC-20)</td>
                      <td className="p-3 font-mono text-[var(--muted-foreground)]">5042002</td>
                      <td className="p-3">
                        <a href="https://testnet.arcscan.app/address/0x3600000000000000000000000000000000000000" target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--primary)] hover:underline flex items-center gap-1">
                          0x3600...0000 <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                    <tr className="border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                      <td className="p-3 font-medium">StableBonds Vault</td>
                      <td className="p-3 font-mono text-[var(--muted-foreground)]">5042002</td>
                      <td className="p-3">
                        <a href="https://testnet.arcscan.app/address/0x3522E90D3496D530F7bd2767bE818Cd2F6846b0A" target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--primary)] hover:underline flex items-center gap-1">
                          0x3522...6b0A <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Circle CCTP Token Messenger</td>
                      <td className="p-3 font-mono text-[var(--muted-foreground)]">5042002</td>
                      <td className="p-3">
                        <a href="https://testnet.arcscan.app/address/0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAD" target="_blank" rel="noopener noreferrer" className="font-mono text-[var(--primary)] hover:underline flex items-center gap-1">
                          0x8FE6...2DAD <ExternalLink size={10} />
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Note box */}
              <div className="flex gap-3 p-4 rounded-xl border text-xs leading-relaxed" style={{ background: 'var(--info-soft)', borderColor: 'var(--info-border)', color: 'var(--info-foreground)' }}>
                <Zap size={14} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Gasless on Arc:</strong> When using a Circle Smart Account, all transactions on Arc Testnet are <strong>100% gas-sponsored</strong>. 
                  Users never need to hold native gas tokens — USDC is the only asset required.
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
