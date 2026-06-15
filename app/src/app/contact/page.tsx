"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Bug, Sparkles, Send, Loader2 } from 'lucide-react';
import Logo from '@/components/enterprise/Logo';
import Footer from '@/components/enterprise/Footer';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'demo',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setLoading(false);
      toast.success("Thank you! Your inquiry has been submitted. Our team will contact you shortly.");
      setFormData({
        name: '',
        email: '',
        topic: 'demo',
        message: ''
      });
    }, 1500);
  };

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
      <main className="flex-grow max-w-5xl w-full mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Left Side: Support Channels */}
          <div className="md:col-span-5 space-y-8 text-left">
            <div className="space-y-3">
              <h1 className="text-3xl font-extrabold tracking-tight text-gradient">Contact Support & Sales</h1>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                Have questions about yield tranches, deployment mechanics, or integration options? Reach out to us through our direct channels or send a message.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: <Mail size={16} className="text-emerald-500" />,
                  title: "Direct Email Correspondence",
                  desc: "support@stablepay.finance",
                  action: "mailto:support@stablepay.finance"
                },
                {
                  icon: <MessageSquare size={16} className="text-blue-500" />,
                  title: "Developer Community",
                  desc: "Join Discord Server",
                  action: "https://discord.gg/stablepay"
                },
                {
                  icon: <Bug size={16} className="text-red-500" />,
                  title: "Bug & Vulnerability Reports",
                  desc: "Submit Issue on GitHub",
                  action: "https://github.com/liohio3012/StableBonds/issues"
                }
              ].map((channel, i) => (
                <a 
                  key={i} 
                  href={channel.action}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-surface p-4 flex gap-4 items-start hover:shadow-xs hover:border-[var(--primary)] transition-all cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shrink-0">
                    {channel.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-[var(--foreground)]">{channel.title}</h4>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{channel.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Message Form */}
          <div className="md:col-span-7">
            <div className="card-surface p-8 space-y-6 text-left">
              <div className="flex items-center gap-2 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <Sparkles size={16} className="text-[var(--primary)]" />
                <h3 className="font-bold text-sm">Send Secure Inquiry</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Your Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full text-xs px-3 py-2 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Corporate Email</label>
                    <input 
                      type="email" 
                      required
                      placeholder="jane@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full text-xs px-3 py-2 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                      style={{ borderColor: 'var(--border)' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Topic of Inquiry</label>
                  <select 
                    value={formData.topic}
                    onChange={(e) => setFormData({...formData, topic: e.target.value})}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <option value="demo">Request Custom Product Demo</option>
                    <option value="support">Technical Support & Diagnostics</option>
                    <option value="partnership">Business Partnership Opportunities</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Inquiry details</label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Provide details about your integration requirements or question..."
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full text-xs px-3 py-2 rounded-lg border bg-neutral-50/50 dark:bg-neutral-900/50 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all resize-none"
                    style={{ borderColor: 'var(--border)' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-2.5 text-xs font-semibold gap-1.5 justify-center flex items-center cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Submitting Message...
                    </>
                  ) : (
                    <>
                      <Send size={13} />
                      Send Secure Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
