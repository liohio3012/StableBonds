"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, ArrowRight, Share2, Check, Copy, ChevronRight, Sparkles } from 'lucide-react';
import Logo from "@/components/enterprise/Logo";
import Footer from "@/components/enterprise/Footer";
import { BlogPost } from '@/data/blogData';
import { toast } from 'sonner';

interface BlogDetailClientProps {
  post: BlogPost;
  relatedPosts: BlogPost[];
}

// Custom interactive components for rich blog assets
const MermaidFlowChart = () => {
  const steps = [
    { title: "Schedule Invoice", desc: "CFO inputs invoice amount & recipient wallet." },
    { title: "Lock Capital", desc: "Principal is secured in the smart vault." },
    { title: "Earn 5% APY", desc: "Capital compounds in the Senior tranche." },
    { title: "Maturity Date", desc: "Contract automated trigger executes." },
    { title: "Settle Invoice", desc: "Recipient receives exact USDC payment." },
    { title: "Return Yield", desc: "CFO recaptures accrued interest." }
  ];

  return (
    <div className="my-8 p-6 rounded-2xl border border-[var(--border)] bg-neutral-50/30 backdrop-blur-sm space-y-6">
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
        Process Flow: Automated Settlement Vault
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, idx) => (
          <div key={idx} className="relative p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:shadow-sm transition-all group">
            <div className="absolute top-3 right-3 text-[10px] font-mono text-[var(--muted-foreground)] font-bold bg-[var(--muted)] px-1.5 py-0.5 rounded">
              0{idx + 1}
            </div>
            <h5 className="text-xs font-bold text-[var(--foreground)] pr-6">{step.title}</h5>
            <p className="text-[10px] text-[var(--muted-foreground)] mt-1.5 leading-relaxed">{step.desc}</p>
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors">
                <ChevronRight size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ArcArchitectureDiagram = () => {
  return (
    <div className="my-8 p-6 rounded-2xl border border-[var(--border)] bg-neutral-50/30 backdrop-blur-sm space-y-6">
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />
        System Architecture: Arc Integration Layer
      </div>
      <div className="flex flex-col items-center gap-4 text-xs font-semibold">
        <div className="px-6 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] w-48 text-center shadow-xs">
          Corporate Treasury
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-0.5 h-6 bg-[var(--primary)]" />
          <span className="text-[9px] text-[var(--muted-foreground)] font-mono bg-[var(--muted)] px-2 py-0.5 rounded">
            Sponsored Gas (USDC)
          </span>
          <div className="w-0.5 h-2 bg-[var(--primary)]" />
        </div>
        <div className="px-6 py-3 rounded-xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] w-64 text-center font-bold shadow-xs">
          Arc Blockchain Integration Layer
        </div>
        <div className="w-full flex items-center justify-center gap-12 sm:gap-20">
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-[var(--border)]" />
            <span className="text-[8px] text-[var(--muted-foreground)] mb-1">Sub-second finality</span>
            <div className="px-4 py-2.5 rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)] w-32 sm:w-36 text-center font-bold">
              Yield Generation
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-[var(--border)]" />
            <span className="text-[8px] text-[var(--muted-foreground)] mb-1">Sub-second finality</span>
            <div className="px-4 py-2.5 rounded-xl border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] w-32 sm:w-36 text-center font-bold">
              Maturity Settlement
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmailOtpMockup = () => {
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [email, setEmail] = useState('treasury@acme.com');
  const [otp, setOtp] = useState(['4', '8', '2', '9', '1', '0']);
  const [timer, setTimer] = useState(54);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: any;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('success');
    }, 1000);
  };

  return (
    <div className="my-6 max-w-sm mx-auto p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-md space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h5 className="text-xs font-bold text-[var(--foreground)]">OTP Sign-In Sandbox</h5>
          <p className="text-[9px] text-[var(--muted-foreground)]">Simulation for non-passkey devices</p>
        </div>
        <span className="text-[9px] font-semibold text-[var(--primary)] bg-[var(--primary-soft)] px-1.5 py-0.5 rounded">
          Fallback Wallet
        </span>
      </div>

      {step === 'input' && (
        <form onSubmit={handleRequestOtp} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[var(--muted-foreground)]">Corporate Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] bg-[var(--background)] font-mono text-[var(--foreground)]"
              placeholder="treasury@acme.com"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full text-[11px] py-2 flex items-center justify-center gap-1.5 font-bold"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Send One-Time Passcode"}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-3.5">
          <div className="space-y-1.5 text-center">
            <label className="text-[10px] font-bold text-[var(--muted-foreground)] block">Enter 6-Digit Code</label>
            <p className="text-[9px] text-[var(--muted-foreground)]">Sent to {email}</p>
            <div className="flex justify-center gap-2 mt-2">
              {otp.map((char, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength={1}
                  value={char}
                  onChange={(e) => {
                    const newOtp = [...otp];
                    newOtp[index] = e.target.value;
                    setOtp(newOtp);
                  }}
                  className="w-8 h-9 text-center text-xs font-mono font-bold rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                />
              ))}
            </div>
            <div className="text-[9px] text-[var(--muted-foreground)] mt-2">
              Code expires in <span className="font-mono font-bold text-[var(--foreground)]">00:{timer < 10 ? `0${timer}` : timer}</span>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full text-[11px] py-2 flex items-center justify-center gap-1.5 font-bold"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Verify & Connect Wallet"}
          </button>
        </form>
      )}

      {step === 'success' && (
        <div className="text-center py-4 space-y-3">
          <div className="w-10 h-10 rounded-full bg-[var(--success-soft)] text-[var(--success)] flex items-center justify-center mx-auto">
            <Check size={18} />
          </div>
          <div>
            <h6 className="text-xs font-bold text-[var(--foreground)]">Authentication Successful</h6>
            <p className="text-[9px] text-[var(--muted-foreground)] mt-1 font-mono">
              Smart Account Address: 0x8a92...718d
            </p>
          </div>
          <button 
            type="button" 
            onClick={() => setStep('input')}
            className="text-[10px] font-bold text-[var(--primary)] hover:underline"
          >
            Simulate Again
          </button>
        </div>
      )}
    </div>
  );
};

