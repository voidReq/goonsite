'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TextInput,
  Textarea,
  Button,
  Text,
  Paper,
  Group,
  Stack,
  Title,
  Alert,
  Container,
  Select,
  Switch,
  Code,
  Loader,
  Badge,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconLock,
  IconAlertCircle,
  IconUpload,
  IconCheck,
  IconNote,
  IconTrash,
  IconPlus,
  IconCloudCheck,
} from '@tabler/icons-react';
import Editor from './Editor';
import {
  loadAllDrafts,
  saveDraft,
  deleteDraft,
  newDraftId,
  timeAgo,
  type Draft,
} from './drafts';

interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeItem[];
}

function collectDirectories(items: TreeItem[], prefix: string = ''): string[] {
  const dirs: string[] = [];
  for (const item of items) {
    if (item.type === 'directory') {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      dirs.push(full);
      if (item.children) {
        dirs.push(...collectDirectories(item.children, full));
      }
    }
  }
  return dirs;
}

const DIR_REGEX = /^[A-Za-z0-9 _-]+(?:\/[A-Za-z0-9 _-]+)*$/;
const FILENAME_REGEX = /^[A-Za-z0-9 _-]+\.md$/;
const INITIAL_BODY = '# New Writeup\n\nStart writing here…\n';
const AUTOSAVE_DEBOUNCE_MS = 1000;
const AUTOSAVE_INTERVAL_MS = 20_000;

