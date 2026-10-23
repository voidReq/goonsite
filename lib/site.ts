// Which site this build serves. goonsite.org is the default; building with
// NEXT_PUBLIC_SITE_VARIANT=clean produces the resume-safe 6A68.dev copy, which
// drops the goon pages and the message board. next.config.js 404s those routes
// in the clean build.
//
// Client components holding goon-only content test the variant themselves with
// `process.env.NEXT_PUBLIC_SITE_VARIANT === 'clean'` instead of SITE.clean.
// That comparison is inlined into each module at build time, so the minifier
// strips the goon branch from the clean build's JS; SITE.clean, read from
// another module, can't be folded away like that.
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
