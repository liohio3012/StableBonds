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

// A simple and safe Markdown parser to render H2, H3, lists, tables, code blocks, alerts
const renderMarkdown = (markdown: string) => {
  const lines = markdown.split('\n');
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
    if (line.startsWith('```')) {
      flushList();
      flushTable();
      let code = '';
      // Read until closing code block
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('```')) {
        i++;
        code += lines[i] + '\n';
      }
      if (i + 1 < lines.length) i++; // skip closing ```
      renderedElements.push(
        <pre key={`code-${elementKey++}`} className="bg-zinc-900 text-zinc-100 p-4 rounded-xl font-mono text-[11px] md:text-xs my-6 overflow-x-auto shadow-inner border border-zinc-800">
          <code>{code.trim()}</code>
        </pre>
      );
      continue;
    }

    // 5. Bullet Lists (*)
    if (line.startsWith('* ')) {
      flushTable();
      inList = true;
      listItems.push(line.substring(2));
      continue;
    }

    // 6. Tables (|)
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

    // 7. Empty lines
    if (line === '') {
      flushList();
      flushTable();
      continue;
    }

    // 8. Plain paragraph
    if (!inList && !inTable) {
      renderedElements.push(
        <p key={`p-${elementKey++}`} className="text-xs md:text-sm leading-relaxed text-[var(--muted-foreground)] my-4"
           dangerouslySetInnerHTML={{ __html: parseInlineMarkdown(line) }} />
      );
    }
  }

  // Flush remaining lists or tables
  flushList();
  flushTable();

  return renderedElements;
};

// Safe parser for inline styles: bold (**), links ([]()), inline code (`)
const parseInlineMarkdown = (text: string): string => {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline code (`code`)
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
    const lines = post.content.split('\n');
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
