import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry', '/admin'],
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'Claude-SearchBot',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
      {
        userAgent: 'CCBot',
        allow: '/',
        disallow: ['/James', '/james', '/Jerry', '/jerry'],
      },
    ],
    sitemap: 'https://goonsite.org/sitemap.xml',
  };
}
