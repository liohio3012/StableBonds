import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BLOG_POSTS } from '@/data/blogData';
import BlogDetailClient from './BlogDetailClient';

interface Props {
  params: Promise<{ slug: string }>;
}

// 1. Dynamic SEO Metadata Generation
export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: 'Post Not Found — StableBonds',
      description: 'The requested treasury blog post could not be found.',
    };
  }

  return {
    title: `${post.title} — StableBonds Blog`,
    description: post.description,
    keywords: post.seoKeywords,
    openGraph: {
      title: `${post.title} — StableBonds Blog`,
      description: post.description,
      type: 'article',
      publishedTime: new Date(post.publishedAt).toISOString(),
      authors: [post.author.name],
      images: [
        {
          url: post.imageUrl,
          width: 800,
          height: 450,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.imageUrl],
    },
  };
}

// Static params generation for SSG (Static Site Generation)
export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Get related posts based on tags or predefined relation slugs
  const relatedPosts = BLOG_POSTS.filter((p) => 
    post.relatedSlugs.includes(p.slug)
  );

  // JSON-LD Structured Data for Google Rich Snippets (SEO Schema Markup)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    'headline': post.title,
    'description': post.description,
    'image': post.imageUrl,
    'datePublished': new Date(post.publishedAt).toISOString(),
    'dateModified': new Date(post.publishedAt).toISOString(),
    'author': {
      '@type': 'Person',
      'name': post.author.name,
      'jobTitle': post.author.role,
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'StableBonds',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://www.stablebonds.space/favicon-128x128.png', // Fallback domain
      },
    },
    'mainEntityOfPage': {
      '@type': 'WebPage',
      '@id': `https://www.stablebonds.space/blog/${post.slug}`,
    },
    'keywords': post.seoKeywords.join(', '),
  };

  return (
    <>
      {/* Schema Markup for Google Search Bots */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <BlogDetailClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
