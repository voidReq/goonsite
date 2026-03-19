"use client";
import { useState } from 'react';
import { Text, Button, Progress, Paper, Title, Group, Modal } from '@mantine/core';
import PageShell from '../components/ui/PageShell';

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
    <PageShell maxWidth="lg">
      <div className="py-8">
        <Title order={1} style={{ marginBottom: '20px', color: '#c0caf5' }}>Goon-sploit</Title>
        <Group grow>
          <Paper p="md" radius="md" className="glass-panel-solid">
            <Title order={3} style={{ color: '#c0caf5' }}>Goon-Threat Scanner</Title>
            <Text size="sm" c="dimmed">Scan for the latest goon-related threats.</Text>
            <Button onClick={startScan} disabled={scanning} color="violet" style={{ marginTop: '20px' }}>
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
            {scanning && <Progress value={scanProgress} striped animated color="violet" style={{ marginTop: '20px' }} />}
          </Paper>
        </Group>
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title="Goonware Detected!"
        >
          <Text>Your system has been infected with goonware. To remove it, please download and run our anti-goonware tool.</Text>
          <Button component="a" href="/anti-goonware.c" download color="violet" style={{ marginTop: '20px' }}>
            Download Anti-Goonware
          </Button>
        </Modal>
      </div>
    </PageShell>
  );
}