const InteractiveChecklist = ({ items }: { items: { text: string; checked: boolean }[] }) => {
  const [tasks, setTasks] = useState(items);
  
  const toggleTask = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].checked = !newTasks[index].checked;
    setTasks(newTasks);
  };

  return (
    <div className="my-6 p-5 rounded-2xl border border-[var(--border)] bg-neutral-50/20 backdrop-blur-sm space-y-3 text-left shadow-xs">
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] flex items-center gap-1.5 pb-2.5 border-b border-[var(--border-subtle)]">
        <Check size={14} className="text-[var(--primary)]" />
        Launch Checklist
      </div>
      <div className="space-y-3 pt-1">
        {tasks.map((task, idx) => (
          <div 
            key={idx} 
            onClick={() => toggleTask(idx)}
            className="flex items-start gap-3 cursor-pointer group select-none"
          >
            <div className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
              task.checked 
                ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-xs' 
                : 'border-[var(--border)] group-hover:border-[var(--primary)] bg-[var(--card)]'
            }`}>
              {task.checked && <Check size={11} strokeWidth={3} />}
            </div>
            <span 
              className={`text-xs md:text-sm transition-all ${
                task.checked 
                  ? 'line-through text-[var(--muted-foreground)] opacity-70' 
                  : 'text-[var(--foreground)] font-medium'
              }`}
              dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(task.text) }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// A simple and safe Markdown parser to render H2, H3, lists, tables, code blocks, alerts, horizontal rules, checklists
const renderMarkdown = (markdown: string) => {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  let tableHeaders: string[] = [];
  let tableRows: string[][] = [];
  const renderedElements: React.ReactNode[] = [];
  let elementKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      renderedElements.push(
        <ul key={`list-${elementKey++}`} className="list-disc pl-6 my-4 space-y-2 text-xs md:text-sm leading-relaxed text-[var(--muted-foreground)]">
          {listItems.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(item) }} />
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (tableHeaders.length > 0 || tableRows.length > 0) {
      renderedElements.push(
        <div key={`table-wrapper-${elementKey++}`} className="overflow-x-auto my-6 border border-[var(--border)] rounded-xl">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b bg-neutral-50/50" style={{ borderColor: 'var(--border)' }}>
                {tableHeaders.map((header, idx) => (
                  <th key={idx} className="p-3.5 font-semibold text-[var(--foreground)]" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(header) }} />
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b last:border-0 hover:bg-neutral-50/30" style={{ borderColor: 'var(--border)' }}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="p-3.5 text-[var(--muted-foreground)]" dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 1. Alert boxes: > [!TIP] or > [!IMPORTANT]
    if (line.startsWith('> [!')) {
      flushList();
      flushTable();
      const type = line.includes('TIP') ? 'tip' : line.includes('IMPORTANT') ? 'important' : 'note';
      let content = '';
      // Read subsequent blockquote lines
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++;
        content += ' ' + lines[i].trim().replace(/^>\s*/, '');
      }
      renderedElements.push(
        <div 
          key={`alert-${elementKey++}`} 
          className={`p-4 rounded-xl border my-6 text-xs md:text-sm leading-relaxed ${
            type === 'tip' 
              ? 'bg-[var(--success-soft)] text-[var(--success-foreground)] border-[var(--success-border)]' 
              : 'bg-[var(--warning-soft)] text-[var(--warning-foreground)] border-[var(--warning-border)]'
          }`}
        >
          <div className="flex gap-2.5 items-start">
            <Sparkles size={16} className="shrink-0 mt-0.5" />
            <div dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(content.trim()) }} />
          </div>
        </div>
      );
      continue;
    }

    // 2. Heading 2 (##)
    if (line.startsWith('## ')) {
      flushList();
      flushTable();
      const text = line.substring(3);
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      renderedElements.push(
        <h2 id={id} key={`h2-${elementKey++}`} className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] mt-8 mb-4 pt-4 border-t border-[var(--border-subtle)] first:border-t-0 first:pt-0">
          {text}
        </h2>
      );
      continue;
    }

    // 3. Heading 3 (###)
    if (line.startsWith('### ')) {
      flushList();
      flushTable();
      renderedElements.push(
        <h3 key={`h3-${elementKey++}`} className="text-base md:text-lg font-bold tracking-tight text-[var(--foreground)] mt-6 mb-3">
          {line.substring(4)}
        </h3>
      );
      continue;
    }

    // 4. Code Blocks (```)
    if (line.startsWith('```') || line.startsWith('\\`\\`\\`')) {
      flushList();
      flushTable();
      const isMermaid = line.includes('mermaid');
      let code = '';
      // Read until closing code block
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('```') && !lines[i + 1].trim().startsWith('\\`\\`\\`')) {
        i++;
        code += lines[i] + '\n';
      }
      if (i + 1 < lines.length) i++; // skip closing
      
      if (isMermaid || code.includes('graph TD')) {
        renderedElements.push(<MermaidFlowChart key={`mermaid-${elementKey++}`} />);
      } else if (code.includes('Arc Blockchain Integration Layer')) {
        renderedElements.push(<ArcArchitectureDiagram key={`arc-arch-${elementKey++}`} />);
      } else {
        renderedElements.push(
          <pre key={`code-${elementKey++}`} className="bg-zinc-900 text-zinc-100 p-4 rounded-xl font-mono text-[11px] md:text-xs my-6 overflow-x-auto shadow-inner border border-zinc-800">
            <code>{code.trim()}</code>
          </pre>
        );
      }
      continue;
    }

    // 5. Checklists (- [ ] / - [x])
    if (line.startsWith('- [ ]') || line.startsWith('- [x]') || line.startsWith('* [ ]') || line.startsWith('* [x]')) {
      flushList();
      flushTable();
      const checklistItems = [];
      let j = i;
      while (j < lines.length) {
        const currLine = lines[j].trim();
        if (currLine.startsWith('- [ ]') || currLine.startsWith('- [x]') || currLine.startsWith('* [ ]') || currLine.startsWith('* [x]')) {
          const checked = currLine.includes('[x]');
          const text = currLine.substring(5).trim();
          checklistItems.push({ text, checked });
          j++;
        } else {
          break;
        }
      }
      i = j - 1;
      renderedElements.push(
        <InteractiveChecklist key={`checklist-${elementKey++}`} items={checklistItems} />
      );
      continue;
    }

    // 6. Bullet Lists (*)
    if (line.startsWith('* ')) {
      flushTable();
      inList = true;
      listItems.push(line.substring(2));
      continue;
    }

    // 7. Tables (|)
    if (line.startsWith('|')) {
      flushList();
      // Skip separator row | :--- | :--- |
      if (line.includes('---')) {
        continue;
      }
      const cols = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (!inTable) {
        inTable = true;
        tableHeaders = cols;
      } else {
        tableRows.push(cols);
      }
      continue;
    }

    // 8. Horizontal Rules (---)
    if (line === '---') {
      flushList();
      flushTable();
      renderedElements.push(
        <hr key={`hr-${elementKey++}`} className="my-8 border-t border-[var(--border-subtle)]" />
      );
      continue;
    }

    // 9. Empty lines
    if (line === '') {
      flushList();
      flushTable();
      continue;
    }

    // 10. Plain paragraph
    if (!inList && !inTable) {
      renderedElements.push(
        <p key={`p-${elementKey++}`} className="text-xs md:text-sm leading-relaxed text-[var(--muted-foreground)] my-4"
           dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }} />
      );
      if (line.includes('Email OTP Sign-In')) {
        renderedElements.push(<EmailOtpMockup key={`otp-mock-${elementKey++}`} />);
      }
    }
  }

  // Flush remaining lists or tables
  flushList();
  flushTable();

  return renderedElements;
};

