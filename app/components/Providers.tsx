"use client";

import { MyProvider } from '../../src/context/MyContext';
import { MantineProvider } from '@mantine/core';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MyProvider>
      <MantineProvider
        forceColorScheme="dark"
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
    </MyProvider>
  );
}