export default function AdminProjectsPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [csrfToken, setCsrfToken] = useState('');
  const [tree, setTree] = useState<TreeItem[]>([]);

  const [useNewDir, setUseNewDir] = useState(false);
  const [existingDir, setExistingDir] = useState<string | null>(null);
  const [newDir, setNewDir] = useState('');
  const [filename, setFilename] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState(INITIAL_BODY);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState<{ url: string } | null>(null);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string>('');
  const [draftStatus, setDraftStatus] = useState<'idle' | 'pending' | 'saved'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const skipNextAutosaveRef = useRef(false);
  const lastSavedSnapshotRef = useRef<string>('');

  const dir = useNewDir ? newDir.trim() : (existingDir ?? '');
  const dirValid = DIR_REGEX.test(dir);
  const filenameTrimmed = filename.trim();
  const finalFilename = filenameTrimmed.endsWith('.md')
    ? filenameTrimmed
    : filenameTrimmed
      ? `${filenameTrimmed}.md`
      : '';
  const filenameValid = finalFilename ? FILENAME_REGEX.test(finalFilename) : false;
  const canSave = dirValid && filenameValid && body.trim().length > 0 && !saving && csrfToken;

  const directoryOptions = useMemo(() => collectDirectories(tree).sort(), [tree]);

  const hasDraftableContent = useMemo(() => {
    const bodyChanged = body.trim().length > 0 && body !== INITIAL_BODY;
    return Boolean(
      bodyChanged ||
        title.trim() ||
        description.trim() ||
        filenameTrimmed ||
        (useNewDir ? newDir.trim() : existingDir),
    );
  }, [body, title, description, filenameTrimmed, useNewDir, newDir, existingDir]);

  const bootstrap = useCallback(async (pwd: string) => {
    const [csrfRes, treeRes] = await Promise.all([
      fetch('/api/admin/projects/csrf', { headers: { Authorization: `Bearer ${pwd}` } }),
      fetch('/api/admin/projects/tree', { headers: { Authorization: `Bearer ${pwd}` } }),
    ]);
    if (!csrfRes.ok || !treeRes.ok) {
      throw new Error(csrfRes.status === 401 ? 'Unauthorized' : `HTTP ${csrfRes.status}`);
    }
    const csrfData = await csrfRes.json();
    const treeData = await treeRes.json();
    setCsrfToken(csrfData.csrfToken);
    setTree(treeData.tree ?? []);
  }, []);

  const handleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await bootstrap(password);
      setAuthed(true);
    } catch (err) {
      setAuthError(
        err instanceof Error && err.message === 'Unauthorized' ? 'Invalid password' : 'Login failed',
      );
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (!authed) return;
    setDrafts(loadAllDrafts());
    setCurrentDraftId((id) => id || newDraftId());
  }, [authed]);

  const buildDraftSnapshot = useCallback(
    (id: string): { draft: Draft; key: string } => {
      const draft: Draft = {
        id,
        dir: useNewDir ? newDir : (existingDir ?? ''),
        filename,
        title,
        description,
        body,
        useNewDir,
        updatedAt: Date.now(),
      };
      const { updatedAt: _omit, ...rest } = draft;
      void _omit;
      return { draft, key: JSON.stringify(rest) };
    },
    [useNewDir, newDir, existingDir, filename, title, description, body],
  );

  const persistDraft = useCallback((): boolean => {
    if (!authed || !currentDraftId || !hasDraftableContent) return false;
    const { draft, key } = buildDraftSnapshot(currentDraftId);
    if (key === lastSavedSnapshotRef.current) return false;
    saveDraft(draft);
    lastSavedSnapshotRef.current = key;
    setDrafts(loadAllDrafts());
    setLastSavedAt(draft.updatedAt);
    setDraftStatus('saved');
    return true;
  }, [authed, currentDraftId, hasDraftableContent, buildDraftSnapshot]);

  useEffect(() => {
    if (!authed || !currentDraftId) return;
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }
    if (!hasDraftableContent) return;

    setDraftStatus('pending');
    const timer = setTimeout(() => {
      persistDraft();
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [
    authed,
    currentDraftId,
    hasDraftableContent,
    useNewDir,
    newDir,
    existingDir,
    filename,
    title,
    description,
    body,
    persistDraft,
  ]);

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => {
      persistDraft();
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [authed, persistDraft]);

  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [authed]);

  const startNew = useCallback(() => {
    skipNextAutosaveRef.current = true;
    lastSavedSnapshotRef.current = '';
    setCurrentDraftId(newDraftId());
    setUseNewDir(false);
    setExistingDir(null);
    setNewDir('');
    setFilename('');
    setTitle('');
    setDescription('');
    setBody(INITIAL_BODY);
    setDraftStatus('idle');
    setLastSavedAt(null);
    setSaveError('');
    setSaveSuccess(null);
  }, []);

  const loadDraft = useCallback((d: Draft) => {
    skipNextAutosaveRef.current = true;
    const { updatedAt: _omit, ...rest } = d;
    void _omit;
    lastSavedSnapshotRef.current = JSON.stringify(rest);
    setCurrentDraftId(d.id);
    setUseNewDir(d.useNewDir);
    if (d.useNewDir) {
      setNewDir(d.dir);
      setExistingDir(null);
    } else {
      setNewDir('');
      setExistingDir(d.dir || null);
    }
    setFilename(d.filename);
    setTitle(d.title);
    setDescription(d.description);
    setBody(d.body);
    setLastSavedAt(d.updatedAt);
    setDraftStatus('saved');
    setSaveError('');
    setSaveSuccess(null);
  }, []);

  const handleDeleteDraft = useCallback(
    (id: string) => {
      deleteDraft(id);
      setDrafts(loadAllDrafts());
      if (id === currentDraftId) {
        startNew();
      }
    },
    [currentDraftId, startNew],
  );

  const uploadImage = useCallback(
    async (file: File): Promise<string | null> => {
      if (!dirValid) {
        setSaveError('Choose a target directory before uploading images.');
        return null;
      }
      const fd = new FormData();
      fd.append('dir', dir);
      fd.append('file', file);
      const res = await fetch('/api/admin/projects/upload-image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${password}`,
          'X-CSRF-Token': csrfToken,
        },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaveError(`Upload failed: ${data.error ?? res.statusText}`);
        return null;
      }
      const data = await res.json();
      return data.url ?? null;
    },
    [csrfToken, dir, dirValid, password],
  );

  const handleSave = async () => {
    setSaveError('');
    setSaveSuccess(null);
    setSaving(true);
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${password}`,
          'X-CSRF-Token': csrfToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dir,
          filename: finalFilename,
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          body,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error ?? `HTTP ${res.status}`);
      } else {
        setSaveSuccess({ url: data.url });
        if (currentDraftId) {
          deleteDraft(currentDraftId);
          setDrafts(loadAllDrafts());
        }
        const treeRes = await fetch('/api/admin/projects/tree', {
          headers: { Authorization: `Bearer ${password}` },
        });
        if (treeRes.ok) {
          const td = await treeRes.json();
          setTree(td.tree ?? []);
        }
        startNew();
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (saveSuccess) {
      const t = setTimeout(() => setSaveSuccess(null), 8000);
      return () => clearTimeout(t);
    }
  }, [saveSuccess]);

  if (!authed) {
    return (
      <Container size="xs" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper p="xl" radius="md" withBorder style={{ width: '100%', maxWidth: 400 }}>
          <Stack align="center" gap="md">
            <IconLock size={40} color="#7c3aed" />
            <Title order={3}>Project Uploader</Title>
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
            <Button fullWidth color="violet" loading={authLoading} onClick={handleLogin} disabled={!password}>
              Login
            </Button>
          </Stack>
        </Paper>
      </Container>
    );
  }

  const draftStatusLabel =
    draftStatus === 'pending'
      ? 'Saving draft…'
      : draftStatus === 'saved' && lastSavedAt
        ? `Draft saved ${timeAgo(lastSavedAt, now)}`
        : 'Not saved yet';

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="md" wrap="wrap" gap="sm">
        <Group>
          <IconUpload size={28} color="#7c3aed" />
          <Title order={3}>Project Writeup Uploader</Title>
        </Group>
        <Group gap="xs">
          <IconCloudCheck size={14} style={{ opacity: 0.7 }} />
          <Text size="xs" c="dimmed">{draftStatusLabel}</Text>
          <Button size="xs" variant="default" leftSection={<IconPlus size={14} />} onClick={startNew}>
            New writeup
          </Button>
        </Group>
      </Group>

      <Paper p="md" radius="md" mb="md" withBorder>
        <Group gap="sm" mb={drafts.length > 0 ? 'sm' : 0}>
          <IconNote size={16} />
          <Text size="sm" fw={500}>Drafts</Text>
          <Badge size="sm" variant="light">{drafts.length}</Badge>
        </Group>
        {drafts.length === 0 ? (
          <Text size="xs" c="dimmed">No drafts yet. Autosave kicks in after you start typing.</Text>
        ) : (
          <Stack gap={6}>
            {drafts.map((d) => {
              const isCurrent = d.id === currentDraftId;
              const label = d.filename || d.title || '(untitled)';
              const dirLabel = d.dir || '(no directory)';
              return (
                <Group
                  key={d.id}
                  justify="space-between"
                  wrap="nowrap"
                  gap="sm"
                  style={{
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: isCurrent ? 'var(--mantine-color-violet-light)' : undefined,
                  }}
                >
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                    <Text size="sm" truncate style={{ minWidth: 0 }}>{label}</Text>
                    <Text size="xs" c="dimmed" truncate>
                      {dirLabel} · {timeAgo(d.updatedAt, now)}
                    </Text>
                    {isCurrent && <Badge size="xs" color="violet" variant="filled">current</Badge>}
                  </Group>
                  <Group gap={4} wrap="nowrap">
                    {!isCurrent && (
                      <Button size="compact-xs" variant="light" onClick={() => loadDraft(d)}>
                        Load
                      </Button>
                    )}
                    <Tooltip label="Delete draft">
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDeleteDraft(d.id)}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Group>
              );
            })}
          </Stack>
        )}
      </Paper>

      <Paper p="md" radius="md" mb="md" withBorder>
        <Stack gap="sm">
          <Group align="flex-end" wrap="wrap" gap="md">
            <Switch
              label="Create new directory"
              checked={useNewDir}
              onChange={(e) => setUseNewDir(e.currentTarget.checked)}
            />
            {useNewDir ? (
              <TextInput
                label="New directory (relative to data/projects)"
                placeholder="Writeups/category"
                value={newDir}
                onChange={(e) => setNewDir(e.currentTarget.value)}
                style={{ flex: 1, minWidth: 240 }}
                error={newDir && !DIR_REGEX.test(newDir.trim()) ? 'Invalid path' : undefined}
              />
            ) : (
              <Select
                label="Existing directory"
                placeholder="Select a directory"
                value={existingDir}
                onChange={setExistingDir}
                data={directoryOptions}
                searchable
                style={{ flex: 1, minWidth: 240 }}
              />
            )}
            <TextInput
              label="Filename (.md)"
              placeholder="My Writeup.md"
              value={filename}
              onChange={(e) => setFilename(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 240 }}
              error={filenameTrimmed && !filenameValid ? 'Use letters, numbers, spaces, _ or - and .md' : undefined}
            />
          </Group>

          <Group align="flex-end" wrap="wrap" gap="md">
            <TextInput
              label="Title (frontmatter, optional)"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              style={{ flex: 1, minWidth: 240 }}
            />
            <Textarea
              label="Description (frontmatter, optional)"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              autosize
              minRows={1}
              style={{ flex: 2, minWidth: 240 }}
            />
          </Group>

          {dirValid && filenameValid && (
            <Text size="xs" c="dimmed">
              Will save to <Code>data/projects/{dir}/{finalFilename}</Code>
            </Text>
          )}
        </Stack>
      </Paper>

      <Editor
        value={body}
        onChange={setBody}
        onUploadImage={uploadImage}
        height={640}
        uploadDisabledReason={!dirValid ? 'Choose a target directory before uploading images.' : undefined}
      />

      <Group justify="flex-end" mt="md" gap="sm">
        {saveError && (
          <Alert color="red" icon={<IconAlertCircle />} style={{ flex: 1 }}>
            {saveError}
          </Alert>
        )}
        {saveSuccess && (
          <Alert color="green" icon={<IconCheck />} style={{ flex: 1 }}>
            Saved.{' '}
            <a href={saveSuccess.url} target="_blank" rel="noreferrer" style={{ color: '#7c3aed' }}>
              View at {saveSuccess.url}
            </a>
          </Alert>
        )}
        <Button color="violet" loading={saving} disabled={!canSave} onClick={handleSave}>
          {saving ? <Loader size="xs" /> : 'Publish writeup'}
        </Button>
      </Group>
    </Container>
  );
}
