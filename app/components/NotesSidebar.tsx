'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { NoteTreeItem } from '@/lib/notes';
import { IconChevronRight, IconChevronDown, IconFile, IconFolder, IconFolderOpen, IconLayoutSidebar, IconX } from '@tabler/icons-react';

function TreeNode({
  item,
  level = 0,
  onNoteClick
}: {
  item: NoteTreeItem;
  level?: number;
  onNoteClick?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const hasChildren = item.type === 'directory' && item.children && item.children.length > 0;

  return (
    <div className="select-none">
      {item.type === 'directory' ? (
        <div>
          <div
            className="flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-colors duration-150"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              paddingLeft: `${level * 1.25 + 0.5}rem`,
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--goon-border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="mr-1.5" style={{ color: 'var(--goon-text-dim)' }}>
              {isOpen ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </span>
            <span className="mr-1.5" style={{ color: '#bb9af7' }}>
              {isOpen ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
            </span>
            <span className="font-medium text-sm" style={{ color: '#bb9af7' }}>{item.name}</span>
          </div>
          {isOpen && hasChildren && (
            <div>
              {item.children!.map((child, index) => (
                <TreeNode key={index} item={child} level={level + 1} onNoteClick={onNoteClick} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link
          href={`/notes/${item.path}`}
          className="flex items-center py-1.5 px-2 rounded-lg transition-colors duration-150"
          style={{
            paddingLeft: `${level * 1.25 + 0.5}rem`,
            color: 'var(--goon-text)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--goon-border)';
            e.currentTarget.style.color = '#7dcfff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--goon-text)';
          }}
          onClick={onNoteClick}
        >
          <span className="mr-1.5" style={{ color: 'var(--goon-text-dim)' }}><IconFile size={13} /></span>
          <span className="text-sm">{item.name}</span>
        </Link>
      )}
    </div>
  );
}

export default function NotesSidebar({ tree }: { tree: NoteTreeItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-[4.25rem] right-4 z-30 p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--goon-surface)',
          border: '1px solid var(--goon-border)',
          color: 'var(--goon-text)',
        }}
        aria-label="Toggle navigation"
      >
        {isOpen ? <IconX size={18} /> : <IconLayoutSidebar size={18} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-14 bg-black/60 z-30"
          onClick={closeSidebar}
        />
      )}

      {/* Desktop sidebar — outer div stretches full page height, inner div is sticky */}
      <div
        className="hidden md:block w-64 shrink-0"
        style={{
          backgroundColor: 'var(--goon-surface-dark)',
          borderRight: '1px solid var(--goon-border)',
        }}
      >
        <div
          className="overflow-y-auto p-4 sticky top-0"
          style={{ height: 'calc(100vh - 3.5rem)' }}
        >
          <div className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--goon-border)' }}>
            <Link
              href="/notes"
              className="text-lg font-bold transition-colors"
              style={{ color: 'var(--goon-text)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#7dcfff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--goon-text)'; }}
            >
              Security Notes
            </Link>
          </div>
          <div className="space-y-0.5">
            {tree.map((item, index) => (
              <TreeNode key={index} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Mobile sidebar — fixed overlay */}
      <div className={`
        md:hidden w-64 overflow-y-auto p-4
        fixed top-14 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{
          backgroundColor: 'var(--goon-surface-dark)',
          borderRight: '1px solid var(--goon-border)',
          height: 'calc(100vh - 3.5rem)',
        }}
      >
        <div className="mb-4 pb-4 mt-2" style={{ borderBottom: '1px solid var(--goon-border)' }}>
          <Link
            href="/notes"
            className="text-lg font-bold transition-colors"
            style={{ color: 'var(--goon-text)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#7dcfff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--goon-text)'; }}
            onClick={closeSidebar}
          >
            Security Notes
          </Link>
        </div>
        <div className="space-y-0.5">
          {tree.map((item, index) => (
            <TreeNode key={index} item={item} onNoteClick={closeSidebar} />
          ))}
        </div>
      </div>
    </>
  );
}
