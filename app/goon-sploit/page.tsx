"use client";
import { useState } from 'react';
import { MantineProvider, Text, TextInput, Button, Progress, Paper, Title, Group, Modal } from '@mantine/core';
import '@mantine/core/styles.css';
import Link from 'next/link';

export default function GoonSploit() {
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [modalOpened, setModalOpened] = useState(false);

  const startScan = () => {
    setScanning(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setScanning(false);
        setModalOpened(true);
      }
    }, 500);
  };

  return (
    <MantineProvider forceColorScheme="dark">
      <div style={{ padding: '20px' }}>
        <Title order={1} style={{ marginBottom: '20px' }}>Goon-sploit</Title>
        <Group grow>
          <Paper withBorder p="md" radius="md" style={{ flex: 1 }}>
            <Title order={3}>Goon-Threat Scanner</Title>
            <Text size="sm" c="dimmed">Scan for the latest goon-related threats.</Text>
            <Button onClick={startScan} disabled={scanning} style={{ marginTop: '20px' }}>
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
            {scanning && <Progress value={scanProgress} striped animated style={{ marginTop: '20px' }} />}
          </Paper>
        </Group>
        <Paper withBorder p="md" radius="md" style={{ marginTop: '20px' }}>
          <Title order={3}>Goon-sploit Articles</Title>
          <Text size="sm" c="dimmed">Latest goon-telligence from the field.</Text>
          <ul style={{ listStyleType: 'none', paddingLeft: 0, marginTop: '20px' }}>
            <li><Link href="/goon-sploit/how-to-goon-responsibly"><Text style={{ color: 'blue', textDecoration: 'underline' }}>How to Goon Responsibly: A Guide for the Modern Gooner</Text></Link></li>
            <li><Link href="/goon-sploit/the-rise-of-goon-somware"><Text style={{ color: 'blue', textDecoration: 'underline' }}>The Rise of Goon-somware: Protecting Your Digital Assets</Text></Link></li>
            <li><Link href="/goon-sploit/zero-day-goon-sploits"><Text style={{ color: 'blue', textDecoration: 'underline' }}>Zero-Day Goon-sploits: Are You at Risk?</Text></Link></li>
          </ul>
        </Paper>
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Goonware Detected!"
        >
          <Text>Your system has been infected with goonware. To remove it, please download and run our anti-goonware tool.</Text>
          <Button component="a" href="/anti-goonware.c" download style={{ marginTop: '20px' }}>
            Download Anti-Goonware
          </Button>
        </Modal>
      </div>
    </MantineProvider>
  );
}