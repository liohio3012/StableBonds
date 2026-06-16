import { MetadataRoute } from 'next';
import { BLOG_POSTS } from '@/data/blogData';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://stablebonds.finance';

  // Static routes
  const staticRoutes = [
    '',
    '/about',
    '/pricing',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/security',
    '/docs',
    '/blog'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8
  }));

  // Dynamic blog posts routes
  const blogRoutes = BLOG_POSTS.map((post) => {
    // Parse "June 15, 2026" safely, fall back to now if invalid
    let postDate = new Date();
    try {
      const parsed = Date.parse(post.publishedAt);
      if (!isNaN(parsed)) {
        postDate = new Date(parsed);
      }
    } catch (_) {}

    return {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: postDate,
      changeFrequency: 'monthly' as const,
      priority: 0.6
    };
  });

  return [...staticRoutes, ...blogRoutes];
}
