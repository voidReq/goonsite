"use client";

import { GeistSans } from 'geist/font/sans';
import "./globals.css"; // Your global styles
import '@mantine/core/styles.css'; // Mantine core styles
import { MyProvider } from '../src/context/MyContext';
import { MantineProvider, ColorSchemeScript, Switch, Group } from '@mantine/core'; // Import ColorSchemeScript
import { useState } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');

  const toggleColorScheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <MyProvider>
      <html lang="en" className={GeistSans.className}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <ColorSchemeScript />
        </head>
        <body>
          <MantineProvider forceColorScheme={colorScheme}>
            <Group justify="flex-end" p="md">
              <Switch
                checked={colorScheme === 'dark'}
                onChange={toggleColorScheme}
                size="lg"
                onLabel="Goon Mode"
                offLabel="Normal Mode"
              />
            </Group>
            {children}
          </MantineProvider>
        </body>
      </html>
    </MyProvider>
  );
}
