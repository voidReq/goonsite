"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MantineProvider,
  Text,
  Paper,
  Textarea,
  Tabs,
  Badge,
  CopyButton,
  ActionIcon,
  Tooltip,
  Button,
  Group,
  Stack,
  Box,
  Select,
} from "@mantine/core";
import "@mantine/core/styles.css";
import {
  IconArrowLeft,
  IconArrowsExchange,
  IconCopy,
  IconCheck,
  IconHash,
  IconCode,
  IconSearch,
  IconLock,
  IconAlertTriangle,
  IconQuestionMark,
} from "@tabler/icons-react";

// ---------------------------------------------------------------------------
// MD5 Implementation (public domain, RFC 1321)
// ---------------------------------------------------------------------------
function md5(string: string): string {
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);   d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);  b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);      b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);   d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);   b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);  b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);     d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);   b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);  d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);   b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);       d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);  b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);   d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);   b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);   b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);   b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);   d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);  b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  function md5blk(s: string) {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] =
        s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) +
        (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  function add32(a: number, b: number) {
    return (a + b) & 0xffffffff;
  }

  function rhex(n: number) {
    const hexChr = "0123456789abcdef";
    let s = "";
    for (let j = 0; j < 4; j++)
      s += hexChr.charAt((n >> (j * 8 + 4)) & 0x0f) + hexChr.charAt((n >> (j * 8)) & 0x0f);
    return s;
  }

  function hex(x: number[]) {
    return x.map(rhex).join("");
  }

  // Convert to UTF-8 encoded latin1 string
  let str = unescape(encodeURIComponent(string));

  const n = str.length;
  let state = [1732584193, -271733879, -1732584194, 271733878];
  let i: number;

  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(str.substring(i - 64, i)));
  }
  str = str.substring(i - 64);
  const tail: number[] = Array(16).fill(0);
  for (i = 0; i < str.length; i++)
    tail[i >> 2] |= str.charCodeAt(i) << ((i % 4) << 3);
  tail[i >> 2] |= 0x80 << ((i % 4) << 3);
  if (i > 55) {
    md5cycle(state, tail);
    tail.fill(0);
  }
  tail[14] = n * 8;
  md5cycle(state, tail);
  return hex(state);
}

