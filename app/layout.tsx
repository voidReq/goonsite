import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";
import { MyProvider } from '../src/context/MyContext';

export const metadata: Metadata = {
  title: "The Gooonsite",
  description: "For all your gooning needs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MyProvider>
      <html lang="en" className={GeistSans.className}>
        <body>{children}</body>
      </html>
    </MyProvider>
  );
}
