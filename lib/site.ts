// Which site this build serves. goonsite.org is the default; building with
// NEXT_PUBLIC_SITE_VARIANT=clean produces the resume-safe 6a68.dev copy, which
// drops the goon pages and the message board. next.config.js 404s those routes
// in the clean build; keep GOON_ONLY_PAGES in step with CLEAN_BLOCKED there.
const clean = process.env.NEXT_PUBLIC_SITE_VARIANT === 'clean';

export const SITE = clean
  ? {
      clean,
      id: '6a68',
      brand: '6A68',
      name: '6A68.dev',
      url: 'https://6a68.dev',
      prompt: 'guest@6A68',
      home: '/home/guest',
      sitemapPath: '/site-map',
      ogImage: '/og-image-6a68.png',
      themeKey: 'theme',
    }
  : {
      clean,
      id: 'goonsite',
      brand: 'goonsite',
      name: 'goonsite.org',
      url: 'https://goonsite.org',
      prompt: 'goon@goonsite',
      home: '/home/goon',
      sitemapPath: '/goon-hub',
      ogImage: '/og-image.png',
      themeKey: 'goon-theme',
    };

const GOON_ONLY_PAGES = ['/goon-hub', '/goon-sploit', '/message-board'];

/** Whether a link to `href` belongs on this site. */
export function isListed(href: string): boolean {
  if (!SITE.clean) return href !== '/site-map';
  return !GOON_ONLY_PAGES.some((p) => href === p || href.startsWith(`${p}/`));
}
