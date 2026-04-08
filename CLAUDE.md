# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start dev server (localhost:3000)
- `npm run build` - Build for production (uses webpack)
- `npm start` - Start production server (port 9999)
- `npm run lint` - Run ESLint checks
- `npm run test` - Run tests in watch mode (Vitest)
- `npm run test:run` - Run tests once and exit

## Architecture

### Project Structure
This is a **content-driven Next.js site** that dynamically renders markdown files from the `/data` directory. The site has multiple themed sections (Jerry, Goon Hub, Projects, Notes) and an admin panel for visitor analytics.

**Key directories:**
- `/app` - Next.js App Router pages and API routes
  - `/api/internal` - Internal endpoints (visitor logging)
  - `/api/admin` - Admin endpoints (analytics, visitor data)
  - `/admin` - Admin UI pages
  - `/components` - Shared React components
  - `/jerry`, `/projects`, `/notes` - Content sections (dynamic routes via `[...slug]`)
- `/data` - Markdown content and visitor logs
  - `/data/projects` - Project markdown files (hierarchical)
  - `/data/notes` - Note markdown files with wiki-link support
  - `/data/visitors` - JSONL visitor logs (one file per day)
- `/lib` - Utility functions: `projects.ts`, `notes.ts`, `geo-cache.ts`, `rate-limit.ts`, `notify.ts`
- `/public` - Static assets

### Content Management Pattern
Projects and Notes follow a **file-based headless CMS** pattern:

1. **Markdown files** in `/data/projects` or `/data/notes` with optional frontmatter (gray-matter)
2. **Utility functions** (`getProjectBySlug()`, `getNoteBySlug()`) read and parse files with fallback to filename for title
3. **Dynamic routes** like `/app/projects/[...slug]/page.tsx` use these utilities to render content
4. **Tree building functions** (`buildProjectTree()`, `buildNoteTree()`) power sidebars with hierarchical navigation

**Wiki-link support**: Notes can use `[[Link]]` syntax which converts to markdown links via `convertWikiLinks()` in `lib/notes.ts`.

### API Endpoints

**Visitor Tracking:**
- `POST /api/internal/log-visit` - Log page views and clicks
  - Rate limited: 30 req/10s per IP
  - Accepts `content-type: text/plain` or `application/json`
  - Records: path, timestamp, IP, type (view/click), and triggers geo-IP lookup
  - Stores as JSONL in `/data/visitors/{YYYY-MM-DD}.jsonl`

**Admin:**
- `GET /api/admin/visitors?filters=...` - Query visitor logs with filters (ip, location, referrer, path, type, dateFrom, dateTo)
- `GET /api/admin/insights` - Aggregated analytics (view counts, referrers, locations, top pages)

### Key Components & Patterns

**MarkdownRenderer**: Renders markdown to HTML with syntax highlighting (Prism.js). Handles custom CSS for headings, code blocks, and tables.

**Sidebar Navigation** (NotesSidebar, ProjectsSidebar): Tree-based navigation built from `buildTreeItem[]` structures, with click handlers to filter/navigate content.

**VisitorBeacon**: Client component that logs page views via `navigator.sendBeacon()` and tracks clicks on links with `data-tracked` attribute.

**Providers**: Mantine's MantineProvider wraps the app for UI theming.

### Data Flow
1. **Static content**: Markdown files → parsed at build/render time → tree structure → sidebar + page content
2. **Dynamic routes**: `[...slug]` params → `getBySlug()` → markdown loaded → component renders
3. **Visitor tracking**: Client sends JSON → `log-visit` API → JSONL appended to daily file → geo cached
4. **Admin queries**: Filter JSONL files client-side (loaded via API) or aggregate server-side in `/api/admin/insights`

### Styling
- **Tailwind CSS** + **Mantine Core** (component library with dark theme)
- **Global styles** in `/app/globals.css`
- **Typography**: Geist font from `geist/font/sans`
- **Theme**: Dark mode by default (set in layout.tsx)

### Testing
- **Framework**: Vitest + React Testing Library
- **Setup**: `/vitest.config.ts` configures jsdom, globals, CSS support
- **Example**: `/app/components/MarkdownRenderer.test.tsx` shows pattern
- Run with `npm run test` (watch) or `npm run test:run` (once)

## Important Implementation Details

### File-based Visitor Logs
Visitor logs are **persisted as JSONL** in `/data/visitors/{date}.jsonl` (one file per day in PT timezone). Each line is a JSON object. This is intentional for:
- Low-overhead logging (append-only)
- Easy backups (files are portable)
- Manual inspection/debugging

When modifying visitor tracking, be aware:
- New fields are appended to the same day's file
- The API reads files from disk (not a database)
- Admin page filters/aggregates in memory or server-side

### Rate Limiting
`lib/rate-limit.ts` uses an in-memory token bucket (keyed by action + IP). Tokens reset on server restart. For production, consider upgrading to Redis or similar if you need persistence.

### Geo-IP Caching
`lib/geo-cache.ts` caches IP → location lookups in `/data/visitors/geo.json`. This avoids repeated lookups for the same IP and speeds up admin queries. Manual cleanup may be needed if the cache grows very large.

### Markdown Front Matter
Use YAML front matter for custom metadata:
```
---
title: Custom Title
description: Optional description
---
# Content starts here
```
If no front matter is present, the filename (title-cased) is used as the title.

## Common Patterns

### Adding a New Content Section
1. Create new markdown directory: `/data/section-name`
2. Add utility functions (`getBySlug`, `buildTree`) in `/lib/section-name.ts` (copy from `projects.ts` or `notes.ts`)
3. Create dynamic route: `/app/section-name/[...slug]/page.tsx`
4. Create sidebar component if needed: `/app/components/SectionSidebar.tsx`
5. Add link in main layout

### Adding a New API Endpoint
1. Create route file: `/app/api/path/to/route.ts` with `export async function GET/POST/etc(request: NextRequest)`
2. Use `request.headers.get()` for auth, IP, etc.
3. Return `NextResponse.json()` or `NextResponse.text()`
4. Consider rate limiting via `lib/rate-limit.ts`

### Adding Tests
1. Create `.test.tsx` file next to the component
2. Use `describe()`, `it()`, `expect()` from Vitest
3. Use React Testing Library for DOM queries
4. Run with `npm run test` or `npm run test:run`
