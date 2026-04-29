import { describe, it, expect } from 'vitest';
import path from 'path';
import { assertSafeRelativePath, assertSafeFilename, sniffImageExtension, SafePathError } from './projects-admin';

const BASE = path.resolve('/tmp/test-base');

describe('assertSafeRelativePath', () => {
  it('accepts simple segment', () => {
    const r = assertSafeRelativePath('Writeups', BASE);
    expect(r).toBe(path.join(BASE, 'Writeups'));
  });

  it('accepts nested segments with allowed chars', () => {
    const r = assertSafeRelativePath('Writeups/Critical XSS_2024-12', BASE);
    expect(r).toBe(path.join(BASE, 'Writeups/Critical XSS_2024-12'));
  });

  it('rejects parent traversal', () => {
    expect(() => assertSafeRelativePath('../etc', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('a/../b', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('a/b/../../etc', BASE)).toThrow(SafePathError);
  });

  it('rejects absolute paths', () => {
    expect(() => assertSafeRelativePath('/etc/passwd', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('~root', BASE)).toThrow(SafePathError);
  });

  it('rejects backslashes', () => {
    expect(() => assertSafeRelativePath('a\\b', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('..\\..\\windows', BASE)).toThrow(SafePathError);
  });

  it('rejects null bytes and control chars', () => {
    expect(() => assertSafeRelativePath('a\0b', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('a\x1fb', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('a\x7fb', BASE)).toThrow(SafePathError);
  });

  it('rejects drive letters', () => {
    expect(() => assertSafeRelativePath('C:/Windows', BASE)).toThrow(SafePathError);
  });

  it('rejects paths exceeding depth cap', () => {
    expect(() => assertSafeRelativePath('a/b/c/d/e', BASE)).toThrow(SafePathError);
  });

  it('rejects invalid characters', () => {
    expect(() => assertSafeRelativePath('a$b', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('a;rm -rf /', BASE)).toThrow(SafePathError);
    expect(() => assertSafeRelativePath('a.b', BASE)).toThrow(SafePathError);
  });

  it('rejects empty segments', () => {
    expect(() => assertSafeRelativePath('a//b', BASE)).toThrow(SafePathError);
  });
});

describe('assertSafeFilename', () => {
  it('accepts well-formed filenames', () => {
    expect(assertSafeFilename('My Writeup.md')).toBe('My Writeup.md');
    expect(assertSafeFilename('foo-bar_baz.md')).toBe('foo-bar_baz.md');
  });

  it('rejects wrong extension', () => {
    expect(() => assertSafeFilename('foo.sh')).toThrow(SafePathError);
    expect(() => assertSafeFilename('foo.txt')).toThrow(SafePathError);
    expect(() => assertSafeFilename('foo')).toThrow(SafePathError);
  });

  it('rejects hidden files', () => {
    expect(() => assertSafeFilename('.hidden.md')).toThrow(SafePathError);
  });

  it('rejects path traversal in filename', () => {
    expect(() => assertSafeFilename('../foo.md')).toThrow(SafePathError);
    expect(() => assertSafeFilename('a/b.md')).toThrow(SafePathError);
  });

  it('rejects invalid chars', () => {
    expect(() => assertSafeFilename('foo$.md')).toThrow(SafePathError);
    expect(() => assertSafeFilename('foo\0.md')).toThrow(SafePathError);
  });
});

describe('sniffImageExtension', () => {
  it('detects PNG', () => {
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(sniffImageExtension(buf)).toBe('png');
  });

  it('detects JPEG', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageExtension(buf)).toBe('jpg');
  });

  it('detects GIF87a / GIF89a', () => {
    const buf87 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x37, 0x61, 0, 0, 0, 0, 0, 0]);
    const buf89 = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
    expect(sniffImageExtension(buf87)).toBe('gif');
    expect(sniffImageExtension(buf89)).toBe('gif');
  });

  it('detects WebP', () => {
    const buf = Buffer.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(sniffImageExtension(buf)).toBe('webp');
  });

  it('rejects PDF disguised as image', () => {
    const buf = Buffer.from('%PDF-1.4\n%abc');
    expect(sniffImageExtension(buf)).toBeNull();
  });

  it('rejects tiny buffer', () => {
    expect(sniffImageExtension(Buffer.from([0xff]))).toBeNull();
  });

  it('rejects HTML', () => {
    const buf = Buffer.from('<html><script>alert(1)</script></html>');
    expect(sniffImageExtension(buf)).toBeNull();
  });
});
