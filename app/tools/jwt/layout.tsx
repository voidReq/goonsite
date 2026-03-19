import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JWT Debugger & Security Analyzer",
  description:
    "Decode, inspect, and analyze JWT tokens for security issues. Detect algorithm confusion, weak keys, expired tokens, and more.",
};

export default function JwtLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
