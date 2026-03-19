"use client";

import { useState, useCallback } from "react";
import {
  Text,
  Paper,
  Textarea,
  Badge,
  Button,
  Group,
  Stack,
  Title,
  Box,
  Tooltip,
  Progress,
  Divider,
  Code,
  Collapse,
} from "@mantine/core";
import PageShell from "../../components/ui/PageShell";
import {
  IconShieldCheck,
  IconShieldOff,
  IconAlertTriangle,
  IconAnalyze,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconLock,
  IconLockOff,
  IconEye,
  IconBrowser,
  IconCookie,
  IconWorld,
  IconFrame,
  IconShieldLock,
  IconFingerprint,
  IconCameraOff,
  IconBug,
} from "@tabler/icons-react";

// ── Types ──────────────────────────────────────────────────────────────

type Grade = "A+" | "A" | "B" | "C" | "F";

interface HeaderAnalysis {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  value: string | null;
  grade: Grade;
  label: string;
  explanation: string;
  exploit: string;
}

// ── Color helpers ──────────────────────────────────────────────────────

const COLORS: Record<string, string> = {
  purple: "#bb9af7",
  cyan: "#7dcfff",
  red: "#f7768e",
  green: "#9ece6a",
  amber: "#e0af68",
  bg: "#0f0f14",
  surface: "#1a1b26",
  surfaceLight: "#24283b",
  muted: "#565f89",
  text: "#c0caf5",
};

function gradeColor(grade: Grade): string {
  switch (grade) {
    case "A+":
    case "A":
      return COLORS.green;
    case "B":
      return COLORS.amber;
    case "C":
      return COLORS.amber;
    case "F":
      return COLORS.red;
  }
}

function gradeBg(grade: Grade): string {
  switch (grade) {
    case "A+":
    case "A":
      return "rgba(158,206,106,0.08)";
    case "B":
    case "C":
      return "rgba(224,175,104,0.08)";
    case "F":
      return "rgba(247,118,142,0.08)";
  }
}

function gradePoints(grade: Grade): number {
  switch (grade) {
    case "A+":
      return 10;
    case "A":
      return 9;
    case "B":
      return 7;
    case "C":
      return 5;
    case "F":
      return 0;
  }
}

// ── Header analysis logic ──────────────────────────────────────────────

