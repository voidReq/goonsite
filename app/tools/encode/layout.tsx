import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Encoding & Hashing Multitool",
  description:
    "Encode, decode, and hash text instantly. Base64, URL encoding, hex, HTML entities, MD5, SHA-1, SHA-256, SHA-512, and hash identifier.",
};

export default function EncodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
