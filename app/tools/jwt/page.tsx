"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Text,
  Paper,
  Textarea,
  Badge,
  Table,
  Collapse,
  Group,
  Stack,
  Box,
  Title,
  Code,
  Divider,
  CopyButton,
  ActionIcon,
  Tooltip,
  Button,
  Tabs,
  TextInput,
  Select,
  NumberInput,
  Switch,
} from "@mantine/core";
import PageShell from "../../components/ui/PageShell";
import {
  IconShieldCheck,
  IconAlertTriangle,
  IconAlertCircle,
  IconInfoCircle,
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconCheck,
  IconKey,
  IconLock,
  IconClock,
  IconPlayerPlay,
  IconArrowRight,
  IconRefresh,
  IconWand,
  IconBug,
  IconSchool,
} from "@tabler/icons-react";

// ── Theme colors ──────────────────────────────────────────────
const PURPLE = "#bb9af7";
const CYAN = "#7dcfff";
const RED = "#f7768e";
const GREEN = "#9ece6a";
const AMBER = "#e0af68";
const BG = "#0a0a0a";
const SURFACE = "#141414";
const SURFACE2 = "#1a1a2e";
const BORDER = "#222240";
const DIM = "#565f89";

// ── Base64url encode/decode ───────────────────────────────────
function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";
  return atob(base64);
}

function base64urlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ── Known claim labels ────────────────────────────────────────
const CLAIM_LABELS: Record<string, string> = {
  iss: "Issuer",
  sub: "Subject",
  aud: "Audience",
  exp: "Expires At",
  nbf: "Not Before",
  iat: "Issued At",
  jti: "JWT ID",
  name: "Name",
  email: "Email",
  role: "Role",
  roles: "Roles",
  scope: "Scope",
  azp: "Authorized Party",
  nonce: "Nonce",
  at_hash: "Access Token Hash",
  c_hash: "Code Hash",
  auth_time: "Authentication Time",
  typ: "Type",
  sid: "Session ID",
  admin: "Admin",
};

const TIME_CLAIMS = new Set(["exp", "nbf", "iat", "auth_time"]);

type Severity = "critical" | "warning" | "info" | "ok";

interface Finding {
  severity: Severity;
  title: string;
  detail: string;
}

interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
  rawParts: [string, string, string];
}

// ── Decode JWT ────────────────────────────────────────────────
function decodeJwt(token: string): DecodedJwt | null {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(base64urlDecode(parts[0]));
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { header, payload, signature: parts[2], rawParts: [parts[0], parts[1], parts[2]] };
  } catch {
    return null;
  }
}

// ── Build a fake JWT (no real signing) ────────────────────────
function buildFakeJwt(header: object, payload: object, fakeSig = "fake-signature"): string {
  return `${base64urlEncode(JSON.stringify(header))}.${base64urlEncode(JSON.stringify(payload))}.${fakeSig}`;
}

// ── Security analysis ─────────────────────────────────────────
function analyzeJwt(decoded: DecodedJwt): Finding[] {
  const findings: Finding[] = [];
  const { header, payload } = decoded;
  const alg = String(header.alg ?? "").toLowerCase();
  const now = Math.floor(Date.now() / 1000);

  if (alg === "none" || alg === "") {
    findings.push({ severity: "critical", title: 'Algorithm "none" Detected', detail: 'This token uses the "none" algorithm — no signature verification. Anyone can forge this token.' });
  }
  if (alg === "hs256") {
    findings.push({ severity: "warning", title: "HS256 — Weak Key Risk", detail: "HS256 relies on a shared secret. If the key is short or leaked, tokens can be forged. Use at least 256 bits of randomness." });
  }
  if (alg === "rs256" || alg === "rs384" || alg === "rs512") {
    findings.push({ severity: "warning", title: "Algorithm Confusion Risk (RSA)", detail: "If the server doesn't enforce the expected algorithm, an attacker could re-sign with HS256 using the public key as the HMAC secret." });
  }
  if (typeof payload.exp === "number") {
    if (payload.exp < now) {
      findings.push({ severity: "critical", title: "Token Expired", detail: `Expired ${new Date(payload.exp * 1000).toLocaleString()}.` });
    } else {
      findings.push({ severity: "ok", title: "Token Not Expired", detail: `Expires ${new Date(payload.exp * 1000).toLocaleString()}.` });
    }
  }
  if (typeof payload.nbf === "number" && payload.nbf > now) {
    findings.push({ severity: "warning", title: "Token Not Yet Valid", detail: `nbf is ${new Date(payload.nbf * 1000).toLocaleString()}, which is in the future.` });
  }
  if (typeof payload.iat === "number" && payload.iat > now + 60) {
    findings.push({ severity: "warning", title: '"iat" Is in the Future', detail: `Issued at ${new Date(payload.iat * 1000).toLocaleString()}, ahead of current time.` });
  }
  const missing = (["iss", "aud", "sub"] as const).filter((c) => !(c in payload));
  if (missing.length > 0) {
    findings.push({ severity: "info", title: `Missing Claim${missing.length > 1 ? "s" : ""}`, detail: `Absent: ${missing.map((c) => `"${c}"`).join(", ")}. Not always required but recommended.` });
  }
  if (findings.length === 0) {
    findings.push({ severity: "ok", title: "No Issues Detected", detail: "No obvious issues. Always verify signatures server-side." });
  }
  return findings;
}

