# goonsite.org — Feature Ideas & Roadmap

## Guiding Principle
Every new feature should either (a) be a standalone tool someone would Google for, 
(b) increase time-on-site and return visits, or (c) generate backlinks/shares. 
Ideally two out of three. All features must be client-side friendly since the 
site runs on a Raspberry Pi with limited server resources.

---

## Tier 1: High-Impact Tools (SEO magnets)

### JWT Debugger & Security Analyzer
- Paste a JWT, get it decoded with color-coded header/payload/signature
- Flag common security issues: none algorithm, weak HMAC keys, expired tokens
- Interactive walkthrough of algorithm confusion (RS256 → HS256)
- Why it works: jwt.io is the only real competitor and it's bare-bones on 
  security analysis. Your JWT research gives you real authority here.
- Target queries: "JWT decoder", "JWT security checker", "JWT algorithm confusion"

### HTTP Security Header Analyzer
- Paste response headers OR enter a URL (client-side fetch where CORS allows, 
  or just paste mode to keep it Pi-friendly)
- Grade each header: HSTS, CSP, X-Frame-Options, CORS, etc.
- Explain what's missing and why it matters, with exploit scenarios
- Link to relevant notes pages for deeper reading
- Target queries: "security headers check", "CSP analyzer", "CORS checker"

### Encoding/Hashing Multitool
- Base64, URL encode/decode, hex, HTML entities, Unicode
- Hash generators: MD5, SHA1, SHA256, SHA512, bcrypt
- Hash identifier: paste a hash, guess the algorithm
- All client-side, instant, no server load
- Target queries: "base64 decode", "hash identifier", "sha256 generator"
- This is a volume play — encoding queries are extremely common

---

## Tier 2: Community & Engagement Features

### CTF-Style Challenges
- Small browser-based security challenges embedded in the site
- Start simple: find the hidden flag in this page's source, decode this 
  obfuscated string, spot the vulnerability in this code snippet
- Progressive difficulty, maybe a leaderboard tied to the message board auth
- This keeps people on-site and gives them a reason to come back
- Shareable: "I solved 5/10 challenges on goonsite.org" is social-media-friendly

### Writeup RSS Feed
- Add an RSS/Atom feed for the writeups section
- Security researchers still use RSS readers heavily
- Almost zero effort to implement, gives people a way to subscribe

### "Explain This Vuln" Interactive Cards
- Pick a vulnerability class (IDOR, XSS, SSRF, CORS misconfig, etc.)
- Show a minimal interactive demo: here's a mock request, here's what happens 
  when you change this parameter, here's why it's broken
- Not a full lab — just enough to click through and understand the concept
- Links to your full notes for the deep dive

---

## Tier 3: Nice-to-Have / Long-Term

### Terminal Playground
- Your terminal aesthetic is distinctive — lean into it
- Let visitors run safe "mock" commands that explore the site
- `whois goonsite.org`, `nmap goonsite.org` (returns fake/fun results), 
  `cat /etc/passwd` (easter egg), `help` shows real navigation
- The goon-hub page already hints at this — expand it

### Cheat Sheet Pages
- Single-page references: "OWASP Top 10 Quick Reference", 
  "Common Pentesting Commands", "Burp Suite Shortcuts"
- These are extremely high-volume search queries
- Format: dense, printable, no fluff — the kind of page people bookmark
- Target queries: "nmap cheat sheet", "burp suite cheat sheet", 
  "pentesting commands cheat sheet"

### Collaborative Writeup Submissions (The Wiki Lite)
- Instead of going full wiki, allow vetted users to submit writeups 
  through a PR-style workflow
- You review and publish, maintaining quality control
- Start with an open call: "Submit your vuln writeup, best ones get published"
- This tests the collaborative wiki idea without building the whole platform

---

## Features to Deprioritize

- **Full wiki/CMS platform** — too much maintenance overhead right now
- **User accounts beyond the message board** — auth systems are a liability 
  on a Pi, and you don't need them yet
- **Video content / streaming** — Pi can't handle it, and it's a different 
  content format than what your site does well
- **Forum / Discord clone** — the message board is enough community for now; 
  forums need critical mass to not feel dead

---

## Raspberry Pi Considerations

Since you're self-hosting on a Pi:
- Keep all tools client-side (JS in the browser, no server computation)
- Use static generation (Next.js SSG) wherever possible to minimize 
  server load per request
- For the message board, make sure you have rate limiting — a Pi can 
  get overwhelmed by even modest traffic spikes
- Consider Cloudflare (free tier) in front of the Pi for caching, 
  DDoS protection, and CDN — this alone can 10x your capacity
- If a feature needs server-side processing, consider whether it can 
  be a static page that rebuilds on a cron schedule instead