function analyzeHeaders(
  headers: Record<string, string>
): HeaderAnalysis[] {
  const results: HeaderAnalysis[] = [];

  // 1. Strict-Transport-Security
  const hsts = headers["strict-transport-security"] ?? null;
  let hstsGrade: Grade = "F";
  let hstsLabel = "Missing";
  let hstsExplanation =
    "HSTS tells browsers to only connect via HTTPS. Without it, users are vulnerable to SSL stripping attacks on first visit.";
  let hstsExploit =
    "An attacker on a shared network can intercept the initial HTTP request and downgrade the connection, capturing credentials and session tokens in plaintext.";
  if (hsts) {
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
    const hasSubDomains = /includeSubDomains/i.test(hsts);
    const hasPreload = /preload/i.test(hsts);

    if (maxAge >= 31536000 && hasSubDomains && hasPreload) {
      hstsGrade = "A+";
      hstsLabel = "Excellent";
      hstsExplanation =
        "HSTS is configured with a strong max-age (1+ year), includes subdomains, and is eligible for browser preload lists. This is the gold standard.";
      hstsExploit = "";
    } else if (maxAge >= 31536000 && hasSubDomains) {
      hstsGrade = "A";
      hstsLabel = "Good";
      hstsExplanation =
        "HSTS has a strong max-age and covers subdomains. Consider adding the preload directive and submitting to the HSTS preload list for maximum protection.";
      hstsExploit =
        "Without preload, the very first visit is still vulnerable to SSL stripping until the browser caches the HSTS policy.";
    } else if (maxAge >= 15768000) {
      hstsGrade = "B";
      hstsLabel = "Adequate";
      hstsExplanation =
        "HSTS is present but could be stronger. Increase max-age to at least 31536000 (1 year) and add includeSubDomains.";
      hstsExploit =
        "Without includeSubDomains, attackers can target subdomains with SSL stripping attacks and potentially steal cookies scoped to the parent domain.";
    } else {
      hstsGrade = "C";
      hstsLabel = "Weak";
      hstsExplanation =
        "HSTS max-age is too short. Browsers will forget the policy quickly, leaving a larger window for downgrade attacks.";
      hstsExploit =
        "A short max-age means the browser forgets to enforce HTTPS sooner, giving attackers a wider window to perform SSL stripping.";
    }
  }
  results.push({
    name: "strict-transport-security",
    displayName: "Strict-Transport-Security (HSTS)",
    icon: <IconLock size={20} />,
    value: hsts,
    grade: hstsGrade,
    label: hstsLabel,
    explanation: hstsExplanation,
    exploit: hstsExploit,
  });

  // 2. Content-Security-Policy
  const csp = headers["content-security-policy"] ?? null;
  let cspGrade: Grade = "F";
  let cspLabel = "Missing";
  let cspExplanation =
    "CSP controls which resources the browser can load. Without it, the page is fully open to cross-site scripting (XSS) attacks.";
  let cspExploit =
    "Attackers can inject malicious scripts via XSS that execute with full page privileges, stealing cookies, tokens, and user data.";
  if (csp) {
    const hasUnsafeInline = /unsafe-inline/i.test(csp);
    const hasUnsafeEval = /unsafe-eval/i.test(csp);
    const hasWildcard = /\s\*\s|;\s*\*|default-src\s+\*/i.test(csp);
    const hasDefaultSrc = /default-src/i.test(csp);
    const hasScriptSrc = /script-src/i.test(csp);

    if (hasWildcard) {
      cspGrade = "F";
      cspLabel = "Dangerous";
      cspExplanation =
        "CSP contains wildcard sources, making it essentially useless. Any origin can load scripts and resources.";
      cspExploit =
        "Wildcard CSP is equivalent to no CSP. Attackers can host malicious scripts on any domain and inject them.";
    } else if (hasUnsafeInline && hasUnsafeEval) {
      cspGrade = "C";
      cspLabel = "Weak";
      cspExplanation =
        "CSP allows both unsafe-inline and unsafe-eval, significantly reducing its effectiveness against XSS.";
      cspExploit =
        "With unsafe-inline, injected inline scripts execute freely. With unsafe-eval, attackers can use eval() to run arbitrary code.";
    } else if (hasUnsafeInline || hasUnsafeEval) {
      cspGrade = "B";
      cspLabel = "Partial";
      cspExplanation = `CSP is present but allows ${hasUnsafeInline ? "'unsafe-inline'" : "'unsafe-eval'"}. Consider using nonces or hashes instead for stronger XSS protection.`;
      cspExploit = hasUnsafeInline
        ? "Allowing unsafe-inline means injected inline scripts and styles will execute, undermining CSP's primary purpose."
        : "Allowing unsafe-eval lets attackers use eval(), Function(), and setTimeout(string) to execute arbitrary JavaScript.";
    } else if (hasDefaultSrc || hasScriptSrc) {
      cspGrade = "A+";
      cspLabel = "Strong";
      cspExplanation =
        "CSP is well-configured without unsafe directives. This provides strong protection against XSS and data injection attacks.";
      cspExploit = "";
    } else {
      cspGrade = "B";
      cspLabel = "Incomplete";
      cspExplanation =
        "CSP is present but may be missing key directives like default-src or script-src. Ensure all resource types are covered.";
      cspExploit =
        "Missing directives fall back to the browser default (allow all), potentially leaving gaps an attacker could exploit.";
    }
  }
  results.push({
    name: "content-security-policy",
    displayName: "Content-Security-Policy (CSP)",
    icon: <IconShieldLock size={20} />,
    value: csp,
    grade: cspGrade,
    label: cspLabel,
    explanation: cspExplanation,
    exploit: cspExploit,
  });

  // 3. X-Frame-Options
  const xfo = headers["x-frame-options"] ?? null;
  let xfoGrade: Grade = "F";
  let xfoLabel = "Missing";
  let xfoExplanation =
    "X-Frame-Options prevents your page from being embedded in iframes, protecting against clickjacking attacks.";
  let xfoExploit =
    "Without this header, attackers can embed your page in a transparent iframe and trick users into clicking hidden elements, performing actions like changing passwords or transferring funds.";
  if (xfo) {
    const val = xfo.toUpperCase().trim();
    if (val === "DENY") {
      xfoGrade = "A+";
      xfoLabel = "Optimal";
      xfoExplanation =
        "Set to DENY, which completely prevents the page from being framed. This is the strictest and safest setting.";
      xfoExploit = "";
    } else if (val === "SAMEORIGIN") {
      xfoGrade = "A";
      xfoLabel = "Good";
      xfoExplanation =
        "Set to SAMEORIGIN, allowing framing only from the same origin. This is safe for most applications that don't need cross-origin framing.";
      xfoExploit = "";
    } else if (val.startsWith("ALLOW-FROM")) {
      xfoGrade = "C";
      xfoLabel = "Deprecated";
      xfoExplanation =
        "ALLOW-FROM is deprecated and not supported by modern browsers. Use CSP frame-ancestors directive instead.";
      xfoExploit =
        "Since ALLOW-FROM is ignored by most browsers, the page may be frameable, leaving it vulnerable to clickjacking.";
    } else {
      xfoGrade = "F";
      xfoLabel = "Invalid";
      xfoExplanation = `Unrecognized value "${xfo}". Browsers will ignore this, providing no clickjacking protection.`;
      xfoExploit =
        "An invalid value is treated the same as missing the header entirely, leaving the page open to clickjacking.";
    }
  }
  results.push({
    name: "x-frame-options",
    displayName: "X-Frame-Options",
    icon: <IconFrame size={20} />,
    value: xfo,
    grade: xfoGrade,
    label: xfoLabel,
    explanation: xfoExplanation,
    exploit: xfoExploit,
  });

  // 4. X-Content-Type-Options
  const xcto = headers["x-content-type-options"] ?? null;
  let xctoGrade: Grade = "F";
  let xctoLabel = "Missing";
  let xctoExplanation =
    "This header prevents browsers from MIME-sniffing responses away from the declared Content-Type, blocking content-type confusion attacks.";
  let xctoExploit =
    "Without nosniff, browsers may interpret files as executable scripts. An attacker could upload a file with a harmless extension but malicious content that gets executed as JavaScript.";
  if (xcto) {
    if (xcto.trim().toLowerCase() === "nosniff") {
      xctoGrade = "A+";
      xctoLabel = "Correct";
      xctoExplanation =
        "Set to nosniff. Browsers will strictly follow the declared Content-Type and refuse to MIME-sniff. This is the only valid value for this header.";
      xctoExploit = "";
    } else {
      xctoGrade = "F";
      xctoLabel = "Invalid";
      xctoExplanation = `Value "${xcto}" is not recognized. The only valid value is "nosniff".`;
      xctoExploit =
        "An invalid value provides no protection. Browsers will still MIME-sniff, allowing content-type confusion attacks.";
    }
  }
  results.push({
    name: "x-content-type-options",
    displayName: "X-Content-Type-Options",
    icon: <IconEye size={20} />,
    value: xcto,
    grade: xctoGrade,
    label: xctoLabel,
    explanation: xctoExplanation,
    exploit: xctoExploit,
  });

  // 5. Referrer-Policy
  const rp = headers["referrer-policy"] ?? null;
  let rpGrade: Grade = "F";
  let rpLabel = "Missing";
  let rpExplanation =
    "Referrer-Policy controls how much referrer information is sent with requests. Without it, browsers use a default that may leak sensitive URL paths to third parties.";
  let rpExploit =
    "Full referrer URLs can leak sensitive data like session tokens, private page paths, or search queries to external sites through the Referer header.";
  if (rp) {
    const val = rp.trim().toLowerCase();
    const strict = [
      "no-referrer",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
    ];
    const moderate = ["origin", "origin-when-cross-origin"];
    if (strict.includes(val)) {
      rpGrade = "A+";
      rpLabel = "Strong";
      rpExplanation = `Set to "${val}", which provides strong privacy protection. Referrer information is tightly controlled across origins.`;
      rpExploit = "";
    } else if (moderate.includes(val)) {
      rpGrade = "B";
      rpLabel = "Moderate";
      rpExplanation = `Set to "${val}". This sends the origin but not the full path. Consider using strict-origin-when-cross-origin for better protection.`;
      rpExploit =
        "While the full URL path isn't leaked, the origin is still sent to cross-origin destinations, which may reveal internal hostnames.";
    } else if (val === "unsafe-url" || val === "no-referrer-when-downgrade") {
      rpGrade = "C";
      rpLabel = "Weak";
      rpExplanation = `Set to "${val}", which sends full referrer information. This can leak sensitive URL paths and query parameters to third-party sites.`;
      rpExploit =
        "The full URL including path and query string is sent to external sites, potentially exposing tokens, user IDs, or private content paths.";
    } else {
      rpGrade = "B";
      rpLabel = "Unknown";
      rpExplanation = `Value "${val}" is not a standard Referrer-Policy. Browsers may ignore it and fall back to their default behavior.`;
      rpExploit =
        "Non-standard values may be silently ignored, causing the browser to use its default policy which may leak referrer data.";
    }
  }
  results.push({
    name: "referrer-policy",
    displayName: "Referrer-Policy",
    icon: <IconFingerprint size={20} />,
    value: rp,
    grade: rpGrade,
    label: rpLabel,
    explanation: rpExplanation,
    exploit: rpExploit,
  });

  // 6. Permissions-Policy
  const pp =
    headers["permissions-policy"] ?? headers["feature-policy"] ?? null;
  let ppGrade: Grade = "F";
  let ppLabel = "Missing";
  let ppExplanation =
    "Permissions-Policy restricts which browser features (camera, microphone, geolocation) the page and embedded iframes can use.";
  let ppExploit =
    "Without this header, embedded third-party iframes can request access to sensitive device features like camera, microphone, and geolocation without restriction.";
  if (pp) {
    const restrictsCamera =
      /camera\s*=\s*\(\s*\)/.test(pp) ||
      /camera\s*=\s*\(\s*self\s*\)/.test(pp) ||
      /camera\s+'none'/.test(pp);
    const restrictsMic =
      /microphone\s*=\s*\(\s*\)/.test(pp) ||
      /microphone\s*=\s*\(\s*self\s*\)/.test(pp) ||
      /microphone\s+'none'/.test(pp);
    const restrictsGeo =
      /geolocation\s*=\s*\(\s*\)/.test(pp) ||
      /geolocation\s*=\s*\(\s*self\s*\)/.test(pp) ||
      /geolocation\s+'none'/.test(pp);

    const count = [restrictsCamera, restrictsMic, restrictsGeo].filter(
      Boolean
    ).length;

    if (count === 3) {
      ppGrade = "A+";
      ppLabel = "Comprehensive";
      ppExplanation =
        "Camera, microphone, and geolocation are all restricted. This prevents third-party iframes from accessing sensitive device features.";
      ppExploit = "";
    } else if (count >= 1) {
      ppGrade = "B";
      ppLabel = "Partial";
      const missing = [];
      if (!restrictsCamera) missing.push("camera");
      if (!restrictsMic) missing.push("microphone");
      if (!restrictsGeo) missing.push("geolocation");
      ppExplanation = `Some features are restricted but ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} not explicitly limited. Consider restricting all sensitive APIs.`;
      ppExploit = `Third-party iframes could still request access to ${missing.join(", ")}, potentially enabling surveillance through embedded content.`;
    } else {
      ppGrade = "B";
      ppLabel = "Present";
      ppExplanation =
        "Permissions-Policy is set but doesn't explicitly restrict camera, microphone, or geolocation. Review and add restrictions for sensitive APIs.";
      ppExploit =
        "Without explicit restrictions on sensitive features, embedded content may request device access.";
    }
  }
  results.push({
    name: "permissions-policy",
    displayName: "Permissions-Policy",
    icon: <IconCameraOff size={20} />,
    value: pp,
    grade: ppGrade,
    label: ppLabel,
    explanation: ppExplanation,
    exploit: ppExploit,
  });

  // 7. X-XSS-Protection
  const xxss = headers["x-xss-protection"] ?? null;
  let xxssGrade: Grade = "B";
  let xxssLabel = "Missing (OK)";
  let xxssExplanation =
    "X-XSS-Protection is deprecated. Modern browsers have removed their XSS auditors. A strong CSP is the proper replacement. Missing is acceptable.";
  let xxssExploit = "";
  if (xxss) {
    const val = xxss.trim();
    if (val === "0") {
      xxssGrade = "A";
      xxssLabel = "Disabled (Correct)";
      xxssExplanation =
        "Set to 0, explicitly disabling the XSS auditor. This is the recommended value because the auditor itself had vulnerabilities that could be exploited.";
      xxssExploit = "";
    } else if (val.includes("mode=block")) {
      xxssGrade = "B";
      xxssLabel = "Legacy";
      xxssExplanation =
        "Set to mode=block. While this was once best practice, the XSS auditor is removed in modern browsers and could introduce vulnerabilities in older ones.";
      xxssExploit =
        "In older browsers, the XSS auditor could be tricked into disabling legitimate scripts, enabling selective script injection attacks.";
    } else if (val === "1") {
      xxssGrade = "C";
      xxssLabel = "Risky";
      xxssExplanation =
        "Set to 1 without mode=block. This enables the XSS auditor in filtering mode, which can introduce information leakage vulnerabilities.";
      xxssExploit =
        "The filtering mode can be abused to selectively disable scripts on the page, enabling more sophisticated XSS attacks through the auditor itself.";
    }
  }
  results.push({
    name: "x-xss-protection",
    displayName: "X-XSS-Protection (Deprecated)",
    icon: <IconBug size={20} />,
    value: xxss,
    grade: xxssGrade,
    label: xxssLabel,
    explanation: xxssExplanation,
    exploit: xxssExploit,
  });

  // 8. Access-Control-Allow-Origin (CORS)
  const cors = headers["access-control-allow-origin"] ?? null;
  let corsGrade: Grade = "A";
  let corsLabel = "Not Set";
  let corsExplanation =
    "No CORS header present, meaning cross-origin requests from browsers are blocked by default. This is the most restrictive and safest configuration.";
  let corsExploit = "";
  if (cors) {
    const val = cors.trim();
    if (val === "*") {
      corsGrade = "C";
      corsLabel = "Wildcard";
      corsExplanation =
        "Set to *, allowing any website to read responses. If the server returns sensitive data, this is dangerous.";
      corsExploit =
        "Any website can make authenticated requests and read the response if credentials are included, potentially exfiltrating user data.";
      // Check if credentials are also allowed
      const corsCredentials =
        headers["access-control-allow-credentials"] ?? null;
      if (corsCredentials?.toLowerCase() === "true") {
        corsGrade = "F";
        corsLabel = "Dangerous";
        corsExplanation =
          "CORS allows any origin with credentials. Note: browsers block * with credentials, but if the server reflects the Origin header, this is critically dangerous.";
        corsExploit =
          "If the server reflects the requesting origin, any malicious site can make credentialed cross-origin requests and read sensitive responses, stealing user data.";
      }
    } else if (val === "null") {
      corsGrade = "F";
      corsLabel = "Dangerous";
      corsExplanation =
        'Set to "null", which can be spoofed via sandboxed iframes. Never use "null" as an allowed origin.';
      corsExploit =
        'Attackers can use sandboxed iframes to send requests with an Origin of "null", bypassing this CORS restriction entirely.';
    } else {
      corsGrade = "A";
      corsLabel = "Specific Origin";
      corsExplanation = `Set to "${val}". Restricting to specific origins is good practice. Ensure this origin is trusted and intended.`;
      corsExploit = "";
    }
  }
  results.push({
    name: "access-control-allow-origin",
    displayName: "Access-Control-Allow-Origin (CORS)",
    icon: <IconWorld size={20} />,
    value: cors,
    grade: corsGrade,
    label: corsLabel,
    explanation: corsExplanation,
    exploit: corsExploit,
  });

  // 9. Cache-Control
  const cc = headers["cache-control"] ?? null;
  let ccGrade: Grade = "B";
  let ccLabel = "Missing";
  let ccExplanation =
    "No Cache-Control header found. Browsers and proxies may cache responses by default, potentially storing sensitive content.";
  let ccExploit =
    "Without explicit caching directives, sensitive pages (dashboards, account settings) may be cached by shared proxies or browser history, accessible to other users on the same machine.";
  if (cc) {
    const val = cc.toLowerCase();
    const hasNoStore = val.includes("no-store");
    const hasNoCache = val.includes("no-cache");
    const hasPrivate = val.includes("private");
    const hasPublic = val.includes("public");

    if (hasNoStore) {
      ccGrade = "A+";
      ccLabel = "No Store";
      ccExplanation =
        "Set to no-store, preventing caching entirely. This is the safest setting for pages with sensitive data like authentication pages or dashboards.";
      ccExploit = "";
    } else if (hasNoCache && hasPrivate) {
      ccGrade = "A";
      ccLabel = "Revalidate";
      ccExplanation =
        "Set to private with no-cache. Content is not shared-cached and must be revalidated. Good for personalized but non-secret content.";
      ccExploit = "";
    } else if (hasPrivate) {
      ccGrade = "B";
      ccLabel = "Private";
      ccExplanation =
        "Marked as private (not stored by shared caches) but may still be stored in the browser cache. Add no-store for sensitive pages.";
      ccExploit =
        "Browser-cached content persists on disk and can be accessed by other users of the same device or retrieved through cache inspection.";
    } else if (hasPublic) {
      ccGrade = "C";
      ccLabel = "Public";
      ccExplanation =
        "Marked as public, allowing shared caches (CDNs, proxies) to store the response. Only appropriate for truly public, non-sensitive content.";
      ccExploit =
        "Shared proxy caches may serve this content to other users. If the page contains personalized or sensitive data, it could be exposed.";
    } else {
      ccGrade = "B";
      ccLabel = "Present";
      ccExplanation = `Set to "${cc}". Review whether the caching policy is appropriate for the sensitivity of the content served.`;
      ccExploit = "";
    }
  }
  results.push({
    name: "cache-control",
    displayName: "Cache-Control",
    icon: <IconBrowser size={20} />,
    value: cc,
    grade: ccGrade,
    label: ccLabel,
    explanation: ccExplanation,
    exploit: ccExploit,
  });

  // 10. Set-Cookie
  const setCookie = headers["set-cookie"] ?? null;
  let cookieGrade: Grade = "A";
  let cookieLabel = "No Cookies";
  let cookieExplanation =
    "No Set-Cookie header found. If the application uses cookies for sessions, check the actual login response headers.";
  let cookieExploit = "";
  if (setCookie) {
    const lower = setCookie.toLowerCase();
    const hasSecure = lower.includes("secure");
    const hasHttpOnly = lower.includes("httponly");
    const hasSameSite = lower.includes("samesite");
    const flags = [hasSecure, hasHttpOnly, hasSameSite];
    const missing: string[] = [];
    if (!hasSecure) missing.push("Secure");
    if (!hasHttpOnly) missing.push("HttpOnly");
    if (!hasSameSite) missing.push("SameSite");

    if (flags.every(Boolean)) {
      cookieGrade = "A+";
      cookieLabel = "Well-Secured";
      cookieExplanation =
        "Cookie has Secure, HttpOnly, and SameSite flags. This provides comprehensive protection against interception, XSS theft, and CSRF attacks.";
      cookieExploit = "";
    } else if (flags.filter(Boolean).length >= 2) {
      cookieGrade = "B";
      cookieLabel = "Mostly Secure";
      cookieExplanation = `Cookie is missing the ${missing.join(", ")} ${missing.length === 1 ? "flag" : "flags"}. Add ${missing.length === 1 ? "it" : "them"} for complete protection.`;
      cookieExploit = !hasSecure
        ? "Without Secure, cookies are sent over HTTP, allowing interception on unencrypted connections."
        : !hasHttpOnly
          ? "Without HttpOnly, JavaScript can read the cookie, making it stealable via XSS attacks."
          : "Without SameSite, the cookie is sent with cross-site requests, enabling CSRF attacks.";
    } else {
      cookieGrade = "F";
      cookieLabel = "Insecure";
      cookieExplanation = `Cookie is missing ${missing.join(", ")}. This leaves the cookie vulnerable to multiple attack vectors.`;
      cookieExploit =
        "Cookies without proper flags can be stolen via XSS (no HttpOnly), intercepted over HTTP (no Secure), or abused in CSRF attacks (no SameSite).";
    }
  }
  results.push({
    name: "set-cookie",
    displayName: "Set-Cookie",
    icon: <IconCookie size={20} />,
    value: setCookie,
    grade: cookieGrade,
    label: cookieLabel,
    explanation: cookieExplanation,
    exploit: cookieExploit,
  });

  return results;
}