// ---------------------------------------------------------------------------
// SHA hashes via Web Crypto API
// ---------------------------------------------------------------------------
async function computeHash(algorithm: string, text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Encode / Decode operations
// ---------------------------------------------------------------------------
type EncodingOp =
  | "base64-encode"
  | "base64-decode"
  | "url-encode"
  | "url-decode"
  | "hex-encode"
  | "hex-decode"
  | "html-encode"
  | "html-decode"
  | "unicode-escape"
  | "unicode-unescape";

function runEncode(op: EncodingOp, input: string): string {
  try {
    switch (op) {
      case "base64-encode":
        return btoa(
          new TextEncoder()
            .encode(input)
            .reduce((s, b) => s + String.fromCharCode(b), "")
        );
      case "base64-decode":
        return new TextDecoder().decode(
          Uint8Array.from(atob(input), (c) => c.charCodeAt(0))
        );
      case "url-encode":
        return encodeURIComponent(input);
      case "url-decode":
        return decodeURIComponent(input);
      case "hex-encode":
        return Array.from(new TextEncoder().encode(input))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      case "hex-decode": {
        const clean = input.replace(/\s+/g, "");
        const bytes = [];
        for (let i = 0; i < clean.length; i += 2) {
          bytes.push(parseInt(clean.substring(i, i + 2), 16));
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
      }
      case "html-encode":
        return input
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      case "html-decode": {
        const doc = new DOMParser().parseFromString(input, "text/html");
        return doc.documentElement.textContent || "";
      }
      case "unicode-escape":
        return Array.from(input)
          .map((ch) => {
            const code = ch.codePointAt(0)!;
            if (code > 0xffff) return `\\u{${code.toString(16)}}`;
            return `\\u${code.toString(16).padStart(4, "0")}`;
          })
          .join("");
      case "unicode-unescape":
        return input.replace(
          /\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
          (_, p1, p2) => String.fromCodePoint(parseInt(p1 || p2, 16))
        );
      default:
        return input;
    }
  } catch (e: unknown) {
    return `Error: ${e instanceof Error ? e.message : "Invalid input"}`;
  }
}

// ---------------------------------------------------------------------------
// Hash identifier logic
// ---------------------------------------------------------------------------
interface HashMatch {
  algorithm: string;
  confidence: "High" | "Medium" | "Low";
  description: string;
}

function identifyHash(input: string): HashMatch[] {
  const trimmed = input.trim();
  const matches: HashMatch[] = [];

  // Prefix-based detection (high confidence)
  if (/^\$2[aby]?\$\d{2}\$.{53}$/.test(trimmed)) {
    matches.push({
      algorithm: "bcrypt",
      confidence: "High",
      description:
        "Blowfish-based adaptive hash. Common in web applications for password storage. Cost factor determines iteration count.",
    });
  }
  if (/^\$argon2(i|d|id)\$/.test(trimmed)) {
    matches.push({
      algorithm: "Argon2",
      confidence: "High",
      description:
        "Memory-hard password hashing function. Winner of the Password Hashing Competition (2015). Considered state-of-the-art.",
    });
  }
  if (/^\$6\$/.test(trimmed)) {
    matches.push({
      algorithm: "SHA-512-crypt",
      confidence: "High",
      description:
        "SHA-512 based Unix crypt hash. Used in /etc/shadow on modern Linux systems. Includes salt and configurable rounds.",
    });
  }
  if (/^\$5\$/.test(trimmed)) {
    matches.push({
      algorithm: "SHA-256-crypt",
      confidence: "High",
      description:
        "SHA-256 based Unix crypt hash. Used in /etc/shadow. Similar to SHA-512-crypt but with shorter output.",
    });
  }
  if (/^\$1\$/.test(trimmed)) {
    matches.push({
      algorithm: "MD5-crypt",
      confidence: "High",
      description:
        "MD5-based Unix crypt hash. Legacy format from /etc/shadow. Considered insecure \u2014 upgrade to bcrypt or argon2.",
    });
  }
  if (/^\$apr1\$/.test(trimmed)) {
    matches.push({
      algorithm: "Apache APR1 (MD5)",
      confidence: "High",
      description:
        "Apache variant of MD5-crypt. Used in .htpasswd files. Similar weaknesses to standard MD5-crypt.",
    });
  }
  if (/^[0-9a-f]{32}:[0-9a-f]+$/i.test(trimmed)) {
    matches.push({
      algorithm: "MD5 (salted)",
      confidence: "Medium",
      description:
        "MD5 hash with appended salt separated by colon. Common in older web application databases.",
    });
  }

  // Length-based detection for raw hex hashes
  const hexOnly = /^[0-9a-fA-F]+$/.test(trimmed);
  if (hexOnly) {
    switch (trimmed.length) {
      case 32:
        matches.push({
          algorithm: "MD5",
          confidence: "High",
          description:
            "128-bit hash producing a 32 character hex digest. Fast but cryptographically broken \u2014 vulnerable to collisions. Do not use for security.",
        });
        matches.push({
          algorithm: "NTLM",
          confidence: "Low",
          description:
            "Windows NT LAN Manager hash. Also 32 hex characters. Used in Windows authentication. Weak and easily cracked.",
        });
        break;
      case 40:
        matches.push({
          algorithm: "SHA-1",
          confidence: "High",
          description:
            "160-bit hash producing a 40 character hex digest. Deprecated for security use due to practical collision attacks (SHAttered, 2017).",
        });
        matches.push({
          algorithm: "RIPEMD-160",
          confidence: "Low",
          description:
            "160-bit hash from the RIPEMD family. Used in Bitcoin address generation. Less common than SHA-1.",
        });
        break;
      case 64:
        matches.push({
          algorithm: "SHA-256",
          confidence: "High",
          description:
            "256-bit hash from the SHA-2 family. 64 character hex digest. Widely used and considered secure. Used in Bitcoin mining and TLS.",
        });
        break;
      case 96:
        matches.push({
          algorithm: "SHA-384",
          confidence: "High",
          description:
            "384-bit truncated SHA-512 variant. 96 character hex digest. Used in TLS and digital signatures.",
        });
        break;
      case 128:
        matches.push({
          algorithm: "SHA-512",
          confidence: "High",
          description:
            "512-bit hash from the SHA-2 family. 128 character hex digest. Strongest SHA-2 variant. Used in secure applications and cryptographic protocols.",
        });
        break;
    }
  }

  if (matches.length === 0 && trimmed.length > 0) {
    matches.push({
      algorithm: "Unknown",
      confidence: "Low",
      description:
        "Could not identify the hash algorithm. Verify the hash is complete and correctly formatted.",
    });
  }

  return matches;
}

// ---------------------------------------------------------------------------
// Guess encoding
// ---------------------------------------------------------------------------
function guessDecoding(input: string): { algo: string; label: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Base64: valid chars and decodes to mostly printable ASCII
  if (/^[A-Za-z0-9+/=\n\r]+$/.test(trimmed) && trimmed.length >= 4) {
    const stripped = trimmed.replace(/\s/g, '');
    try {
      const decoded = atob(stripped);
      const printable = decoded.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).length;
      if (printable / decoded.length > 0.8) {
        return { algo: 'base64', label: 'Detected Base64' };
      }
    } catch { /* not base64 */ }
  }

  // URL encoded: has %XX patterns
  if (/%[0-9A-Fa-f]{2}/.test(trimmed)) {
    return { algo: 'url', label: 'Detected URL encoding' };
  }

  // HTML entities: has &...; patterns
  if (/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/.test(trimmed)) {
    return { algo: 'html', label: 'Detected HTML entities' };
  }

  // Unicode escapes: has \uXXXX patterns
  if (/\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}/.test(trimmed)) {
    return { algo: 'unicode', label: 'Detected Unicode escapes' };
  }

  // Hex string: even-length hex that decodes to printable text
  if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length >= 4 && trimmed.length % 2 === 0) {
    try {
      const bytes = [];
      for (let i = 0; i < trimmed.length; i += 2) {
        bytes.push(parseInt(trimmed.substring(i, i + 2), 16));
      }
      const decoded = new TextDecoder().decode(new Uint8Array(bytes));
      const printable = decoded.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).length;
      if (printable / decoded.length > 0.8) {
        return { algo: 'hex', label: 'Detected hex encoding' };
      }
    } catch { /* not hex */ }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#0a0a0a",
  surface: "#141418",
  surfaceHover: "#1a1a20",
  border: "#2a2a35",
  purple: "#bb9af7",
  cyan: "#7dcfff",
  red: "#f7768e",
  green: "#9ece6a",
  amber: "#e0af68",
  textPrimary: "#e0e0e0",
  textSecondary: "#888899",
};