function severityColor(s: Severity) {
  return s === "critical" ? RED : s === "warning" ? AMBER : s === "info" ? CYAN : GREEN;
}
function severityIcon(s: Severity) {
  const size = 16;
  return s === "critical" ? <IconAlertCircle size={size} color={RED} /> : s === "warning" ? <IconAlertTriangle size={size} color={AMBER} /> : s === "info" ? <IconInfoCircle size={size} color={CYAN} /> : <IconShieldCheck size={size} color={GREEN} />;
}
function formatClaimValue(key: string, value: unknown): string {
  if (TIME_CLAIMS.has(key) && typeof value === "number") return `${new Date(value * 1000).toLocaleString()} (${value})`;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

// ── Sample tokens for the lab ─────────────────────────────────
const SAMPLE_TOKENS = {
  valid: {
    label: "Valid HS256 Token",
    desc: "A well-formed token with standard claims",
    token: buildFakeJwt(
      { alg: "HS256", typ: "JWT" },
      { sub: "1234567890", name: "John Doe", iat: 1516239022, exp: Math.floor(Date.now() / 1000) + 3600, iss: "goonsite.org", aud: "api.goonsite.org" },
      "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    ),
  },
  expired: {
    label: "Expired Token",
    desc: "This token's exp claim is in the past",
    token: buildFakeJwt(
      { alg: "HS256", typ: "JWT" },
      { sub: "user42", name: "Alice", iat: 1700000000, exp: 1700003600, iss: "auth.example.com" },
      "expired-sig-placeholder"
    ),
  },
  none: {
    label: 'Algorithm "none"',
    desc: "No signature — critical vulnerability",
    token: buildFakeJwt(
      { alg: "none", typ: "JWT" },
      { sub: "admin", name: "Attacker", role: "admin", iat: Math.floor(Date.now() / 1000) },
      ""
    ),
  },
  rsa: {
    label: "RS256 Token",
    desc: "Asymmetric — susceptible to algorithm confusion if server is misconfigured",
    token: buildFakeJwt(
      { alg: "RS256", typ: "JWT", kid: "my-key-id" },
      { sub: "user99", name: "Bob", email: "bob@example.com", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7200, iss: "auth.corp.io", aud: "api.corp.io" },
      "rsa-signature-placeholder-would-be-much-longer-in-real-life"
    ),
  },
  missing: {
    label: "Missing Claims",
    desc: "Token without iss, aud, or sub",
    token: buildFakeJwt(
      { alg: "HS256", typ: "JWT" },
      { name: "Minimal", iat: Math.floor(Date.now() / 1000) },
      "minimal-sig"
    ),
  },
};

// ══════════════════════════════════════════════════════════════
//  WALKTHROUGH DATA
// ══════════════════════════════════════════════════════════════
const WALKTHROUGH_STEPS = [
  {
    title: "What is a JWT?",
    content: "A JSON Web Token is a compact, URL-safe way to represent claims between two parties. It's used everywhere — API authentication, SSO, session tokens. A JWT has three parts separated by dots:",
    visual: "structure" as const,
  },
  {
    title: "The Header",
    content: 'The header declares the token type and signing algorithm. It\'s just base64url-encoded JSON. Anyone can decode it — it\'s not encrypted.',
    visual: "header" as const,
  },
  {
    title: "The Payload",
    content: 'The payload contains the "claims" — statements about the user and metadata. Standard claims include sub (subject), iat (issued at), and exp (expiration). Custom claims like "role" or "admin" are common.',
    visual: "payload" as const,
  },
  {
    title: "The Signature",
    content: "The signature ensures the token hasn't been tampered with. The server signs header + payload with a secret key. If you change any byte of the header or payload, the signature won't match and the server will reject it.",
    visual: "signature" as const,
  },
  {
    title: 'The "none" Attack',
    content: 'What if you change the algorithm to "none" and strip the signature? Some misconfigured servers will skip verification entirely. Try it below — toggle the algorithm and watch the token change.',
    visual: "none-attack" as const,
  },
  {
    title: "Algorithm Confusion",
    content: "RS256 uses a public/private key pair. The server verifies with the public key. But if you switch alg to HS256, the server might use that same public key as an HMAC secret — and since the public key is... public, an attacker can forge any token.",
    visual: "alg-confusion" as const,
  },
  {
    title: "Expiration Bypass",
    content: "JWTs are often trusted blindly once the signature checks out. But what if the server doesn't check exp? An attacker with a leaked expired token could use it forever. Always validate expiration server-side.",
    visual: "exp-bypass" as const,
  },
  {
    title: "You're Ready",
    content: "You now understand JWT structure, common attacks, and why server-side validation matters. Head to the Debugger tab to analyze real tokens, or use the Builder to craft your own.",
    visual: "done" as const,
  },
];

// ══════════════════════════════════════════════════════════════
//  Page component
// ══════════════════════════════════════════════════════════════
export default function JwtDebuggerPage() {
  const [activeTab, setActiveTab] = useState<string | null>("learn");

  return (
    <PageShell maxWidth="lg">
      <Box style={{ maxWidth: 960, margin: "0 auto" }}>
        <Group gap="sm" mt="lg" mb={4}>
          <IconKey size={28} color={PURPLE} />
          <Title order={1} style={{ color: "#e0e0e0", fontSize: "1.75rem", fontWeight: 700 }}>JWT Debugger & Security Analyzer</Title>
        </Group>
        <Text size="sm" c="dimmed" mb="lg">
          Learn how JWTs work, explore common attacks hands-on, decode tokens, or build your own. Everything runs in your browser.
        </Text>

        <Tabs value={activeTab} onChange={setActiveTab} styles={{
          root: { borderColor: BORDER },
          tab: { color: DIM, fontWeight: 600, fontSize: 14, "&[data-active]": { color: PURPLE, borderColor: PURPLE } },
          panel: { paddingTop: 16 },
        }}>
          <Tabs.List>
            <Tabs.Tab value="learn" leftSection={<IconSchool size={16} />}>Learn</Tabs.Tab>
            <Tabs.Tab value="debug" leftSection={<IconBug size={16} />}>Debugger</Tabs.Tab>
            <Tabs.Tab value="build" leftSection={<IconWand size={16} />}>Builder</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="learn"><WalkthroughTab onGoToDebugger={() => setActiveTab("debug")} /></Tabs.Panel>
          <Tabs.Panel value="debug"><DebuggerTab /></Tabs.Panel>
          <Tabs.Panel value="build"><BuilderTab /></Tabs.Panel>
        </Tabs>
      </Box>
    </PageShell>
  );
}

// ══════════════════════════════════════════════════════════════
//  LEARN TAB — Interactive Walkthrough
// ══════════════════════════════════════════════════════════════
function WalkthroughTab({ onGoToDebugger }: { onGoToDebugger: () => void }) {
  const [step, setStep] = useState(0);
  const [noneAttackOn, setNoneAttackOn] = useState(false);
  const [confusionStep, setConfusionStep] = useState(0);
  const [expBypassOn, setExpBypassOn] = useState(false);
  const [structureHover, setStructureHover] = useState(-1);

  const current = WALKTHROUGH_STEPS[step];
  const isLast = step === WALKTHROUGH_STEPS.length - 1;

  const demoHeader = noneAttackOn ? { alg: "none", typ: "JWT" } : { alg: "HS256", typ: "JWT" };
  const demoPayload = { sub: "1234567890", name: "John Doe", admin: false, iat: 1516239022, exp: Math.floor(Date.now() / 1000) + 3600 };
  const demoParts = [
    base64urlEncode(JSON.stringify(demoHeader)),
    base64urlEncode(JSON.stringify(demoPayload)),
    noneAttackOn ? "" : "SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
  ];

  // Algorithm confusion demo states
  const confusionHeaders = [
    { alg: "RS256", typ: "JWT" },
    { alg: "RS256", typ: "JWT" },
    { alg: "HS256", typ: "JWT" },
    { alg: "HS256", typ: "JWT" },
  ];
  const confusionPayload = { sub: "attacker", role: "admin", iat: Math.floor(Date.now() / 1000) };
  const confusionDescriptions = [
    "Server issues RS256 token. It signs with a private key and verifies with the public key.",
    "Attacker intercepts the token and grabs the server's public key (it's public!).",
    'Attacker changes "alg" from RS256 to HS256 in the header.',
    "Attacker signs the modified token with the public key as the HMAC secret. Server accepts it.",
  ];
  const confusionSigs = [
    "rsa-valid-signature-from-server",
    "rsa-valid-signature-from-server",
    "rsa-valid-signature-from-server",
    "hmac-signed-with-public-key",
  ];

  // Exp bypass demo
  const expPayload = expBypassOn
    ? { sub: "hacker", name: "Eve", admin: true, iat: 1600000000, exp: 1600003600 }
    : { sub: "user", name: "Alice", admin: false, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 };

  const highlightPart = current.visual === "header" ? 0 : current.visual === "payload" ? 1 : current.visual === "signature" ? 2 : -1;

  return (
    <Stack gap="lg">
      {/* Progress bar */}
      <Group gap={4}>
        {WALKTHROUGH_STEPS.map((_, i) => (
          <Box
            key={i}
            onClick={() => setStep(i)}
            style={{
              flex: 1, height: 4, borderRadius: 2, cursor: "pointer",
              backgroundColor: i <= step ? PURPLE : BORDER,
              transition: "background-color 0.2s",
            }}
          />
        ))}
      </Group>

      {/* Step counter */}
      <Group justify="space-between">
        <Badge variant="light" color="violet" size="sm">Step {step + 1} of {WALKTHROUGH_STEPS.length}</Badge>
        <Group gap="xs">
          <Button size="xs" variant="subtle" color="gray" disabled={step === 0} onClick={() => { setStep(s => s - 1); setNoneAttackOn(false); setConfusionStep(0); setExpBypassOn(false); }}>
            Back
          </Button>
          {isLast ? (
            <Button size="xs" variant="light" color="violet" onClick={onGoToDebugger} rightSection={<IconArrowRight size={14} />}>
              Open Debugger
            </Button>
          ) : (
            <Button size="xs" variant="light" color="violet" onClick={() => { setStep(s => s + 1); setNoneAttackOn(false); setConfusionStep(0); setExpBypassOn(false); }} rightSection={<IconArrowRight size={14} />}>
              Next
            </Button>
          )}
        </Group>
      </Group>

      {/* Title & description */}
      <div>
        <Title order={2} style={{ color: "#e0e0e0", fontSize: "1.4rem", marginBottom: 8 }}>{current.title}</Title>
        <Text size="sm" style={{ color: "#a9b1d6", lineHeight: 1.7 }}>{current.content}</Text>
      </div>

      {/* Visual area */}
      {current.visual === "structure" && (
        <Paper p="lg" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <TokenVisual parts={demoParts} highlightPart={structureHover} labels />
          <Divider my="md" color={BORDER} />
          <Group gap="md" justify="center">
            {[{ label: "Header", color: PURPLE, desc: "Algorithm & type", idx: 0 }, { label: "Payload", color: CYAN, desc: "Claims & data", idx: 1 }, { label: "Signature", color: AMBER, desc: "Integrity check", idx: 2 }].map((p) => (
              <div
                key={p.label}
                style={{
                  textAlign: "center",
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${structureHover === p.idx ? p.color : "transparent"}`,
                  backgroundColor: structureHover === p.idx ? `${p.color}15` : "transparent",
                  transition: "all 0.15s",
                }}
                onMouseEnter={() => setStructureHover(p.idx)}
                onMouseLeave={() => setStructureHover(-1)}
                onClick={() => setStructureHover(structureHover === p.idx ? -1 : p.idx)}
              >
                <div style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: p.color, margin: "0 auto 6px" }} />
                <Text size="sm" fw={600} style={{ color: p.color }}>{p.label}</Text>
                <Text size="xs" c="dimmed">{p.desc}</Text>
              </div>
            ))}
          </Group>
          {structureHover >= 0 && (
            <>
              <Divider my="sm" color={BORDER} />
              <Text size="xs" fw={600} mb={4} style={{ color: structureHover === 0 ? PURPLE : structureHover === 1 ? CYAN : AMBER }}>
                {structureHover === 0 ? "Decoded Header:" : structureHover === 1 ? "Decoded Payload:" : "Raw Signature (base64url):"}
              </Text>
              <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.5rem", borderRadius: 6, fontSize: 12, color: structureHover === 0 ? PURPLE : structureHover === 1 ? CYAN : AMBER }}>
                {structureHover === 2 ? demoParts[2] : JSON.stringify(structureHover === 0 ? demoHeader : demoPayload, null, 2)}
              </Code>
            </>
          )}
        </Paper>
      )}

      {(current.visual === "header" || current.visual === "payload" || current.visual === "signature") && (
        <Paper p="lg" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <TokenVisual parts={demoParts} highlightPart={highlightPart} />
          <Divider my="md" color={BORDER} />
          <Text size="xs" fw={600} mb={4} style={{ color: highlightPart === 0 ? PURPLE : highlightPart === 1 ? CYAN : AMBER }}>
            {highlightPart === 0 ? "Decoded Header:" : highlightPart === 1 ? "Decoded Payload:" : "Raw Signature (base64url):"}
          </Text>
          <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.75rem", borderRadius: 8, fontSize: 13, color: highlightPart === 0 ? PURPLE : highlightPart === 1 ? CYAN : AMBER }}>
            {highlightPart === 2 ? demoParts[2] : JSON.stringify(highlightPart === 0 ? demoHeader : demoPayload, null, 2)}
          </Code>
        </Paper>
      )}

      {current.visual === "none-attack" && (
        <Paper p="lg" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <Group gap="md" mb="md" align="center">
            <Switch
              label={noneAttackOn ? 'alg: "none" — VULNERABLE' : 'alg: "HS256" — normal'}
              checked={noneAttackOn}
              onChange={() => setNoneAttackOn(v => !v)}
              color={noneAttackOn ? "red" : "green"}
              size="md"
            />
          </Group>
          <TokenVisual parts={demoParts} highlightPart={0} />
          <Divider my="md" color={BORDER} />
          <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.75rem", borderRadius: 8, fontSize: 13, color: PURPLE }}>
            {JSON.stringify(demoHeader, null, 2)}
          </Code>
          {noneAttackOn && (
            <Paper p="sm" mt="md" radius="md" style={{ backgroundColor: `${RED}15`, border: `1px solid ${RED}40`, borderLeft: `3px solid ${RED}` }}>
              <Group gap="xs">
                <IconAlertCircle size={16} color={RED} />
                <Text size="sm" fw={600} style={{ color: RED }}>No signature!</Text>
              </Group>
              <Text size="xs" mt={4} style={{ color: "#c0caf5" }}>
                The token has an empty signature. A server that trusts the &quot;alg&quot; header will skip verification — meaning anyone can forge any payload they want.
              </Text>
            </Paper>
          )}
          {!noneAttackOn && (
            <Text size="xs" mt="md" c="dimmed">
              Toggle the switch to see what happens when an attacker changes the algorithm to &quot;none&quot;.
            </Text>
          )}
        </Paper>
      )}

      {current.visual === "alg-confusion" && (
        <Paper p="lg" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <Group gap="xs" mb="md">
            {[0, 1, 2, 3].map((i) => (
              <Button
                key={i}
                size="xs"
                variant={confusionStep === i ? "filled" : "subtle"}
                color={i >= 2 ? "red" : "violet"}
                onClick={() => setConfusionStep(i)}
              >
                Step {i + 1}
              </Button>
            ))}
          </Group>

          <Text size="sm" mb="md" style={{ color: confusionStep >= 2 ? RED : "#c0caf5", fontWeight: 500 }}>
            {confusionDescriptions[confusionStep]}
          </Text>

          <TokenVisual
            parts={[
              base64urlEncode(JSON.stringify(confusionHeaders[confusionStep])),
              base64urlEncode(JSON.stringify(confusionPayload)),
              confusionSigs[confusionStep],
            ]}
            highlightPart={confusionStep >= 2 ? 0 : -1}
          />

          <Divider my="md" color={BORDER} />

          <Group gap="xl">
            <div>
              <Text size="xs" fw={600} mb={4} style={{ color: PURPLE }}>Header:</Text>
              <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.5rem", borderRadius: 6, fontSize: 12, color: confusionStep >= 2 ? RED : PURPLE }}>
                {JSON.stringify(confusionHeaders[confusionStep], null, 2)}
              </Code>
            </div>
            <div>
              <Text size="xs" fw={600} mb={4} style={{ color: AMBER }}>Signed with:</Text>
              <Badge size="lg" variant="light" color={confusionStep >= 3 ? "red" : "green"} styles={{ root: { fontFamily: "monospace" } }}>
                {confusionStep >= 3 ? "PUBLIC KEY (as HMAC secret)" : confusionStep >= 2 ? "???" : "PRIVATE KEY (RSA)"}
              </Badge>
            </div>
          </Group>

          {confusionStep === 3 && (
            <Paper p="sm" mt="md" radius="md" style={{ backgroundColor: `${RED}15`, border: `1px solid ${RED}40`, borderLeft: `3px solid ${RED}` }}>
              <Group gap="xs">
                <IconAlertCircle size={16} color={RED} />
                <Text size="sm" fw={600} style={{ color: RED }}>Token accepted!</Text>
              </Group>
              <Text size="xs" mt={4} style={{ color: "#c0caf5" }}>
                The server reads alg=HS256, uses the &quot;key&quot; (which is the RSA public key) for HMAC verification, and it matches. The attacker now has admin access.
              </Text>
            </Paper>
          )}
        </Paper>
      )}

      {current.visual === "exp-bypass" && (
        <Paper p="lg" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <Group gap="md" mb="md" align="center">
            <Switch
              label={expBypassOn ? "Using leaked expired token" : "Using valid fresh token"}
              checked={expBypassOn}
              onChange={() => setExpBypassOn(v => !v)}
              color={expBypassOn ? "red" : "green"}
              size="md"
            />
          </Group>

          <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.75rem", borderRadius: 8, fontSize: 13, color: CYAN }}>
            {JSON.stringify(expPayload, null, 2)}
          </Code>

          {expBypassOn && (
            <>
              <Paper p="sm" mt="md" radius="md" style={{ backgroundColor: `${RED}15`, border: `1px solid ${RED}40`, borderLeft: `3px solid ${RED}` }}>
                <Group gap="xs">
                  <IconClock size={16} color={RED} />
                  <Text size="sm" fw={600} style={{ color: RED }}>Expired {new Date(1600003600 * 1000).toLocaleDateString()}!</Text>
                </Group>
                <Text size="xs" mt={4} style={{ color: "#c0caf5" }}>
                  This token expired years ago, but if the server only validates the signature and not the <Code style={{ backgroundColor: SURFACE2, color: AMBER, padding: "1px 4px" }}>exp</Code> claim, it will still be accepted. The attacker also escalated to admin: true.
                </Text>
              </Paper>
              <Group gap="xs" mt="sm">
                <Text size="xs" fw={600} style={{ color: GREEN }}>Fix:</Text>
                <Text size="xs" style={{ color: "#c0caf5" }}>Always check <Code style={{ backgroundColor: SURFACE2, color: AMBER, padding: "1px 4px" }}>exp</Code> server-side. Reject tokens where <Code style={{ backgroundColor: SURFACE2, color: AMBER, padding: "1px 4px" }}>exp &lt; now()</Code>.</Text>
              </Group>
            </>
          )}
          {!expBypassOn && (
            <Text size="xs" mt="md" c="dimmed">Toggle the switch to simulate using a leaked, expired token with escalated privileges.</Text>
          )}
        </Paper>
      )}

      {current.visual === "done" && (
        <Paper p="xl" radius="md" ta="center" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <IconShieldCheck size={48} color={GREEN} style={{ marginBottom: 12 }} />
          <Text size="lg" fw={700} style={{ color: GREEN }} mb="xs">Walkthrough Complete</Text>
          <Text size="sm" c="dimmed" mb="lg">You understand JWT structure, the none algorithm attack, algorithm confusion, and expiration bypass.</Text>
          <Group justify="center" gap="md">
            <Button variant="light" color="violet" onClick={onGoToDebugger} leftSection={<IconBug size={16} />}>Analyze a Token</Button>
            <Button variant="subtle" color="gray" onClick={() => { setStep(0); setNoneAttackOn(false); setConfusionStep(0); setExpBypassOn(false); }} leftSection={<IconRefresh size={16} />}>Restart</Button>
          </Group>
        </Paper>
      )}
    </Stack>
  );
}

// ── Token visual (color-coded parts) ──────────────────────────
function TokenVisual({ parts, highlightPart, labels }: { parts: string[]; highlightPart: number; labels?: boolean }) {
  const colors = [PURPLE, CYAN, AMBER];
  const names = ["header", "payload", "signature"];

  return (
    <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.75rem", borderRadius: 8, wordBreak: "break-all", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 13 }}>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span style={{ color: DIM }}>.</span>}
          <span style={{
            color: colors[i],
            opacity: highlightPart >= 0 && highlightPart !== i ? 0.25 : 1,
            transition: "opacity 0.3s",
            textDecoration: highlightPart === i ? "underline" : "none",
            textDecorationColor: colors[i],
            textUnderlineOffset: "4px",
          }}>
            {labels && <span style={{ color: DIM, fontSize: 10, verticalAlign: "super" }}>{names[i]} </span>}
            {part || <span style={{ color: RED, fontStyle: "italic" }}>(empty)</span>}
          </span>
        </span>
      ))}
    </Code>
  );
}

// ══════════════════════════════════════════════════════════════
//  DEBUGGER TAB
// ══════════════════════════════════════════════════════════════
function DebuggerTab() {
  const [token, setToken] = useState("");
  const [explainerOpen, setExplainerOpen] = useState(false);
  const [noneExplainerOpen, setNoneExplainerOpen] = useState(false);
  const [hoveredPart, setHoveredPart] = useState(-1);

  const decoded = useMemo(() => (token.trim() ? decodeJwt(token) : null), [token]);
  const findings = useMemo(() => (decoded ? analyzeJwt(decoded) : []), [decoded]);
  const hasAlgoConfusion = findings.some(f => f.title.includes("Algorithm Confusion"));
  const hasNoneAlg = findings.some(f => f.title.includes('"none"'));
  const alg = decoded ? String(decoded.header.alg ?? "").toLowerCase() : "";

  return (
    <Stack gap="lg">
      {/* Sample tokens */}
      <div>
        <Text size="xs" fw={600} mb={6} style={{ color: DIM, textTransform: "uppercase", letterSpacing: 0.5 }}>Load a sample token:</Text>
        <Group gap="xs" wrap="wrap">
          {Object.entries(SAMPLE_TOKENS).map(([key, sample]) => (
            <Tooltip key={key} label={sample.desc} withArrow>
              <Button size="xs" variant="subtle" color={key === "none" ? "red" : key === "rsa" ? "yellow" : key === "expired" ? "orange" : "violet"} onClick={() => setToken(sample.token)}>
                {sample.label}
              </Button>
            </Tooltip>
          ))}
        </Group>
      </div>

      {/* Token input */}
      <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
        <Group gap="xs" mb="xs">
          <IconLock size={16} color={PURPLE} />
          <Text size="sm" fw={600} style={{ color: PURPLE }}>Encoded Token</Text>
        </Group>
        <Textarea
          placeholder="Paste a JWT here or click a sample above..."
          autosize minRows={3} maxRows={8} value={token}
          onChange={(e) => setToken(e.currentTarget.value)}
          styles={{ input: { backgroundColor: BG, border: `1px solid ${BORDER}`, color: "#c0caf5", fontFamily: "monospace", fontSize: 13 } }}
        />
      </Paper>

      {decoded && (
        <>
          {/* Color-coded token with hover buttons */}
          <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <Group gap="xs" mb="xs" justify="space-between">
              <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>Color-coded Token</Text>
              <Group gap={6}>
                {[{ label: "Header", color: PURPLE, idx: 0 }, { label: "Payload", color: CYAN, idx: 1 }, { label: "Signature", color: AMBER, idx: 2 }].map(p => (
                  <Badge
                    key={p.idx}
                    size="sm"
                    variant={hoveredPart === p.idx ? "filled" : "outline"}
                    style={{
                      cursor: "pointer",
                      borderColor: p.color,
                      color: hoveredPart === p.idx ? "#0a0a0a" : p.color,
                      backgroundColor: hoveredPart === p.idx ? p.color : "transparent",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={() => setHoveredPart(p.idx)}
                    onMouseLeave={() => setHoveredPart(-1)}
                    onClick={() => setHoveredPart(hoveredPart === p.idx ? -1 : p.idx)}
                  >
                    {p.label}
                  </Badge>
                ))}
              </Group>
            </Group>
            <TokenVisual parts={[decoded.rawParts[0], decoded.rawParts[1], decoded.rawParts[2]]} highlightPart={hoveredPart} />

            {/* Show decoded content for hovered part */}
            {hoveredPart >= 0 && (
              <>
                <Divider my="sm" color={BORDER} />
                <Text size="xs" fw={600} mb={4} style={{ color: hoveredPart === 0 ? PURPLE : hoveredPart === 1 ? CYAN : AMBER }}>
                  {hoveredPart === 0 ? "Decoded Header:" : hoveredPart === 1 ? "Decoded Payload:" : "Raw Signature (base64url):"}
                </Text>
                <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.5rem", borderRadius: 6, fontSize: 12, color: hoveredPart === 0 ? PURPLE : hoveredPart === 1 ? CYAN : AMBER }}>
                  {hoveredPart === 2
                    ? (decoded.signature || "(empty — unsigned token!)")
                    : JSON.stringify(hoveredPart === 0 ? decoded.header : decoded.payload, null, 2)}
                </Code>
              </>
            )}
          </Paper>

          {/* Header & Payload decoded */}
          <DecodedSection label="Header" color={PURPLE} icon={<IconKey size={16} color={PURPLE} />} data={decoded.header} />
          <DecodedSection label="Payload" color={CYAN} icon={<IconLock size={16} color={CYAN} />} data={decoded.payload} />

          {/* Signature */}
          <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <Group gap="xs" mb="xs">
              <IconShieldCheck size={16} color={AMBER} />
              <Text size="sm" fw={600} style={{ color: AMBER }}>Signature</Text>
            </Group>
            <Code block style={{ backgroundColor: BG, color: AMBER, padding: "0.75rem", borderRadius: 8, wordBreak: "break-all", whiteSpace: "pre-wrap", fontSize: 13, border: `1px solid ${BORDER}` }}>
              {decoded.signature || <span style={{ color: RED, fontStyle: "italic" }}>(empty — unsigned token!)</span>}
            </Code>
          </Paper>

          <Divider color={BORDER} />

          {/* Security Analysis */}
          <Box>
            <Group gap="xs" mb="sm">
              <IconShieldCheck size={20} color={PURPLE} />
              <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>Security Analysis</Title>
            </Group>
            <Stack gap="sm">
              {findings.map((f, i) => (
                <Paper key={i} p="sm" radius="md" style={{ backgroundColor: SURFACE2, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${severityColor(f.severity)}` }}>
                  <Group gap="xs" mb={4}>
                    {severityIcon(f.severity)}
                    <Badge size="sm" variant="light" color={f.severity === "critical" ? "red" : f.severity === "warning" ? "yellow" : f.severity === "info" ? "cyan" : "green"} styles={{ root: { textTransform: "uppercase", fontWeight: 700 } }}>{f.severity}</Badge>
                    <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>{f.title}</Text>
                  </Group>
                  <Text size="xs" style={{ color: DIM, lineHeight: 1.55, paddingLeft: 28 }}>{f.detail}</Text>
                </Paper>
              ))}
            </Stack>
          </Box>

          <Divider color={BORDER} />

          {/* Claim Inspector */}
          <Box>
            <Group gap="xs" mb="sm">
              <IconClock size={20} color={CYAN} />
              <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>Claim Inspector</Title>
            </Group>
            <Paper radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
              <Table striped highlightOnHover styles={{ table: { backgroundColor: "transparent" }, thead: { backgroundColor: SURFACE2 }, tr: { borderColor: BORDER }, th: { color: DIM, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }, td: { fontSize: 13, borderColor: BORDER } }}>
                <Table.Thead>
                  <Table.Tr><Table.Th w={120}>Claim</Table.Th><Table.Th w={160}>Label</Table.Th><Table.Th>Value</Table.Th></Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {Object.entries(decoded.payload).map(([key, value]) => (
                    <Table.Tr key={key}>
                      <Table.Td><Code style={{ backgroundColor: SURFACE2, color: PURPLE, fontSize: 12, padding: "2px 6px" }}>{key}</Code></Table.Td>
                      <Table.Td style={{ color: DIM }}>{CLAIM_LABELS[key] ?? "—"}</Table.Td>
                      <Table.Td style={{ fontFamily: "monospace", color: TIME_CLAIMS.has(key) ? AMBER : "#c0caf5", wordBreak: "break-all" }}>
                        <Group gap="xs" wrap="nowrap" justify="space-between">
                          <span>{formatClaimValue(key, value)}</span>
                          <CopyButton value={formatClaimValue(key, value)}>
                            {({ copied, copy }) => (
                              <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
                                <ActionIcon size="xs" variant="subtle" color="gray" onClick={copy} style={{ flexShrink: 0 }}>
                                  {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </CopyButton>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Box>

          {/* "none" Algorithm Explainer — only for alg:none tokens */}
          {hasNoneAlg && (
            <>
              <Divider color={BORDER} />
              <Box>
                <Group gap="xs" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setNoneExplainerOpen(o => !o)}>
                  {noneExplainerOpen ? <IconChevronDown size={18} color={RED} /> : <IconChevronRight size={18} color={RED} />}
                  <IconAlertCircle size={20} color={RED} />
                  <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>The &quot;none&quot; Algorithm Attack</Title>
                  <Badge size="xs" variant="light" color="red">this token</Badge>
                </Group>
                <Collapse in={noneExplainerOpen}>
                  <Paper p="lg" mt="sm" radius="md" style={{ backgroundColor: SURFACE2, border: `1px solid ${BORDER}`, lineHeight: 1.7 }}>
                    <Text size="sm" mb="md" style={{ color: "#c0caf5" }}>
                      The <strong style={{ color: RED }}>algorithm &quot;none&quot;</strong> attack is one of the simplest and most dangerous JWT vulnerabilities. Here&apos;s how it works:
                    </Text>
                    <Stack gap="sm">
                      {[
                        { n: 1, t: "Server issues signed JWT", d: "The server creates a token signed with HS256 or RS256. The signature ensures nobody can tamper with the payload." },
                        { n: 2, t: "Attacker intercepts the token", d: "Through XSS, network sniffing, or just having a normal user account." },
                        { n: 3, t: 'Attacker changes "alg" to "none"', d: 'The JWT spec defines "none" as a valid algorithm for unsecured tokens. The attacker modifies the header to {"alg":"none","typ":"JWT"} and strips the signature entirely.' },
                        { n: 4, t: "Attacker modifies the payload", d: 'Now that there\'s no signature, the attacker can change any claim — e.g., set "admin": true or change "sub" to another user\'s ID.' },
                        { n: 5, t: "Vulnerable server accepts it", d: 'If the server reads the "alg" header and sees "none", it skips signature verification. The forged token is accepted as valid.' },
                      ].map(s => (
                        <Paper key={s.n} p="sm" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                          <Group gap="xs" mb={2}>
                            <Badge size="sm" circle variant="filled" color="red" styles={{ root: { minWidth: 22, height: 22, padding: 0, fontWeight: 700 } }}>{s.n}</Badge>
                            <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>{s.t}</Text>
                          </Group>
                          <Text size="xs" style={{ color: DIM, paddingLeft: 30, lineHeight: 1.55 }}>{s.d}</Text>
                        </Paper>
                      ))}
                    </Stack>
                    <Divider my="md" color={BORDER} />
                    <Text size="sm" fw={600} style={{ color: GREEN }} mb="xs">Mitigations</Text>
                    <Stack gap={4}>
                      <Text size="sm" style={{ color: "#c0caf5" }}><span style={{ color: GREEN, marginRight: 6 }}>1.</span><strong>Never accept alg: &quot;none&quot; in production.</strong> Reject any token that specifies an unsigned algorithm.</Text>
                      <Text size="sm" style={{ color: "#c0caf5" }}><span style={{ color: GREEN, marginRight: 6 }}>2.</span>Use a strict allowlist of accepted algorithms server-side — don&apos;t trust the token&apos;s header.</Text>
                      <Text size="sm" style={{ color: "#c0caf5" }}><span style={{ color: GREEN, marginRight: 6 }}>3.</span>Always require a valid signature. If verification fails, reject the token unconditionally.</Text>
                    </Stack>
                  </Paper>
                </Collapse>
              </Box>
            </>
          )}

          {/* Algorithm Confusion Explainer — only for RSA tokens */}
          {hasAlgoConfusion && (
            <>
              <Divider color={BORDER} />
              <Box>
                <Group gap="xs" style={{ cursor: "pointer", userSelect: "none" }} onClick={() => setExplainerOpen(o => !o)}>
                  {explainerOpen ? <IconChevronDown size={18} color={PURPLE} /> : <IconChevronRight size={18} color={PURPLE} />}
                  <IconAlertTriangle size={20} color={AMBER} />
                  <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>Algorithm Confusion — Explainer</Title>
                  <Badge size="xs" variant="light" color="yellow">this token</Badge>
                </Group>
                <Collapse in={explainerOpen}>
                  <Paper p="lg" mt="sm" radius="md" style={{ backgroundColor: SURFACE2, border: `1px solid ${BORDER}`, lineHeight: 1.7 }}>
                    <Text size="sm" mb="md" style={{ color: "#c0caf5" }}>
                      The <strong style={{ color: AMBER }}>RS256 → HS256</strong> attack exploits servers that trust the <Code style={{ backgroundColor: SURFACE, color: PURPLE, padding: "1px 4px" }}>alg</Code> header:
                    </Text>
                    <Stack gap="sm">
                      {[
                        { n: 1, t: "Server signs with RS256", d: "Uses RSA private key to sign, public key to verify." },
                        { n: 2, t: "Attacker gets public key", d: "From JWKS endpoint, certificate, or other public source." },
                        { n: 3, t: 'Changes alg to HS256', d: "Switches from asymmetric to symmetric verification." },
                        { n: 4, t: "Signs with public key as HMAC secret", d: "HS256 uses one key for both signing and verifying." },
                        { n: 5, t: "Server accepts the forged token", d: 'Reads alg=HS256, uses the "key" (public key) for HMAC — signature matches.' },
                      ].map(s => (
                        <Paper key={s.n} p="sm" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
                          <Group gap="xs" mb={2}>
                            <Badge size="sm" circle variant="filled" color="violet" styles={{ root: { minWidth: 22, height: 22, padding: 0, fontWeight: 700 } }}>{s.n}</Badge>
                            <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>{s.t}</Text>
                          </Group>
                          <Text size="xs" style={{ color: DIM, paddingLeft: 30 }}>{s.d}</Text>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                </Collapse>
              </Box>
            </>
          )}
        </>
      )}

      {/* Invalid / empty states */}
      {!decoded && token.trim() !== "" && (
        <Paper p="lg" radius="md" ta="center" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${RED}` }}>
          <IconAlertCircle size={24} color={RED} style={{ marginBottom: 4 }} />
          <Text size="sm" style={{ color: RED }} fw={600}>Invalid JWT Format</Text>
          <Text size="xs" c="dimmed" mt={4}>A valid JWT has three base64url-encoded parts separated by dots.</Text>
        </Paper>
      )}
      {!token.trim() && (
        <Paper p="xl" radius="md" ta="center" style={{ backgroundColor: SURFACE, border: `1px dashed ${BORDER}` }}>
          <IconKey size={32} color={DIM} style={{ marginBottom: 8 }} />
          <Text size="sm" c="dimmed">Paste a JWT token above or click a sample to get started.</Text>
        </Paper>
      )}
    </Stack>
  );
}

// ══════════════════════════════════════════════════════════════
//  BUILDER TAB
// ══════════════════════════════════════════════════════════════
// ── HMAC signing via Web Crypto ────────────────────────────────
const HMAC_ALGOS: Record<string, string> = {
  HS256: "SHA-256",
  HS384: "SHA-384",
  HS512: "SHA-512",
};

async function hmacSign(header: object, payload: object, secret: string, alg: string): Promise<string> {
  const hashAlgo = HMAC_ALGOS[alg];
  if (!hashAlgo) return "";
  const encoder = new TextEncoder();
  const headerB64 = base64urlEncode(JSON.stringify(header));
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);
  const key = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: hashAlgo }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  // base64url encode the signature
  const bytes = new Uint8Array(sig);
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function generateSecret(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join("");
}

function BuilderTab() {
  const [alg, setAlg] = useState("HS256");
  const [sub, setSub] = useState("1234567890");
  const [name, setName] = useState("John Doe");
  const [role, setRole] = useState("user");
  const [isAdmin, setIsAdmin] = useState(false);
  const [includeExp, setIncludeExp] = useState(true);
  const [expHours, setExpHours] = useState<number>(1);
  const [customKey, setCustomKey] = useState("");
  const [customVal, setCustomVal] = useState("");
  const [customClaims, setCustomClaims] = useState<[string, string][]>([]);
  const [secret, setSecret] = useState(() => generateSecret());
  const [signedToken, setSignedToken] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);

  const isHmac = alg in HMAC_ALGOS;
  const isNone = alg === "none";

  const now = Math.floor(Date.now() / 1000);
  const header = { alg, typ: "JWT" };
  const payload: Record<string, unknown> = {
    sub: sub || undefined,
    name: name || undefined,
    role: role || undefined,
    admin: isAdmin,
    iat: now,
  };
  if (includeExp) payload.exp = now + expHours * 3600;
  for (const [k, v] of customClaims) {
    if (k) {
      if (v === "true") payload[k] = true;
      else if (v === "false") payload[k] = false;
      else if (/^\d+$/.test(v)) payload[k] = parseInt(v);
      else payload[k] = v;
    }
  }
  Object.keys(payload).forEach(k => { if (payload[k] === undefined) delete payload[k]; });

  // Build unsigned token for display
  const unsignedParts = [base64urlEncode(JSON.stringify(header)), base64urlEncode(JSON.stringify(payload))];
  const displayToken = signedToken || `${unsignedParts[0]}.${unsignedParts[1]}.${isNone ? "" : "signature-requires-signing"}`;

  const decoded = decodeJwt(displayToken);
  const findings = decoded ? analyzeJwt(decoded) : [];

  // Sign whenever inputs change (for HMAC algs)
  const doSign = useCallback(async () => {
    if (isNone) {
      setSignedToken(`${unsignedParts[0]}.${unsignedParts[1]}.`);
      return;
    }
    if (!isHmac || !secret.trim()) {
      setSignedToken(null);
      return;
    }
    setSigning(true);
    try {
      const sig = await hmacSign(header, payload, secret, alg);
      setSignedToken(`${unsignedParts[0]}.${unsignedParts[1]}.${sig}`);
    } catch {
      setSignedToken(null);
    } finally {
      setSigning(false);
    }
  }, [alg, secret, sub, name, role, isAdmin, includeExp, expHours, customClaims, isHmac, isNone]);

  const addCustomClaim = () => {
    if (customKey.trim()) {
      setCustomClaims(prev => [...prev, [customKey.trim(), customVal]]);
      setCustomKey("");
      setCustomVal("");
    }
  };

  return (
    <Stack gap="lg">
      <Text size="sm" c="dimmed">
        Build a JWT interactively. For HMAC algorithms (HS256/384/512), enter a secret key to generate a real signature. Everything runs in your browser via Web Crypto.
      </Text>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Left: Controls */}
        <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
          <Text size="sm" fw={600} mb="sm" style={{ color: PURPLE }}>Header</Text>
          <Select
            label="Algorithm" size="sm" value={alg}
            onChange={(v) => setAlg(v || "HS256")}
            data={[
              { value: "HS256", label: "HS256 (HMAC + SHA-256)" },
              { value: "HS384", label: "HS384 (HMAC + SHA-384)" },
              { value: "HS512", label: "HS512 (HMAC + SHA-512)" },
              { value: "RS256", label: "RS256 (RSA + SHA-256)" },
              { value: "RS384", label: "RS384 (RSA + SHA-384)" },
              { value: "RS512", label: "RS512 (RSA + SHA-512)" },
              { value: "none", label: 'none (⚠ NO SIGNATURE)' },
            ]}
            styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }}
          />

          {/* Secret key — for HMAC algorithms */}
          {isHmac && (
            <>
              <Divider my="md" color={BORDER} />
              <Text size="sm" fw={600} mb="sm" style={{ color: AMBER }}>Secret Key</Text>
              <Group gap="xs" align="flex-end">
                <TextInput
                  size="sm"
                  placeholder="Enter signing secret..."
                  value={secret}
                  onChange={e => { setSecret(e.currentTarget.value); setSignedToken(null); }}
                  style={{ flex: 1 }}
                  styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: AMBER, fontFamily: "monospace", fontSize: 13 } }}
                />
                <Tooltip label="Generate random 32-char secret" withArrow>
                  <ActionIcon size="lg" variant="light" color="yellow" onClick={() => { setSecret(generateSecret()); setSignedToken(null); }}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Group gap="xs" mt="xs">
                <Button size="xs" variant="light" color="violet" onClick={doSign} loading={signing} leftSection={<IconKey size={14} />}>
                  Sign Token
                </Button>
                {signedToken && <Badge size="sm" variant="light" color="green">Signed</Badge>}
                {!isNone && !signedToken && <Text size="xs" c="dimmed">Click to generate a real HMAC signature</Text>}
              </Group>
            </>
          )}

          {isNone && (
            <>
              <Divider my="md" color={BORDER} />
              <Paper p="xs" radius="sm" style={{ backgroundColor: `${RED}15`, border: `1px solid ${RED}30` }}>
                <Text size="xs" style={{ color: RED }}>No signature — this token can be forged by anyone.</Text>
              </Paper>
            </>
          )}

          {!isHmac && !isNone && (
            <>
              <Divider my="md" color={BORDER} />
              <Text size="xs" c="dimmed">RSA signing requires a private key and is not supported in the browser builder. The signature will be a placeholder.</Text>
            </>
          )}

          <Divider my="md" color={BORDER} />

          <Text size="sm" fw={600} mb="sm" style={{ color: CYAN }}>Payload Claims</Text>
          <Stack gap="xs">
            <TextInput label="sub (Subject)" size="sm" value={sub} onChange={e => setSub(e.currentTarget.value)} styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }} />
            <TextInput label="name" size="sm" value={name} onChange={e => setName(e.currentTarget.value)} styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }} />
            <TextInput label="role" size="sm" value={role} onChange={e => setRole(e.currentTarget.value)} styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }} />
            <Switch label="admin" checked={isAdmin} onChange={() => setIsAdmin(v => !v)} color="violet" />
            <Group gap="xs" align="flex-end">
              <Switch label="Include exp" checked={includeExp} onChange={() => setIncludeExp(v => !v)} color="violet" />
              {includeExp && <NumberInput size="sm" label="Hours" value={expHours} onChange={v => setExpHours(Number(v) || 1)} min={0} max={8760} w={80} styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }} />}
            </Group>
          </Stack>

          <Divider my="md" color={BORDER} />

          <Text size="xs" fw={600} mb="xs" style={{ color: DIM }}>Custom Claims</Text>
          {customClaims.map(([k, v], i) => (
            <Group key={i} gap="xs" mb={4}>
              <Code style={{ backgroundColor: SURFACE2, color: PURPLE, padding: "2px 6px", fontSize: 12 }}>{k}</Code>
              <Text size="xs" style={{ color: "#c0caf5" }}>{v}</Text>
              <ActionIcon size="xs" variant="subtle" color="red" onClick={() => setCustomClaims(prev => prev.filter((_, j) => j !== i))}>
                <Text size="xs">×</Text>
              </ActionIcon>
            </Group>
          ))}
          <Group gap="xs">
            <TextInput size="xs" placeholder="key" value={customKey} onChange={e => setCustomKey(e.currentTarget.value)} w={80} styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }} />
            <TextInput size="xs" placeholder="value" value={customVal} onChange={e => setCustomVal(e.currentTarget.value)} w={100} styles={{ input: { backgroundColor: BG, borderColor: BORDER, color: "#c0caf5" } }} />
            <Button size="xs" variant="light" color="violet" onClick={addCustomClaim} disabled={!customKey.trim()}>Add</Button>
          </Group>
        </Paper>

        {/* Right: Live preview */}
        <Stack gap="md">
          <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <Group gap="xs" mb="xs" justify="space-between">
              <Group gap="xs">
                <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>Live Token</Text>
                {signedToken && isHmac && <Badge size="xs" variant="light" color="green">HMAC signed</Badge>}
              </Group>
              <CopyButton value={displayToken}>
                {({ copied, copy }) => (
                  <Button size="xs" variant="subtle" color={copied ? "green" : "gray"} onClick={copy} leftSection={copied ? <IconCheck size={12} /> : <IconCopy size={12} />}>
                    {copied ? "Copied" : "Copy"}
                  </Button>
                )}
              </CopyButton>
            </Group>
            <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.75rem", borderRadius: 8, wordBreak: "break-all", whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 12 }}>
              <span style={{ color: PURPLE }}>{displayToken.split(".")[0]}</span>
              <span style={{ color: DIM }}>.</span>
              <span style={{ color: CYAN }}>{displayToken.split(".")[1]}</span>
              <span style={{ color: DIM }}>.</span>
              <span style={{ color: AMBER }}>{displayToken.split(".")[2] || <span style={{ color: RED, fontStyle: "italic" }}>(empty)</span>}</span>
            </Code>
          </Paper>

          <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <Text size="xs" fw={600} mb={4} style={{ color: PURPLE }}>Header</Text>
            <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.5rem", borderRadius: 6, fontSize: 12, color: PURPLE }}>{JSON.stringify(header, null, 2)}</Code>
          </Paper>

          <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
            <Text size="xs" fw={600} mb={4} style={{ color: CYAN }}>Payload</Text>
            <Code block style={{ backgroundColor: BG, border: `1px solid ${BORDER}`, padding: "0.5rem", borderRadius: 6, fontSize: 12, color: CYAN }}>{JSON.stringify(payload, null, 2)}</Code>
          </Paper>

          {/* Live security check */}
          {findings.length > 0 && (
            <Paper p="sm" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
              <Text size="xs" fw={600} mb="xs" style={{ color: "#e0e0e0" }}>Security Check</Text>
              {findings.map((f, i) => (
                <Group key={i} gap="xs" mb={4}>
                  {severityIcon(f.severity)}
                  <Text size="xs" style={{ color: severityColor(f.severity) }}>{f.title}</Text>
                </Group>
              ))}
            </Paper>
          )}
        </Stack>
      </div>
    </Stack>
  );
}

// ── Sub-components ────────────────────────────────────────────
function DecodedSection({ label, color, icon, data }: { label: string; color: string; icon: React.ReactNode; data: Record<string, unknown> }) {
  const json = JSON.stringify(data, null, 2);
  return (
    <Paper p="md" radius="md" style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}>
      <Group gap="xs" mb="xs" justify="space-between">
        <Group gap="xs">{icon}<Text size="sm" fw={600} style={{ color }}>{label}</Text></Group>
        <CopyButton value={json}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied" : "Copy JSON"} withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={copy}>{copied ? <IconCheck size={14} /> : <IconCopy size={14} />}</ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <Code block style={{ backgroundColor: BG, color, padding: "0.75rem", borderRadius: 8, fontSize: 13, lineHeight: 1.5, border: `1px solid ${BORDER}` }}>{json}</Code>
    </Paper>
  );
}
