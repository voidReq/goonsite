import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HTTP Security Header Analyzer",
  description:
    "Analyze HTTP response headers for security issues. Check HSTS, CSP, CORS, X-Frame-Options, and more with detailed explanations.",
};

export default function HeadersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
