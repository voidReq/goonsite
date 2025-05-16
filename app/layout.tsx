// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "./globals.css";
import { MyProvider } from '../src/context/MyContext';
import { MantineProvider, Text, Image } from '@mantine/core';

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
    <html lang="en" className={GeistSans.className}>
      <body>
        <MantineProvider>
          <MyProvider>
            {children}
          </MyProvider>
        </MantineProvider>
      </body>
    </html>
  );
}