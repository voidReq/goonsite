'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@mantine/core';
import { IconPhotoUp } from '@tabler/icons-react';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';
import { useTheme } from '../../../src/context/ThemeContext';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

export interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  height?: number;
  uploadDisabledReason?: string;
}

export default function Editor({
  value,
  onChange,
  onUploadImage,
  height = 600,
  uploadDisabledReason,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const onUploadRef = useRef(onUploadImage);
  const { theme } = useTheme();

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
    onUploadRef.current = onUploadImage;
  }, [onChange, value, onUploadImage]);

  const insertAtCursor = useCallback((snippet: string) => {
    const textarea = containerRef.current?.querySelector('textarea') as HTMLTextAreaElement | null;
    const current = valueRef.current;
    if (!textarea) {
      onChangeRef.current(current + snippet);
      return;
    }
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const next = current.slice(0, start) + snippet + current.slice(end);
    onChangeRef.current(next);
    requestAnimationFrame(() => {
      const cursor = start + snippet.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      const id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, '');
      const placeholderUrl = `data:,uploading-${id}`;
      const placeholder = `![uploading ${file.name}…](${placeholderUrl})`;
      insertAtCursor(placeholder);
      const url = await onUploadRef.current(file);
      const replacement = url ? `![${file.name}](${url})` : `<!-- upload failed: ${file.name} -->`;
      onChangeRef.current(valueRef.current.replace(placeholder, replacement));
    },
    [insertAtCursor],
  );

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const textarea = root.querySelector('textarea');
    if (!textarea) return;

    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            void handleFile(file);
            return;
          }
        }
      }
    };

    const onDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;
      e.preventDefault();
      for (const file of imageFiles) {
        void handleFile(file);
      }
    };

    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
      }
    };

    textarea.addEventListener('paste', onPaste);
    textarea.addEventListener('drop', onDrop);
    textarea.addEventListener('dragover', onDragOver);
    return () => {
      textarea.removeEventListener('paste', onPaste);
      textarea.removeEventListener('drop', onDrop);
      textarea.removeEventListener('dragover', onDragOver);
    };
  }, [handleFile]);

  const handlePickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      void handleFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="md-editor-wrapper">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <Button
          size="xs"
          color="violet"
          variant="light"
          leftSection={<IconPhotoUp size={14} />}
          onClick={() => fileInputRef.current?.click()}
          disabled={!!uploadDisabledReason}
          title={uploadDisabledReason}
        >
          Upload image
        </Button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          or paste / drop into the editor
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          style={{ display: 'none' }}
          onChange={handlePickFiles}
        />
      </div>
      <div ref={containerRef} data-color-mode={theme}>
        <MDEditor
          value={value}
          onChange={(v) => onChange(v ?? '')}
          height={height}
          preview="live"
        />
      </div>
    </div>
  );
}
