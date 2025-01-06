"use client";
import { MantineProvider, Text } from '@mantine/core';

export default function GoonCenter() {
  return (
    <MantineProvider forceColorScheme='dark'>
      <Text size="xl">Welcome to the Goon Center!</Text>
    </MantineProvider>
  );
} 