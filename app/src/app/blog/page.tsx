"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Calendar, Clock, User, ArrowRight, BookOpen, Sparkles, HelpCircle, ChevronRight, Tag } from 'lucide-react';
import Logo from "@/components/enterprise/Logo";
import Footer from "@/components/enterprise/Footer";
import { BLOG_POSTS, BlogPost } from '@/data/blogData';

// Simple SEO Component
const SEO_TITLE = "StableBonds Corporate Treasury Blog — Insights & Guides";
const SEO_DESC = "Learn how to optimize corporate treasury capital efficiency, schedule automated vendor payments, and maximize USDC yield on the Arc blockchain network.";

export default function BlogListing() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Treasury' | 'Guides' | 'Research'>('All');

  // Filter posts
  const filteredPosts = useMemo(() => {
    return BLOG_POSTS.filter(post => {
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.seoKeywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Featured Post (first featured or fallback to first post)
  const featuredPost = useMemo(() => {
    return BLOG_POSTS.find(post => post.featured) || BLOG_POSTS[0];
  }, []);

  // Normal posts (exclude the featured post from the list if category is All)
  const normalPosts = useMemo(() => {
    if (selectedCategory !== 'All') return filteredPosts;
    return filteredPosts.filter(post => post.slug !== featuredPost.slug);
  }, [filteredPosts, selectedCategory, featuredPost]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col relative"
      style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {/* Structural subtle glow in background */}
      <div className="absolute top-0 left-1/4 -translate-x-1/2 w-80 h-80 rounded-full bg-emerald-400/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-96 h-96 rounded-full bg-amber-400/5 blur-[140px] pointer-events-none"></div>

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
            <Link href="/blog" className="text-[var(--primary)] font-bold border-b-2 border-[var(--primary)] pb-1.5 translate-y-0.5">Blog</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app" className="btn-primary text-xs gap-2 px-5 py-2 flex items-center font-bold tracking-wide rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
              Launch App
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12">
        {/* Banner Section */}
        <div className="text-center max-w-3xl mx-auto pb-12">
          <span className="badge badge-primary text-xs font-semibold px-2 py-1 mb-4">
            <BookOpen size={11} className="mr-1" />
            StableBonds Blog
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
            Treasury Strategy & On-Chain Payout Insights
          </h1>
          <p className="text-sm md:text-base mt-4 text-[var(--muted-foreground)] leading-relaxed">
            Expert analysis, implementation guides, and protocol research on stablecoin yield pools, corporate finance automation, and the future of enterprise payments.
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-[var(--border)]">
          {/* Categories Tab */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['All', 'Treasury', 'Guides', 'Research'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent'
                    : 'bg-white border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={14} />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-9 text-xs w-full bg-white"
              style={{ borderColor: 'var(--border)' }}
            />
          </div>
        </div>

        {/* Featured Post (Only show in 'All' category and when no search query is active) */}
        {selectedCategory === 'All' && !searchQuery && featuredPost && (
          <div className="mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-4 flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              Featured Post
            </h2>
            <div className="card-surface p-0 overflow-hidden border border-[var(--border)] rounded-2xl grid grid-cols-1 lg:grid-cols-12 hover:border-[var(--primary)] transition-all group shadow-sm">
              <div className="lg:col-span-7 relative overflow-hidden aspect-video lg:aspect-auto">
                <img 
                  src={featuredPost.imageUrl} 
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <span className="absolute top-4 left-4 badge badge-primary text-[10px] font-bold uppercase py-0.5 px-2">
                  {featuredPost.category}
                </span>
              </div>
              <div className="lg:col-span-5 p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] font-medium">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {featuredPost.publishedAt}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {featuredPost.readTime}</span>
                  </div>
                  <Link href={`/blog/${featuredPost.slug}`}>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors cursor-pointer leading-tight">
                      {featuredPost.title}
                    </h3>
                  </Link>
                  <p className="text-xs md:text-sm text-[var(--muted-foreground)] leading-relaxed">
                    {featuredPost.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                  <div className="flex items-center gap-3">
                    <img 
                      src={featuredPost.author.avatarUrl} 
                      alt={featuredPost.author.name}
                      className="w-8 h-8 rounded-full border border-[var(--border)]"
                    />
                    <div>
                      <div className="text-xs font-bold text-[var(--foreground)]">{featuredPost.author.name}</div>
                      <div className="text-[10px] text-[var(--muted-foreground)]">{featuredPost.author.role}</div>
                    </div>
                  </div>
                  <Link href={`/blog/${featuredPost.slug}`} className="btn-secondary text-xs gap-1.5 py-1.5 px-3">
                    Read Article
                    <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Regular Posts Grid */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-6">
            {searchQuery || selectedCategory !== 'All' ? `Results (${filteredPosts.length})` : 'All Articles'}
          </h2>

          {filteredPosts.length === 0 ? (
            <div className="card-surface p-12 text-center max-w-md mx-auto space-y-3 flex flex-col items-center">
              <HelpCircle className="text-[var(--muted-foreground)] opacity-50" size={32} />
              <h4 className="font-semibold text-[var(--foreground)]">No articles found</h4>
              <p className="text-xs text-[var(--muted-foreground)]">
                We couldn't find any articles matching &quot;{searchQuery}&quot;. Try adjusting your search query or filters.
              </p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="btn-secondary text-xs py-1.5 px-3 mt-2"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {normalPosts.map((post) => (
                <div key={post.slug} className="card-surface p-0 overflow-hidden border border-[var(--border)] rounded-2xl flex flex-col justify-between hover:border-[var(--primary)] hover:-translate-y-0.5 transition-all group shadow-xs">
                  <div className="relative overflow-hidden aspect-video">
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 badge badge-secondary text-[9px] font-bold uppercase py-0.5 px-2 bg-white/90 backdrop-blur-xs">
                      {post.category}
                    </span>
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[10px] text-[var(--muted-foreground)] font-semibold">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {post.publishedAt}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                      </div>
                      <Link href={`/blog/${post.slug}`}>
                        <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors cursor-pointer leading-snug">
                          {post.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-3">
                        {post.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <img 
                          src={post.author.avatarUrl} 
                          alt={post.author.name}
                          className="w-6 h-6 rounded-full border border-[var(--border)]"
                        />
                        <span className="text-[10px] font-bold text-[var(--foreground)] truncate max-w-[100px]">
                          {post.author.name}
                        </span>
                      </div>
                      <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1 hover:underline cursor-pointer">
                        Read
                        <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Blog CTA Section */}
        <div className="mt-20 card-surface p-8 md:p-12 relative overflow-hidden border border-[var(--border)] rounded-3xl text-center space-y-6">
          <div className="absolute top-0 right-0 w-80 h-80 bg-radial-gradient from-[var(--primary-soft)] to-transparent opacity-20 pointer-events-none rounded-full translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-radial-gradient from-[var(--success-soft)] to-transparent opacity-15 pointer-events-none rounded-full -translate-x-1/4 translate-y-1/4"></div>

          <div className="max-w-xl mx-auto space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Maximize Capital Efficiency with StableBonds
            </h3>
            <p className="text-xs md:text-sm text-[var(--muted-foreground)] leading-relaxed">
              Stop leaving corporate cash idle. Connect your wallet, whitelist suppliers, configure custom multi-sig consensus rules, and earn compounding yield on upcoming payouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/app" className="btn-primary w-full sm:w-auto px-6 py-3 text-xs gap-2 flex items-center font-bold justify-center">
              Launch Treasury Dashboard
              <ArrowRight size={13} />
            </Link>
            <Link href="/docs" className="btn-secondary w-full sm:w-auto px-6 py-3 text-xs font-semibold justify-center">
              View Developer APIs
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
