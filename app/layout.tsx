import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import '@mantine/core/styles.css';
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './components/Providers';
import NavBar from './components/ui/NavBar';
import { VisitorBeacon } from './components/VisitorBeacon';

export const metadata: Metadata = {
  metadataBase: new URL("https://goonsite.org"),
  title: {
    default: "goonsite.org — Security Notes, Projects & Vulnerability Writeups",
    template: "%s | goonsite.org",
  },
  description: "Security research notes, vulnerability writeups, and personal projects. Covering web security, penetration testing, and exploit development.",
  keywords: ["security notes", "vulnerability writeups", "penetration testing", "web security", "exploit development", "goonsite"],
  authors: [{ name: "James" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://goonsite.org",
    siteName: "goonsite.org",
    title: "goonsite.org — Security Notes, Projects & Vulnerability Writeups",
    description: "Security research notes, vulnerability writeups, and personal projects. Covering web security, penetration testing, and exploit development.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "goonsite.org",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "goonsite.org — Security Notes, Projects & Vulnerability Writeups",
    description: "Security research notes, vulnerability writeups, and personal projects.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/lebron.png",
  },
  themeColor: "#1a1a1a",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className} style={{ colorScheme: 'dark', backgroundColor: '#0a0a0a' }} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'goonsite.org',
            url: 'https://goonsite.org',
            description: 'Security research notes, vulnerability writeups, and personal projects.',
            author: { '@type': 'Person', name: 'James', url: 'https://goonsite.org' },
          }) }}
        />
      </head>
      <body>
        <Providers>
          <VisitorBeacon />
          <NavBar />
          <main className="pt-14">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
