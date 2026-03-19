"use client";

import { useState, useMemo } from "react";
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
  Anchor,
  Code,
  Divider,
  CopyButton,
  ActionIcon,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowLeft,
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

// ── Base64url decode ──────────────────────────────────────────
function base64urlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = base64.length % 4;
  if (pad === 2) base64 += "==";
  else if (pad === 3) base64 += "=";
  return atob(base64);
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
    return {
      header,
      payload,
      signature: parts[2],
      rawParts: [parts[0], parts[1], parts[2]],
    };
  } catch {
    return null;
  }
}

// ── Security analysis ─────────────────────────────────────────
function analyzeJwt(decoded: DecodedJwt): Finding[] {
  const findings: Finding[] = [];
  const { header, payload } = decoded;
  const alg = String(header.alg ?? "").toLowerCase();
  const now = Math.floor(Date.now() / 1000);

  // Algorithm "none"
  if (alg === "none" || alg === "") {
    findings.push({
      severity: "critical",
      title: 'Algorithm "none" Detected',
      detail:
        'This token uses the "none" algorithm, meaning it has no signature verification. Anyone can forge this token. Never accept unsigned JWTs in production.',
    });
  }

  // Weak symmetric algorithm warning
  if (alg === "hs256") {
    findings.push({
      severity: "warning",
      title: "HS256 — Weak Key Risk",
      detail:
        "HS256 relies on a shared secret. If the key is short, guessable, or leaked, tokens can be forged. Ensure the signing key is at least 256 bits of cryptographic randomness.",
    });
  }

  // Algorithm confusion (RS256)
  if (alg === "rs256" || alg === "rs384" || alg === "rs512") {
    findings.push({
      severity: "warning",
      title: "Algorithm Confusion Risk (RSA)",
      detail:
        "This token uses an RSA algorithm. If the server does not strictly enforce the expected algorithm, an attacker could re-sign the token with HS256 using the public key as the HMAC secret. See the explainer below for details.",
    });
  }

  // Expired
  if (typeof payload.exp === "number") {
    if (payload.exp < now) {
      findings.push({
        severity: "critical",
        title: "Token Expired",
        detail: `This token expired on ${new Date(payload.exp * 1000).toLocaleString()}. It should no longer be accepted by any compliant verifier.`,
      });
    } else {
      findings.push({
        severity: "ok",
        title: "Token Not Expired",
        detail: `Expires ${new Date(payload.exp * 1000).toLocaleString()}.`,
      });
    }
  }

  // Not yet valid
  if (typeof payload.nbf === "number" && payload.nbf > now) {
    findings.push({
      severity: "warning",
      title: "Token Not Yet Valid",
      detail: `The "nbf" (not before) claim is set to ${new Date(payload.nbf * 1000).toLocaleString()}, which is in the future. This token is not yet active.`,
    });
  }

  // iat in the future
  if (typeof payload.iat === "number" && payload.iat > now + 60) {
    findings.push({
      severity: "warning",
      title: '"iat" Is in the Future',
      detail: `The "iat" (issued at) claim is ${new Date(payload.iat * 1000).toLocaleString()}, which is ahead of the current time. This could indicate clock skew or token manipulation.`,
    });
  }

  // Missing standard claims
  const recommended = ["iss", "aud", "sub"] as const;
  const missing = recommended.filter((c) => !(c in payload));
  if (missing.length > 0) {
    findings.push({
      severity: "info",
      title: `Missing Recommended Claim${missing.length > 1 ? "s" : ""}`,
      detail: `The following standard claims are absent: ${missing.map((c) => `"${c}"`).join(", ")}. While not always required, including them improves token security and interoperability.`,
    });
  }

  // All good fallback
  if (findings.length === 0) {
    findings.push({
      severity: "ok",
      title: "No Issues Detected",
      detail:
        "No obvious security issues found. This does not guarantee the token is safe — always verify signatures server-side.",
    });
  }

  return findings;
}

// ── Severity helpers ──────────────────────────────────────────
function severityColor(s: Severity) {
  switch (s) {
    case "critical":
      return RED;
    case "warning":
      return AMBER;
    case "info":
      return CYAN;
    case "ok":
      return GREEN;
  }
}

