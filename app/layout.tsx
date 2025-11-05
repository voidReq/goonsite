"use client";

import { GeistSans } from 'geist/font/sans';
import "./globals.css"; // Your global styles
import '@mantine/core/styles.css'; // Mantine core styles
import { MyProvider } from '../src/context/MyContext';
import { MantineProvider, ColorSchemeScript } from '@mantine/core'; // Import ColorSchemeScript

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MyProvider>
      <html lang="en" className={GeistSans.className} style={{ colorScheme: 'dark', backgroundColor: '#0a0a0a' }}>
        <head>
          <ColorSchemeScript defaultColorScheme="dark" />
        </head>
        <body>
          <MantineProvider forceColorScheme="dark">
            {children}
          </MantineProvider>
        </body>
      </html>
    </MyProvider>
  );
}
