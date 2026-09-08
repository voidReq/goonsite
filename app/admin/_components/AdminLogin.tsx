'use client';

import React from 'react';
import {
  MantineProvider, Container, Paper, Stack, Title, TextInput, Alert, Button,
} from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { SURFACE, BORDER, INK, SERIES, CONTENT_MIN_HEIGHT } from './theme';

interface AdminLoginProps {
  title: string;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
  error?: string;
  loading?: boolean;
}

/** The password gate shared by the admin log and insights pages. */
export function AdminLogin({
  title, password, onPasswordChange, onSubmit, error, loading,
}: AdminLoginProps) {
  return (
    <MantineProvider forceColorScheme="dark">
      <Container
        size="xs"
        style={{ minHeight: CONTENT_MIN_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper
          p="xl" radius="md"
          style={{ width: '100%', maxWidth: 400, backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
        >
          <Stack gap="md" align="center">
            <IconLock size={48} style={{ color: SERIES[0] }} />
            <Title order={3} style={{ color: INK }}>{title}</Title>
            <TextInput
              placeholder="Admin password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => onPasswordChange(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
              style={{ width: '100%' }}
            />
            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light" style={{ width: '100%' }}>
                {error}
              </Alert>
            )}
            <Button onClick={onSubmit} loading={loading} fullWidth color="violet">
              Authenticate
            </Button>
          </Stack>
        </Paper>
      </Container>
    </MantineProvider>
  );
}