function severityIcon(s: Severity) {
  const size = 16;
  switch (s) {
    case "critical":
      return <IconAlertCircle size={size} color={RED} />;
    case "warning":
      return <IconAlertTriangle size={size} color={AMBER} />;
    case "info":
      return <IconInfoCircle size={size} color={CYAN} />;
    case "ok":
      return <IconShieldCheck size={size} color={GREEN} />;
  }
}

// ── Format claim value ────────────────────────────────────────
function formatClaimValue(key: string, value: unknown): string {
  if (TIME_CLAIMS.has(key) && typeof value === "number") {
    return `${new Date(value * 1000).toLocaleString()} (${value})`;
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

// ══════════════════════════════════════════════════════════════
//  Page component
// ══════════════════════════════════════════════════════════════
export default function JwtDebuggerPage() {
  const [token, setToken] = useState("");
  const [explainerOpen, setExplainerOpen] = useState(false);

  const decoded = useMemo(() => {
    if (!token.trim()) return null;
    return decodeJwt(token);
  }, [token]);

  const findings = useMemo(() => {
    if (!decoded) return [];
    return analyzeJwt(decoded);
  }, [decoded]);

  const hasAlgoConfusion = findings.some(
    (f) => f.title.includes("Algorithm Confusion")
  );

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        color: "#c0caf5",
      }}
    >
      <Box
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        {/* ── Back link ─────────────────────────────────── */}
        <Anchor
          href="/"
          underline="hover"
          style={{ color: DIM, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <IconArrowLeft size={14} />
          Back to home
        </Anchor>

        {/* ── Header ────────────────────────────────────── */}
        <Group gap="sm" mt="lg" mb={4}>
          <IconKey size={28} color={PURPLE} />
          <Title order={1} style={{ color: "#e0e0e0", fontSize: "1.75rem", fontWeight: 700 }}>
            JWT Debugger & Security Analyzer
          </Title>
        </Group>
        <Text size="sm" c="dimmed" mb="xl">
          Paste a JSON Web Token to decode its header and payload, inspect claims, and check for common security issues.
          Everything runs locally in your browser — no data is sent to any server.
        </Text>

        {/* ── Token input ───────────────────────────────── */}
        <Paper
          p="md"
          radius="md"
          style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <Group gap="xs" mb="xs">
            <IconLock size={16} color={PURPLE} />
            <Text size="sm" fw={600} style={{ color: PURPLE }}>
              Encoded Token
            </Text>
          </Group>
          <Textarea
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
            autosize
            minRows={3}
            maxRows={8}
            value={token}
            onChange={(e) => setToken(e.currentTarget.value)}
            styles={{
              input: {
                backgroundColor: BG,
                border: `1px solid ${BORDER}`,
                color: "#c0caf5",
                fontFamily: "monospace",
                fontSize: 13,
                "&::placeholder": { color: DIM },
              },
            }}
          />
        </Paper>

        {/* ── Decoded sections ──────────────────────────── */}
        {decoded && (
          <Stack gap="md" mt="lg">
            {/* Color-coded raw token */}
            <Paper
              p="md"
              radius="md"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <Text size="sm" fw={600} mb="xs" style={{ color: "#e0e0e0" }}>
                Color-coded Token
              </Text>
              <Code
                block
                style={{
                  backgroundColor: BG,
                  padding: "0.75rem",
                  borderRadius: 8,
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: 13,
                  border: `1px solid ${BORDER}`,
                }}
              >
                <span style={{ color: PURPLE }}>{decoded.rawParts[0]}</span>
                <span style={{ color: DIM }}>.</span>
                <span style={{ color: CYAN }}>{decoded.rawParts[1]}</span>
                <span style={{ color: DIM }}>.</span>
                <span style={{ color: AMBER }}>{decoded.rawParts[2]}</span>
              </Code>
            </Paper>

            {/* Header */}
            <DecodedSection
              label="Header"
              color={PURPLE}
              icon={<IconKey size={16} color={PURPLE} />}
              data={decoded.header}
            />

            {/* Payload */}
            <DecodedSection
              label="Payload"
              color={CYAN}
              icon={<IconLock size={16} color={CYAN} />}
              data={decoded.payload}
            />

            {/* Signature */}
            <Paper
              p="md"
              radius="md"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <Group gap="xs" mb="xs">
                <IconShieldCheck size={16} color={AMBER} />
                <Text size="sm" fw={600} style={{ color: AMBER }}>
                  Signature
                </Text>
              </Group>
              <Code
                block
                style={{
                  backgroundColor: BG,
                  color: AMBER,
                  padding: "0.75rem",
                  borderRadius: 8,
                  wordBreak: "break-all",
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  border: `1px solid ${BORDER}`,
                }}
              >
                {decoded.signature}
              </Code>
              <Text size="xs" c="dimmed" mt="xs">
                Signature verification requires the signing key and is not performed client-side.
              </Text>
            </Paper>

            <Divider color={BORDER} />

            {/* ── Security Analysis ──────────────────────── */}
            <Box>
              <Group gap="xs" mb="sm">
                <IconShieldCheck size={20} color={PURPLE} />
                <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>
                  Security Analysis
                </Title>
              </Group>

              <Stack gap="sm">
                {findings.map((f, i) => (
                  <Paper
                    key={i}
                    p="sm"
                    radius="md"
                    style={{
                      backgroundColor: SURFACE2,
                      border: `1px solid ${BORDER}`,
                      borderLeft: `3px solid ${severityColor(f.severity)}`,
                    }}
                  >
                    <Group gap="xs" mb={4}>
                      {severityIcon(f.severity)}
                      <Badge
                        size="sm"
                        variant="light"
                        color={
                          f.severity === "critical"
                            ? "red"
                            : f.severity === "warning"
                            ? "yellow"
                            : f.severity === "info"
                            ? "cyan"
                            : "green"
                        }
                        styles={{ root: { textTransform: "uppercase", fontWeight: 700 } }}
                      >
                        {f.severity}
                      </Badge>
                      <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>
                        {f.title}
                      </Text>
                    </Group>
                    <Text size="xs" style={{ color: DIM, lineHeight: 1.55, paddingLeft: 28 }}>
                      {f.detail}
                    </Text>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Divider color={BORDER} />

            {/* ── Claim Inspector ────────────────────────── */}
            <Box>
              <Group gap="xs" mb="sm">
                <IconClock size={20} color={CYAN} />
                <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>
                  Claim Inspector
                </Title>
              </Group>

              <Paper
                radius="md"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${BORDER}`,
                  overflow: "hidden",
                }}
              >
                <Table
                  striped
                  highlightOnHover
                  styles={{
                    table: { backgroundColor: "transparent" },
                    thead: { backgroundColor: SURFACE2 },
                    tr: { borderColor: BORDER },
                    th: { color: DIM, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
                    td: { fontSize: 13, borderColor: BORDER },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 120 }}>Claim</Table.Th>
                      <Table.Th style={{ width: 160 }}>Label</Table.Th>
                      <Table.Th>Value</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {Object.entries(decoded.payload).map(([key, value]) => (
                      <Table.Tr key={key}>
                        <Table.Td>
                          <Code
                            style={{
                              backgroundColor: SURFACE2,
                              color: PURPLE,
                              fontSize: 12,
                              padding: "2px 6px",
                            }}
                          >
                            {key}
                          </Code>
                        </Table.Td>
                        <Table.Td style={{ color: DIM }}>
                          {CLAIM_LABELS[key] ?? "—"}
                        </Table.Td>
                        <Table.Td
                          style={{
                            fontFamily: "monospace",
                            color: TIME_CLAIMS.has(key) ? AMBER : "#c0caf5",
                            wordBreak: "break-all",
                          }}
                        >
                          <Group gap="xs" wrap="nowrap" justify="space-between">
                            <span>{formatClaimValue(key, value)}</span>
                            <CopyButton value={formatClaimValue(key, value)}>
                              {({ copied, copy }) => (
                                <Tooltip label={copied ? "Copied" : "Copy"} withArrow>
                                  <ActionIcon
                                    size="xs"
                                    variant="subtle"
                                    color="gray"
                                    onClick={copy}
                                    style={{ flexShrink: 0 }}
                                  >
                                    {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
                                  </ActionIcon>
                                </Tooltip>
                              )}
                            </CopyButton>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                    {Object.keys(decoded.payload).length === 0 && (
                      <Table.Tr>
                        <Table.Td colSpan={3}>
                          <Text size="sm" c="dimmed" ta="center" py="sm">
                            No claims found in this token.
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    )}
                  </Table.Tbody>
                </Table>
              </Paper>
            </Box>

            <Divider color={BORDER} />

            {/* ── Algorithm Confusion Explainer ───────────── */}
            <Box>
              <Group
                gap="xs"
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setExplainerOpen((o) => !o)}
              >
                {explainerOpen ? (
                  <IconChevronDown size={18} color={PURPLE} />
                ) : (
                  <IconChevronRight size={18} color={PURPLE} />
                )}
                <IconAlertTriangle size={20} color={AMBER} />
                <Title order={3} style={{ color: "#e0e0e0", fontSize: "1.15rem" }}>
                  Algorithm Confusion Attack — Explainer
                </Title>
                {hasAlgoConfusion && (
                  <Badge size="xs" variant="light" color="yellow">
                    relevant
                  </Badge>
                )}
              </Group>

              <Collapse in={explainerOpen}>
                <Paper
                  p="lg"
                  mt="sm"
                  radius="md"
                  style={{
                    backgroundColor: SURFACE2,
                    border: `1px solid ${BORDER}`,
                    lineHeight: 1.7,
                  }}
                >
                  <Text size="sm" mb="md" style={{ color: "#c0caf5" }}>
                    The <strong style={{ color: AMBER }}>RS256 to HS256 algorithm confusion</strong> attack
                    exploits JWT libraries that trust the <Code style={{ backgroundColor: SURFACE, color: PURPLE, padding: "1px 4px" }}>alg</Code> header
                    without enforcing a server-side allowlist. Here is how it works step-by-step:
                  </Text>

                  <Stack gap="sm">
                    <ExplainerStep
                      n={1}
                      title="Server signs tokens with RS256"
                      detail="The server creates JWTs signed with its RSA private key and verifies them with the corresponding public key. The public key is often available via JWKS endpoints or certificate files."
                    />
                    <ExplainerStep
                      n={2}
                      title="Attacker obtains the public key"
                      detail="RSA public keys are designed to be public. The attacker retrieves the server's public key from /.well-known/jwks.json, an x509 certificate, or other public sources."
                    />
                    <ExplainerStep
                      n={3}
                      title='Attacker changes "alg" to HS256'
                      detail='The attacker modifies the JWT header from {"alg":"RS256"} to {"alg":"HS256"}, switching from asymmetric (RSA) to symmetric (HMAC) verification.'
                    />
                    <ExplainerStep
                      n={4}
                      title="Attacker signs with the public key as HMAC secret"
                      detail="The attacker re-signs the modified token using the RSA public key as the HMAC-SHA256 secret. Since HS256 uses the same key for signing and verifying, this produces a valid signature."
                    />
                    <ExplainerStep
                      n={5}
                      title="Vulnerable server accepts the token"
                      detail='If the server reads "alg" from the token header and uses HS256 verification with the "key" (which is the public key), the signature matches. The forged token is accepted.'
                    />
                  </Stack>

                  <Divider my="md" color={BORDER} />

                  <Text size="sm" fw={600} style={{ color: GREEN }} mb="xs">
                    Mitigations
                  </Text>
                  <Stack gap={4}>
                    <Text size="sm" style={{ color: "#c0caf5" }}>
                      <span style={{ color: GREEN, marginRight: 6 }}>1.</span>
                      <strong>Always enforce the expected algorithm server-side.</strong> Never trust the <Code style={{ backgroundColor: SURFACE, color: PURPLE, padding: "1px 4px" }}>alg</Code> header from the token itself.
                    </Text>
                    <Text size="sm" style={{ color: "#c0caf5" }}>
                      <span style={{ color: GREEN, marginRight: 6 }}>2.</span>
                      Use an allowlist of accepted algorithms when configuring your JWT library (e.g., <Code style={{ backgroundColor: SURFACE, color: CYAN, padding: "1px 4px" }}>algorithms: [&quot;RS256&quot;]</Code>).
                    </Text>
                    <Text size="sm" style={{ color: "#c0caf5" }}>
                      <span style={{ color: GREEN, marginRight: 6 }}>3.</span>
                      Use separate key objects for asymmetric and symmetric operations so they cannot be interchanged.
                    </Text>
                    <Text size="sm" style={{ color: "#c0caf5" }}>
                      <span style={{ color: GREEN, marginRight: 6 }}>4.</span>
                      Keep your JWT library up to date — most modern libraries have patched this class of vulnerability.
                    </Text>
                  </Stack>
                </Paper>
              </Collapse>
            </Box>
          </Stack>
        )}

        {/* ── Empty state ───────────────────────────────── */}
        {!decoded && token.trim() !== "" && (
          <Paper
            p="lg"
            mt="lg"
            radius="md"
            ta="center"
            style={{
              backgroundColor: SURFACE,
              border: `1px solid ${BORDER}`,
              borderLeft: `3px solid ${RED}`,
            }}
          >
            <IconAlertCircle size={24} color={RED} style={{ marginBottom: 4 }} />
            <Text size="sm" style={{ color: RED }} fw={600}>
              Invalid JWT Format
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              A valid JWT has three base64url-encoded parts separated by dots: header.payload.signature
            </Text>
          </Paper>
        )}

        {!token.trim() && (
          <Paper
            p="xl"
            mt="lg"
            radius="md"
            ta="center"
            style={{
              backgroundColor: SURFACE,
              border: `1px dashed ${BORDER}`,
            }}
          >
            <IconKey size={32} color={DIM} style={{ marginBottom: 8 }} />
            <Text size="sm" c="dimmed">
              Paste a JWT token above to get started.
            </Text>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

// ── Sub-components (kept in same file) ────────────────────────

function DecodedSection({
  label,
  color,
  icon,
  data,
}: {
  label: string;
  color: string;
  icon: React.ReactNode;
  data: Record<string, unknown>;
}) {
  const json = JSON.stringify(data, null, 2);

  return (
    <Paper
      p="md"
      radius="md"
      style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
    >
      <Group gap="xs" mb="xs" justify="space-between">
        <Group gap="xs">
          {icon}
          <Text size="sm" fw={600} style={{ color }}>
            {label}
          </Text>
        </Group>
        <CopyButton value={json}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? "Copied" : "Copy JSON"} withArrow>
              <ActionIcon size="sm" variant="subtle" color="gray" onClick={copy}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </Group>
      <Code
        block
        style={{
          backgroundColor: BG,
          color,
          padding: "0.75rem",
          borderRadius: 8,
          fontSize: 13,
          lineHeight: 1.5,
          border: `1px solid ${BORDER}`,
        }}
      >
        {json}
      </Code>
    </Paper>
  );
}

function ExplainerStep({
  n,
  title,
  detail,
}: {
  n: number;
  title: string;
  detail: string;
}) {
  return (
    <Paper
      p="sm"
      radius="md"
      style={{
        backgroundColor: SURFACE,
        border: `1px solid ${BORDER}`,
      }}
    >
      <Group gap="xs" mb={2}>
        <Badge
          size="sm"
          circle
          variant="filled"
          color="violet"
          styles={{ root: { minWidth: 22, height: 22, padding: 0, fontWeight: 700 } }}
        >
          {n}
        </Badge>
        <Text size="sm" fw={600} style={{ color: "#e0e0e0" }}>
          {title}
        </Text>
      </Group>
      <Text size="xs" style={{ color: DIM, paddingLeft: 30, lineHeight: 1.55 }}>
        {detail}
      </Text>
    </Paper>
  );
}