function computeOverallScore(results: HeaderAnalysis[]): {
  score: number;
  grade: Grade;
} {
  const total = results.reduce((sum, r) => sum + gradePoints(r.grade), 0);
  const max = results.length * 10;
  const pct = Math.round((total / max) * 100);
  let grade: Grade = "F";
  if (pct >= 95) grade = "A+";
  else if (pct >= 85) grade = "A";
  else if (pct >= 70) grade = "B";
  else if (pct >= 50) grade = "C";
  return { score: pct, grade };
}

// ── Sample headers for demo ────────────────────────────────────────────

const SAMPLE_HEADERS = `HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains; preload
content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'
x-frame-options: DENY
x-content-type-options: nosniff
referrer-policy: strict-origin-when-cross-origin
permissions-policy: camera=(), microphone=(), geolocation=()
cache-control: no-store
set-cookie: session=abc123; Secure; HttpOnly; SameSite=Strict`;

// ── Component ──────────────────────────────────────────────────────────

function HeaderGradeIcon({ grade }: { grade: Grade }) {
  if (grade === "A+" || grade === "A") {
    return <IconShieldCheck size={20} color={COLORS.green} />;
  }
  if (grade === "B" || grade === "C") {
    return <IconAlertTriangle size={20} color={COLORS.amber} />;
  }
  return <IconShieldOff size={20} color={COLORS.red} />;
}

