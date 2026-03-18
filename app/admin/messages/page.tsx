'use client';

import React, { useState } from 'react';
import {
  MantineProvider,
  TextInput,
  Button,
  Text,
  Paper,
  Group,
  Stack,
  Badge,
  Title,
  Loader,
  Alert,
  Container,
  ActionIcon,
} from '@mantine/core';
import '@mantine/core/styles.css';
import {
  IconLock,
  IconAlertCircle,
  IconCheck,
  IconX,
  IconMessage,
  IconRefresh,
} from '@tabler/icons-react';

interface PendingMessage {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  ip: string;
}

export default function AdminMessagesPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<PendingMessage[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchMessages = async (pwd?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${pwd || password}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      } else if (res.status === 401) {
        setAuthError('Invalid password');
        setAuthed(false);
      }
    } catch {
      setAuthError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/messages', {
        headers: { Authorization: `Bearer ${password}` },
      });
      if (res.ok) {
        setAuthed(true);
        const data = await res.json();
        setMessages(data.messages || []);
      } else {
        setAuthError(res.status === 429 ? 'Too many attempts. Try again later.' : 'Invalid password');
      }
    } catch {
      setAuthError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'deny') => {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${password}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setActionLoading(null);
    }
  };

  if (!authed) {
    return (
      <MantineProvider forceColorScheme="dark">
        <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
          <Paper p="xl" radius="md" style={{ width: '100%', background: '#141414' }}>
            <Stack align="center" gap="md">
              <IconLock size={40} color="#7c3aed" />
              <Title order={3}>Message Moderation</Title>
              <TextInput
                placeholder="Admin password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ width: '100%' }}
              />
              {authError && (
                <Alert color="red" icon={<IconAlertCircle />} style={{ width: '100%' }}>
                  {authError}
                </Alert>
              )}
              <Button
                fullWidth
                color="violet"
                loading={loading}
                onClick={handleLogin}
                disabled={!password}
              >
                Login
              </Button>
            </Stack>
          </Paper>
        </Container>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider forceColorScheme="dark">
      <Container size="md" py="xl">
        <Group justify="space-between" mb="xl" wrap="wrap" gap="sm">
          <Group wrap="wrap" gap="sm">
            <IconMessage size={28} color="#7c3aed" />
            <Title order={3}>Pending Messages</Title>
            <Badge color="violet" size="lg">
              {messages.length}
            </Badge>
          </Group>
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => fetchMessages()}
            loading={loading}
          >
            <IconRefresh size={20} />
          </ActionIcon>
        </Group>

        {loading && messages.length === 0 ? (
          <Stack align="center" py="xl">
            <Loader color="violet" />
          </Stack>
        ) : messages.length === 0 ? (
          <Paper p="xl" radius="md" style={{ background: '#141414', textAlign: 'center' }}>
            <Text c="dimmed" size="lg">
              No pending messages. All clear!
            </Text>
          </Paper>
        ) : (
          <Stack gap="md">
            {messages.map((msg) => (
              <Paper
                key={msg.id}
                p="lg"
                radius="md"
                style={{
                  background: '#141414',
                  border: '1px solid #2a2a2a',
                }}
              >
                <Group justify="space-between" mb="xs">
                  <Group>
                    <Text fw={600} style={{ color: '#e2e8f0' }}>
                      {msg.author}
                    </Text>
                    <Badge variant="light" color="gray" size="sm">
                      {msg.ip}
                    </Badge>
                  </Group>
                  <Text size="xs" c="dimmed">
                    {new Date(msg.timestamp).toLocaleString()}
                  </Text>
                </Group>

                <Text
                  size="sm"
                  style={{
                    color: '#cbd5e1',
                    lineHeight: 1.6,
                    marginBottom: '16px',
                    padding: '12px',
                    background: '#1a1a2e',
                    borderRadius: '8px',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </Text>

                <Group justify="flex-end" gap="sm">
                  <Button
                    variant="light"
                    color="red"
                    size="sm"
                    leftSection={<IconX size={14} />}
                    loading={actionLoading === msg.id}
                    onClick={() => handleAction(msg.id, 'deny')}
                  >
                    Deny
                  </Button>
                  <Button
                    color="green"
                    size="sm"
                    leftSection={<IconCheck size={14} />}
                    loading={actionLoading === msg.id}
                    onClick={() => handleAction(msg.id, 'approve')}
                  >
                    Approve
                  </Button>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Container>
    </MantineProvider>
  );
}
