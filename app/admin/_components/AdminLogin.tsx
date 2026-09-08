'use client';

import React from 'react';
import {
  Container, Paper, Stack, Title, TextInput, Alert, Button,
} from '@mantine/core';
import { IconLock, IconAlertCircle } from '@tabler/icons-react';
import { VIEWPORT_CENTERED, VIEWPORT_CENTERED_CARD } from './theme';
import { useChartTheme } from './useChartTheme';

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
  const t = useChartTheme();

  return (
    <>
      <Container
        size="xs"
        style={VIEWPORT_CENTERED}
      >
        <Paper
          p="xl" radius="md"
          style={{ ...VIEWPORT_CENTERED_CARD, width: '100%', maxWidth: 400, backgroundColor: t.surface, border: `1px solid ${t.border}` }}
        >
          <Stack gap="md" align="center">
            <IconLock size={48} style={{ color: t.series[0] }} />
            <Title order={3} style={{ color: t.ink }}>{title}</Title>
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
    </>
  );
}