function HeaderCard({
  analysis,
  defaultOpen,
}: {
  analysis: HeaderAnalysis;
  defaultOpen: boolean;
}) {
  const [opened, setOpened] = useState(defaultOpen);

  return (
    <Paper
      p="md"
      radius="md"
      style={{
        backgroundColor: gradeBg(analysis.grade),
        border: `1px solid ${gradeColor(analysis.grade)}22`,
      }}
    >
      <Group
        justify="space-between"
        wrap="nowrap"
        style={{ cursor: "pointer" }}
        onClick={() => setOpened((o) => !o)}
      >
        <Group gap="sm" wrap="nowrap">
          <Box style={{ color: gradeColor(analysis.grade), flexShrink: 0 }}>
            {analysis.icon}
          </Box>
          <Box>
            <Text fw={600} size="sm" style={{ color: COLORS.text }}>
              {analysis.displayName}
            </Text>
            <Text size="xs" c="dimmed" lineClamp={1}>
              {analysis.value ? analysis.value : "Not present in response"}
            </Text>
          </Box>
        </Group>
        <Group gap="xs" wrap="nowrap">
          <Badge
            size="lg"
            variant="filled"
            style={{
              backgroundColor: `${gradeColor(analysis.grade)}22`,
              color: gradeColor(analysis.grade),
              border: `1px solid ${gradeColor(analysis.grade)}44`,
              fontWeight: 700,
              minWidth: 40,
              textAlign: "center",
            }}
          >
            {analysis.grade}
          </Badge>
          <Badge
            size="sm"
            variant="light"
            style={{
              backgroundColor: `${gradeColor(analysis.grade)}11`,
              color: gradeColor(analysis.grade),
            }}
          >
            {analysis.label}
          </Badge>
          <Box style={{ color: COLORS.muted }}>
            {opened ? (
              <IconChevronDown size={16} />
            ) : (
              <IconChevronRight size={16} />
            )}
          </Box>
        </Group>
      </Group>

      <Collapse in={opened}>
        <Divider
          my="sm"
          color={`${gradeColor(analysis.grade)}22`}
        />
        {analysis.value && (
          <Code
            block
            style={{
              backgroundColor: "rgba(0,0,0,0.3)",
              color: COLORS.cyan,
              fontSize: 12,
              marginBottom: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}
          >
            {analysis.value}
          </Code>
        )}
        <Text size="sm" style={{ color: COLORS.text, lineHeight: 1.6 }}>
          {analysis.explanation}
        </Text>
        {analysis.exploit && (
          <Paper
            mt="sm"
            p="sm"
            radius="sm"
            style={{
              backgroundColor: "rgba(247,118,142,0.06)",
              border: "1px solid rgba(247,118,142,0.15)",
            }}
          >
            <Group gap={6} mb={4}>
              <IconAlertTriangle size={14} color={COLORS.red} />
              <Text size="xs" fw={600} style={{ color: COLORS.red }}>
                Attack Scenario
              </Text>
            </Group>
            <Text size="xs" style={{ color: "#a9b1d6", lineHeight: 1.5 }}>
              {analysis.exploit}
            </Text>
          </Paper>
        )}
      </Collapse>
    </Paper>
  );
}

function OverallScoreDisplay({
  score,
  grade,
}: {
  score: number;
  grade: Grade;
}) {
  return (
    <Paper
      p="xl"
      radius="md"
      style={{
        backgroundColor: COLORS.surface,
        border: `1px solid ${gradeColor(grade)}33`,
        textAlign: "center",
      }}
    >
      <Text size="xs" tt="uppercase" fw={700} c="dimmed" mb="xs">
        Overall Security Score
      </Text>
      <Text
        fw={900}
        style={{
          fontSize: 64,
          color: gradeColor(grade),
          lineHeight: 1,
        }}
      >
        {grade}
      </Text>
      <Progress
        value={score}
        size="lg"
        radius="xl"
        mt="md"
        mb="xs"
        color={gradeColor(grade)}
        style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
      />
      <Text size="sm" style={{ color: COLORS.text }}>
        <Text component="span" fw={700} style={{ color: gradeColor(grade) }}>
          {score}
        </Text>{" "}
        / 100 points
      </Text>
    </Paper>
  );
}

export default function HttpHeaderAnalyzer() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<HeaderAnalysis[] | null>(null);
  const [overallScore, setOverallScore] = useState<{
    score: number;
    grade: Grade;
  } | null>(null);

  const analyze = useCallback(() => {
    const headers: Record<string, string> = {};
    const lines = input.split("\n");
    lines.forEach((line) => {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        const name = line.substring(0, colonIdx).trim().toLowerCase();
        const value = line.substring(colonIdx + 1).trim();
        headers[name] = value;
      }
    });

    const analysisResults = analyzeHeaders(headers);
    setResults(analysisResults);
    setOverallScore(computeOverallScore(analysisResults));
  }, [input]);

  const clear = useCallback(() => {
    setInput("");
    setResults(null);
    setOverallScore(null);
  }, []);

  const loadSample = useCallback(() => {
    setInput(SAMPLE_HEADERS);
    setResults(null);
    setOverallScore(null);
  }, []);

  return (
    <PageShell maxWidth="lg">
        <Box style={{ maxWidth: 860, margin: "0 auto" }}>
          {/* Header */}
          <Box mt="lg" mb="xl">
            <Group gap="sm" mb={4}>
              <IconShieldCheck size={28} color={COLORS.purple} />
              <Title
                order={1}
                style={{
                  color: COLORS.text,
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                HTTP Security Header Analyzer
              </Title>
            </Group>
            <Text size="sm" style={{ color: COLORS.muted, maxWidth: 600 }}>
              Paste HTTP response headers to analyze their security
              configuration. Get grades, explanations, and attack scenarios for
              each header.
            </Text>
          </Box>

          {/* Input area */}
          <Paper
            p="lg"
            radius="md"
            mb="lg"
            style={{
              backgroundColor: COLORS.surface,
              border: `1px solid ${COLORS.surfaceLight}`,
            }}
          >
            <Text fw={600} size="sm" mb="xs" style={{ color: COLORS.text }}>
              Paste Raw HTTP Response Headers
            </Text>
            <Text size="xs" c="dimmed" mb="sm">
              One header per line in the format{" "}
              <Code style={{ fontSize: 11 }}>Header-Name: value</Code>. Status
              lines and blank lines are ignored.
            </Text>
            <Textarea
              placeholder={`strict-transport-security: max-age=31536000; includeSubDomains\ncontent-security-policy: default-src 'self'\nx-frame-options: DENY\nx-content-type-options: nosniff\n...`}
              minRows={8}
              maxRows={20}
              autosize
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              styles={{
                input: {
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderColor: COLORS.surfaceLight,
                  color: COLORS.text,
                  fontFamily: "monospace",
                  fontSize: 13,
                  "&::placeholder": { color: COLORS.muted },
                },
              }}
            />
            <Group mt="md" gap="sm">
              <Button
                onClick={analyze}
                disabled={!input.trim()}
                leftSection={<IconAnalyze size={16} />}
                style={{
                  backgroundColor: COLORS.purple,
                  color: "#0f0f14",
                  fontWeight: 700,
                  "&:hover": { backgroundColor: "#a98de0" },
                }}
              >
                Analyze Headers
              </Button>
              <Button
                variant="subtle"
                color="gray"
                onClick={loadSample}
                size="sm"
              >
                Load Example
              </Button>
              {results && (
                <Button
                  variant="subtle"
                  color="red"
                  onClick={clear}
                  leftSection={<IconTrash size={14} />}
                  size="sm"
                >
                  Clear
                </Button>
              )}
            </Group>
          </Paper>

          {/* Results */}
          {results && overallScore && (
            <Stack gap="md">
              <OverallScoreDisplay
                score={overallScore.score}
                grade={overallScore.grade}
              />

              {/* Summary badges */}
              <Paper
                p="md"
                radius="md"
                style={{
                  backgroundColor: COLORS.surface,
                  border: `1px solid ${COLORS.surfaceLight}`,
                }}
              >
                <Group gap="sm" justify="center">
                  {(["A+", "A", "B", "C", "F"] as Grade[]).map((g) => {
                    const count = results.filter((r) => r.grade === g).length;
                    if (count === 0) return null;
                    return (
                      <Tooltip key={g} label={`${count} header(s) graded ${g}`}>
                        <Badge
                          size="lg"
                          variant="filled"
                          style={{
                            backgroundColor: `${gradeColor(g)}22`,
                            color: gradeColor(g),
                            border: `1px solid ${gradeColor(g)}44`,
                            fontWeight: 700,
                          }}
                        >
                          {g}: {count}
                        </Badge>
                      </Tooltip>
                    );
                  })}
                </Group>
              </Paper>

              {/* Individual header cards */}
              <Stack gap="sm">
                {results.map((r) => (
                  <HeaderCard
                    key={r.name}
                    analysis={r}
                    defaultOpen={r.grade === "F" || r.grade === "C"}
                  />
                ))}
              </Stack>

              {/* Footer note */}
              <Text
                size="xs"
                c="dimmed"
                ta="center"
                mt="sm"
                mb="xl"
                style={{ lineHeight: 1.5 }}
              >
                This tool performs client-side analysis only. No headers are
                sent to any server. For the most accurate assessment, also
                review headers on authentication and API endpoints.
              </Text>
            </Stack>
          )}
        </Box>
    </PageShell>
  );
}