// Safe parser for inline styles: bold (**), italic (* or _), links ([]()), inline code (`)
const parseInlineMarkdown = (text: string): string => {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Italic (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<span class="italic text-[var(--muted-foreground)]">$1</span>');
  html = html.replace(/_(.*?)_/g, '<span class="italic text-[var(--muted-foreground)]">$1</span>');

  // Inline code (`)
  html = html.replace(/`(.*?)`/g, '<code class="font-mono bg-neutral-100 text-[var(--primary)] px-1 py-0.5 rounded text-[11px]">$1</code>');

  // Markdown links ([text](url))
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-[var(--primary)] hover:underline font-semibold">$1</a>');

  return html;
};

export default function BlogDetailClient({ post, relatedPosts }: BlogDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [activeHeading, setActiveHeading] = useState('');

  // Extract H2 headings for Table of Contents
  const headings = React.useMemo(() => {
    const normalized = post.content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    return lines
      .filter(line => line.startsWith('## '))
      .map(line => {
        const text = line.substring(3);
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return { text, id };
      });
  }, [post.content]);

  // Handle active heading tracking on scroll
  useEffect(() => {
    const handleScroll = () => {
      const headingElements = headings.map(h => document.getElementById(h.id)).filter(Boolean) as HTMLElement[];
      
      let current = '';
      for (const el of headingElements) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 120) {
          current = el.id;
        }
      }
      setActiveHeading(current || (headings[0]?.id || ''));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial run

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Article link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col relative"
      style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {/* Header / Navbar */}
      <nav className="border-b sticky top-0 z-40 backdrop-blur-xl bg-[var(--background)]/90" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Logo size={36} className="cursor-pointer" />
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm font-semibold">
            <Link href="/" className="hover:text-[var(--primary)] transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-[var(--primary)] transition-colors">Docs</Link>
            <Link href="/blog" className="text-[var(--primary)] font-bold">Blog</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app" className="btn-primary text-xs gap-2 px-5 py-2 flex items-center font-bold tracking-wide rounded-lg">
              Launch App
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-[var(--muted-foreground)] mb-8">
          <Link href="/" className="hover:text-[var(--primary)]">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blog" className="hover:text-[var(--primary)]">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-[var(--foreground)] truncate max-w-[200px] md:max-w-md">{post.title}</span>
        </nav>

        {/* Hero Section */}
        <div className="space-y-6 max-w-4xl mb-10">
          <span className="badge badge-primary text-xs font-semibold px-2 py-1">
            {post.category}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-tight">
            {post.title}
          </h1>
          <p className="text-sm md:text-base text-[var(--muted-foreground)] leading-relaxed">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-[var(--border-subtle)] py-4">
            <div className="flex items-center gap-3">
              <img 
                src={post.author.avatarUrl} 
                alt={post.author.name}
                className="w-10 h-10 rounded-full border border-[var(--border)]"
              />
              <div>
                <div className="text-xs font-bold text-[var(--foreground)]">{post.author.name}</div>
                <div className="text-[10px] text-[var(--muted-foreground)]">{post.author.role}</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {post.publishedAt}</span>
              <span className="flex items-center gap-1.5"><Clock size={13} /> {post.readTime}</span>
              <div className="flex items-center gap-2 border-l pl-4 border-[var(--border)]">
                <button 
                  onClick={handleCopyLink}
                  className="p-1.5 rounded hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check size={14} className="text-[var(--success)]" /> : <Share2 size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Image */}
        <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden border border-[var(--border)] mb-12 shadow-sm">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Table of Contents Column (Left / Sticky on desktop) */}
          <div className="lg:col-span-3 sticky top-28 hidden lg:block space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
              Table of Contents
            </h4>
            <ul className="space-y-3 text-xs font-medium border-l border-[var(--border)]">
              {headings.map((h) => (
                <li key={h.id}>
                  <a 
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`block pl-4 py-0.5 border-l-2 -ml-px transition-colors ${
                      activeHeading === h.id 
                        ? 'border-[var(--primary)] text-[var(--primary)] font-bold' 
                        : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                    }`}
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Article Content Column */}
          <article className="lg:col-span-6 space-y-4">
            {renderMarkdown(post.content)}
          </article>

          {/* Sidebar CTA & Info (Right Column) */}
          <div className="lg:col-span-3 space-y-6">
            {/* Launch App Sticky Box */}
            <div className="card-surface p-6 border border-[var(--border)] rounded-2xl space-y-4 shadow-sm bg-neutral-50/20 backdrop-blur-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                <Sparkles size={13} className="text-emerald-500" />
                Treasury Automation
              </h4>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                Connect your smart treasury account to start scheduling vendor invoices and compound 5% - 12% yield instantly.
              </p>
              <Link href="/app" className="btn-primary w-full text-xs py-2.5 gap-2 flex items-center font-bold justify-center shadow-sm">
                Launch App Console
                <ArrowRight size={13} />
              </Link>
              <Link href="/docs" className="text-[11px] font-bold text-[var(--primary)] hover:underline flex items-center justify-center gap-1">
                View developer APIs <ChevronRight size={10} />
              </Link>
            </div>

            {/* Tags Box */}
            <div className="card-surface p-6 border border-[var(--border)] rounded-2xl space-y-3 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)]">
                Keywords & Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-0.5 rounded text-[10px] font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-20 pt-10 border-t border-[var(--border)]">
            <h3 className="text-lg font-bold tracking-tight text-[var(--foreground)] mb-6">
              Related Articles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((rPost) => (
                <div key={rPost.slug} className="card-surface p-0 overflow-hidden border border-[var(--border)] rounded-2xl flex flex-col md:flex-row hover:border-[var(--primary)] transition-all group shadow-xs">
                  <div className="relative overflow-hidden aspect-video md:aspect-auto md:w-2/5">
                    <img 
                      src={rPost.imageUrl} 
                      alt={rPost.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 md:w-3/5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-[var(--muted-foreground)]">
                        {rPost.category}
                      </span>
                      <Link href={`/blog/${rPost.slug}`}>
                        <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors cursor-pointer leading-snug">
                          {rPost.title}
                        </h4>
                      </Link>
                    </div>
                    <Link href={`/blog/${rPost.slug}`} className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1 hover:underline cursor-pointer">
                      Read Article
                      <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
