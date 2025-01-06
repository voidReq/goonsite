"use client";
import { MantineProvider, Text, Image } from '@mantine/core';

export default function GoonCenter() {
  return (
    <MantineProvider forceColorScheme='dark'>
      
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}>
      <Text size="xl">Welcome to the Goon Center</Text>
      <Image
          radius="md"
          h={1000}
          w={1000}
          fit="contain"
          src="/lebron.png"
        />
        </div>
    </MantineProvider>
  );
} 