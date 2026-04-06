"use client";

import { MyProvider } from '../../src/context/MyContext';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';
import { MantineProvider } from '@mantine/core';

function MantineWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <MantineProvider
      forceColorScheme={theme}
      theme={{
        colors: {
          dark: [
            '#c0caf5',
            '#a9b1d6',
            '#9aa5ce',
            '#565f89',
            '#414868',
            '#24283b',
            '#1a1b26',
            '#0f0f14',
            '#0f0f14',
            '#0a0a0f',
          ],
        },
      }}
    >
      {children}
    </MantineProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MyProvider>
      <ThemeProvider>
        <MantineWrapper>
          {children}
        </MantineWrapper>
      </ThemeProvider>
    </MyProvider>
  );
}
