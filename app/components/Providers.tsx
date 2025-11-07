"use client";

import { MyProvider } from '../../src/context/MyContext';
import { MantineProvider } from '@mantine/core';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MyProvider>
      <MantineProvider forceColorScheme="dark">
        {children}
      </MantineProvider>
    </MyProvider>
  );
}