const confidenceColor: Record<string, string> = {
  High: COLORS.green,
  Medium: COLORS.amber,
  Low: COLORS.red,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EncodePage() {
  // -- Encode/Decode state --
  const [encInput, setEncInput] = useState("");
  const [encOutput, setEncOutput] = useState("");
  const [encAlgo, setEncAlgo] = useState("base64");
  const [encDir, setEncDir] = useState<"encode" | "decode">("encode");
  const [guessMsg, setGuessMsg] = useState<string | null>(null);

  // Derive the combined op from algo + direction
  const encOp: EncodingOp = (() => {
    const map: Record<string, { encode: EncodingOp; decode: EncodingOp }> = {
      base64: { encode: "base64-encode", decode: "base64-decode" },
      url: { encode: "url-encode", decode: "url-decode" },
      hex: { encode: "hex-encode", decode: "hex-decode" },
      html: { encode: "html-encode", decode: "html-decode" },
      unicode: { encode: "unicode-escape", decode: "unicode-unescape" },
    };
    return map[encAlgo]?.[encDir] || "base64-encode";
  })();

  // -- Hash state --
  const [hashInput, setHashInput] = useState("");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  // -- Identifier state --
  const [identInput, setIdentInput] = useState("");
  const [identResults, setIdentResults] = useState<HashMatch[]>([]);

  // -- Active tab --
  const [activeTab, setActiveTab] = useState<string | null>("encode");

  // Encode/Decode: recompute on input or operation change
  useEffect(() => {
    if (!encInput) {
      setEncOutput("");
      return;
    }
    setEncOutput(runEncode(encOp, encInput));
  }, [encInput, encOp]);

  // Hash: recompute all hashes
  useEffect(() => {
    if (!hashInput) {
      setHashes({});
      return;
    }
    let cancelled = false;
    (async () => {
      const results: Record<string, string> = {};
      results["MD5"] = md5(hashInput);
      const [sha1, sha256, sha512] = await Promise.all([
        computeHash("SHA-1", hashInput),
        computeHash("SHA-256", hashInput),
        computeHash("SHA-512", hashInput),
      ]);
      if (cancelled) return;
      results["SHA-1"] = sha1;
      results["SHA-256"] = sha256;
      results["SHA-512"] = sha512;
      setHashes(results);
    })();
    return () => {
      cancelled = true;
    };
  }, [hashInput]);

  // Identifier: detect on change
  useEffect(() => {
    if (!identInput.trim()) {
      setIdentResults([]);
      return;
    }
    setIdentResults(identifyHash(identInput));
  }, [identInput]);

  const swapEncode = useCallback(() => {
    setEncInput(encOutput);
  }, [encOutput]);

  const algoOptions = [
    { value: "base64", label: "Base64" },
    { value: "url", label: "URL" },
    { value: "hex", label: "Hex" },
    { value: "html", label: "HTML Entities" },
    { value: "unicode", label: "Unicode" },
  ];

  return (
    <MantineProvider forceColorScheme="dark">
      <Box
        style={{
          minHeight: "100vh",
          backgroundColor: COLORS.bg,
          padding: "1.5rem",
        }}
      >
        <Box style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Back link */}
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: COLORS.purple,
              textDecoration: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          >
            <IconArrowLeft size={16} />
            Back to home
          </a>

          {/* Header */}
          <Text
            size="xl"
            fw={700}
            mb={4}
            style={{ color: COLORS.textPrimary, fontSize: 28 }}
          >
            Encoding &amp; Hashing Multitool
          </Text>
          <Text size="sm" mb="lg" style={{ color: COLORS.textSecondary }}>
            Encode, decode, and hash text entirely in your browser. Nothing
            leaves the page.
          </Text>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List
              style={{
                borderBottom: `1px solid ${COLORS.border}`,
                marginBottom: 20,
              }}
            >
              <Tabs.Tab
                value="encode"
                leftSection={<IconCode size={16} />}
                style={{
                  color:
                    activeTab === "encode"
                      ? COLORS.purple
                      : COLORS.textSecondary,
                }}
              >
                Encode / Decode
              </Tabs.Tab>
              <Tabs.Tab
                value="hash"
                leftSection={<IconHash size={16} />}
                style={{
                  color:
                    activeTab === "hash" ? COLORS.cyan : COLORS.textSecondary,
                }}
              >
                Hash Generator
              </Tabs.Tab>
              <Tabs.Tab
                value="identify"
                leftSection={<IconSearch size={16} />}
                style={{
                  color:
                    activeTab === "identify"
                      ? COLORS.amber
                      : COLORS.textSecondary,
                }}
              >
                Hash Identifier
              </Tabs.Tab>
            </Tabs.List>

            {/* ===================== TAB 1: Encode/Decode ===================== */}
            <Tabs.Panel value="encode">
              <Stack gap="md">
                {/* Direction toggle + Algorithm selector */}
                <Group gap="sm" align="flex-end">
                  <Box>
                    <Text size="xs" mb={4} style={{ color: COLORS.textSecondary }}>Direction</Text>
                    <Group gap={0}>
                      <Button
                        size="sm"
                        variant={encDir === "encode" ? "filled" : "subtle"}
                        color="violet"
                        onClick={() => { setEncDir("encode"); setGuessMsg(null); }}
                        style={{ borderRadius: "6px 0 0 6px" }}
                      >
                        Encode
                      </Button>
                      <Button
                        size="sm"
                        variant={encDir === "decode" ? "filled" : "subtle"}
                        color="violet"
                        onClick={() => { setEncDir("decode"); setGuessMsg(null); }}
                        style={{ borderRadius: "0 6px 6px 0" }}
                      >
                        Decode
                      </Button>
                    </Group>
                  </Box>
                  <Select
                    label="Algorithm"
                    data={algoOptions}
                    value={encAlgo}
                    onChange={(v) => { v && setEncAlgo(v); setGuessMsg(null); }}
                    allowDeselect={false}
                    style={{ flex: 1 }}
                    styles={{
                      label: { color: COLORS.textSecondary, marginBottom: 4 },
                      input: {
                        backgroundColor: COLORS.surface,
                        borderColor: COLORS.border,
                        color: COLORS.textPrimary,
                      },
                    }}
                  />
                  {encDir === "decode" && (
                    <Tooltip label="Auto-detect encoding from input" withArrow>
                      <Button
                        variant="light"
                        color="violet"
                        size="sm"
                        leftSection={<IconSearch size={14} />}
                        onClick={() => {
                          const guess = guessDecoding(encInput);
                          if (guess) {
                            setEncAlgo(guess.algo);
                            setGuessMsg(guess.label);
                          } else {
                            setGuessMsg(encInput.trim() ? "Can\u2019t detect \u2014 select manually" : "Enter text first");
                          }
                        }}
                      >
                        Guess
                      </Button>
                    </Tooltip>
                  )}
                </Group>
                {guessMsg && (
                  <Text size="xs" style={{ color: guessMsg.startsWith("Can") || guessMsg.startsWith("Enter") ? COLORS.amber : COLORS.green }}>
                    {guessMsg}
                  </Text>
                )}

                {/* Input */}
                <Textarea
                  label="Input"
                  placeholder="Enter text to encode or decode..."
                  autosize
                  minRows={5}
                  maxRows={14}
                  value={encInput}
                  onChange={(e) => setEncInput(e.currentTarget.value)}
                  styles={{
                    label: { color: COLORS.textSecondary, marginBottom: 4 },
                    input: {
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                      fontFamily: "monospace",
                      fontSize: 13,
                    },
                  }}
                />

                {/* Swap button */}
                <Group justify="center">
                  <Tooltip label="Move output to input (for chaining)">
                    <Button
                      variant="subtle"
                      size="xs"
                      onClick={swapEncode}
                      disabled={!encOutput || encOutput.startsWith("Error:")}
                      leftSection={<IconArrowsExchange size={16} />}
                      style={{ color: COLORS.purple }}
                    >
                      Swap
                    </Button>
                  </Tooltip>
                </Group>

                {/* Output */}
                <Textarea
                  label="Output"
                  readOnly
                  autosize
                  minRows={5}
                  maxRows={14}
                  value={encOutput}
                  styles={{
                    label: { color: COLORS.textSecondary, marginBottom: 4 },
                    input: {
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      color: encOutput.startsWith("Error:")
                        ? COLORS.red
                        : COLORS.green,
                      fontFamily: "monospace",
                      fontSize: 13,
                    },
                  }}
                />

                {encOutput && !encOutput.startsWith("Error:") && (
                  <Group justify="flex-end">
                    <CopyButton value={encOutput}>
                      {({ copied, copy }) => (
                        <Button
                          variant="light"
                          size="xs"
                          onClick={copy}
                          leftSection={
                            copied ? (
                              <IconCheck size={14} />
                            ) : (
                              <IconCopy size={14} />
                            )
                          }
                          color={copied ? "teal" : "violet"}
                        >
                          {copied ? "Copied" : "Copy output"}
                        </Button>
                      )}
                    </CopyButton>
                  </Group>
                )}
              </Stack>
            </Tabs.Panel>

            {/* ===================== TAB 2: Hash Generator ===================== */}
            <Tabs.Panel value="hash">
              <Stack gap="md">
                <Textarea
                  label="Input text"
                  placeholder="Type or paste text to hash..."
                  autosize
                  minRows={4}
                  maxRows={12}
                  value={hashInput}
                  onChange={(e) => setHashInput(e.currentTarget.value)}
                  styles={{
                    label: { color: COLORS.textSecondary, marginBottom: 4 },
                    input: {
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                      fontFamily: "monospace",
                      fontSize: 13,
                    },
                  }}
                />

                {Object.keys(hashes).length > 0 && (
                  <Stack gap="xs">
                    {["MD5", "SHA-1", "SHA-256", "SHA-512"].map((algo) => (
                      <Paper
                        key={algo}
                        p="sm"
                        style={{
                          backgroundColor: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 8,
                        }}
                      >
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <Box style={{ minWidth: 0, flex: 1 }}>
                            <Text
                              size="xs"
                              fw={600}
                              mb={2}
                              style={{ color: COLORS.cyan }}
                            >
                              {algo}
                            </Text>
                            <Text
                              size="xs"
                              style={{
                                color: COLORS.textPrimary,
                                fontFamily: "monospace",
                                wordBreak: "break-all",
                                lineHeight: 1.5,
                              }}
                            >
                              {hashes[algo] || "Computing..."}
                            </Text>
                          </Box>
                          <CopyButton value={hashes[algo] || ""}>
                            {({ copied, copy }) => (
                              <Tooltip
                                label={copied ? "Copied!" : "Copy hash"}
                              >
                                <ActionIcon
                                  variant="subtle"
                                  onClick={copy}
                                  color={copied ? "teal" : "gray"}
                                  size="sm"
                                >
                                  {copied ? (
                                    <IconCheck size={14} />
                                  ) : (
                                    <IconCopy size={14} />
                                  )}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                )}

                {!hashInput && (
                  <Text
                    size="sm"
                    ta="center"
                    py="xl"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Enter text above to generate hashes
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>

            {/* ===================== TAB 3: Hash Identifier ===================== */}
            <Tabs.Panel value="identify">
              <Stack gap="md">
                <Textarea
                  label="Paste a hash"
                  placeholder="e.g. 5d41402abc4b2a76b9719d911017c592"
                  autosize
                  minRows={3}
                  maxRows={6}
                  value={identInput}
                  onChange={(e) => setIdentInput(e.currentTarget.value)}
                  styles={{
                    label: { color: COLORS.textSecondary, marginBottom: 4 },
                    input: {
                      backgroundColor: COLORS.surface,
                      borderColor: COLORS.border,
                      color: COLORS.textPrimary,
                      fontFamily: "monospace",
                      fontSize: 13,
                    },
                  }}
                />

                {identResults.length > 0 && (
                  <Stack gap="xs">
                    {identResults.map((m, i) => (
                      <Paper
                        key={i}
                        p="md"
                        style={{
                          backgroundColor: COLORS.surface,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 8,
                        }}
                      >
                        <Group gap="sm" mb={6} align="center">
                          {m.algorithm === "Unknown" ? (
                            <IconQuestionMark
                              size={18}
                              color={COLORS.textSecondary}
                            />
                          ) : m.confidence === "High" ? (
                            <IconLock size={18} color={COLORS.green} />
                          ) : (
                            <IconAlertTriangle
                              size={18}
                              color={confidenceColor[m.confidence]}
                            />
                          )}
                          <Text fw={600} style={{ color: COLORS.textPrimary }}>
                            {m.algorithm}
                          </Text>
                          <Badge
                            size="sm"
                            variant="light"
                            style={{
                              backgroundColor: `${confidenceColor[m.confidence]}22`,
                              color: confidenceColor[m.confidence],
                              border: `1px solid ${confidenceColor[m.confidence]}44`,
                            }}
                          >
                            {m.confidence} confidence
                          </Badge>
                        </Group>
                        <Text
                          size="sm"
                          style={{
                            color: COLORS.textSecondary,
                            lineHeight: 1.5,
                          }}
                        >
                          {m.description}
                        </Text>
                      </Paper>
                    ))}
                  </Stack>
                )}

                {!identInput.trim() && (
                  <Text
                    size="sm"
                    ta="center"
                    py="xl"
                    style={{ color: COLORS.textSecondary }}
                  >
                    Paste a hash above to identify its algorithm
                  </Text>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>

          {/* Footer note */}
          <Text
            size="xs"
            ta="center"
            mt="xl"
            style={{ color: COLORS.textSecondary, opacity: 0.6 }}
          >
            All processing happens locally in your browser. No data is
            transmitted.
          </Text>
        </Box>
      </Box>
    </MantineProvider>
  );
}
