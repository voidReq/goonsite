import React from 'react';
import { MantineProvider, Text, Switch, Rating, Image, Tooltip, Notification, Alert, Button, Center, Stack } from '@mantine/core'; // Added Center and Stack
import '@mantine/core/styles.css';
import { IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import Link from 'next/link';
// dynamic import is not used in this specific component, but keeping it if you plan to use it elsewhere.
// import dynamic from 'next/dynamic';

export default function JamesCenter() {
  return (
    <MantineProvider forceColorScheme = "dark"> {/* Assuming MantineProvider is needed here, otherwise it should be at a higher level in your app */}
      
      <Center style={{ height: '100vh' }}>
        
        <Stack align="center" gap="md">
          <Link href="james/EastOfEden" style={{ textDecoration: 'none' }}>
            <Button
              variant="light"
              leftSection={<IconInfoCircle size={14} />}
              rightSection={<IconArrowRight size={14} />}
            >
              Visit my East of Eden entries
            </Button>
          </Link>

          <Link href="james/Articles" style={{ textDecoration: 'none' }}>
            <Button
              variant="light"
              leftSection={<IconInfoCircle size={14} />}
              rightSection={<IconArrowRight size={14} />}
            >
              Visit my nonfiction article entries
            </Button>
          </Link>

          <Link href="james/SenseOfWonder" style={{ textDecoration: 'none' }}>
            <Button
              variant="light"
              leftSection={<IconInfoCircle size={14} />}
              rightSection={<IconArrowRight size={14} />}
            >
              Visit my nonfiction book entries
            </Button>
          </Link>
          
          <Link href="james/Documentary" style={{ textDecoration: 'none' }}>
            <Button
              variant="light"
              leftSection={<IconInfoCircle size={14} />}
              rightSection={<IconArrowRight size={14} />}
            >
              Visit my documentary write-up
            </Button>
          </Link>

        </Stack>
      </Center>
    </MantineProvider>
  );
}