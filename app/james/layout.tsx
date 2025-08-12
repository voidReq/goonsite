// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import "../globals.css"; // Your global styles
import '@mantine/core/styles.css'; // Mantine core styles

import { MyProvider } from '../../src/context/MyContext';
import { MantineProvider, ColorSchemeScript } from '@mantine/core'; // Import ColorSchemeScript

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
      <head>
        <ColorSchemeScript forceColorScheme="dark" />
      </head>
      <body>
        <MantineProvider forceColorScheme="dark">
          <MyProvider>
            {children}
          </MyProvider>
        </MantineProvider>
      </body>
    </html>
  );
}