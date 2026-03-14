import type { Metadata, Viewport } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css"; // Your global styles
import '@mantine/core/styles.css'; // Mantine core styles
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from './components/Providers';

export const metadata: Metadata = {
  metadataBase: new URL("https://goonsite.org"),
  title: "The Goonsite",
  description: "Personal projects, security notes, and more!",
  keywords: ["goon", "goonsite", "goon hub", "goon-sploit"],
  authors: [{ name: "Goonsite Team" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://goonsite.org", // Update this with your actual domain
    siteName: "The Goonsite",
    title: "The Goonsite",
    description: "Personal projects, security notes, and more!",
    images: [
      {
        url: "/og-image.png", // We'll create this next
        width: 1200,
        height: 630,
        alt: "The Goonsite",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Goonsite",
    description: "Personal projects, security notes, and more!",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/lebron.png", // Replace with your actual logo filename
  },
  themeColor: "#1a1a1a",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

import { VisitorBeacon } from './components/VisitorBeacon';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.className} style={{ colorScheme: 'dark', backgroundColor: '#0a0a0a' }} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <Providers>
          <VisitorBeacon />
          {children}
        </Providers>
      </body>
    </html>
  );
}
