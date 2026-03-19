'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { ProjectTreeItem } from '@/lib/projects';
import { IconChevronRight, IconChevronDown, IconFile, IconFolder, IconFolderOpen, IconLayoutSidebar, IconX } from '@tabler/icons-react';

function TreeNode({
  item,
  level = 0,
  onProjectClick
}: {
  item: ProjectTreeItem;
  level?: number;
  onProjectClick?: () => void;
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
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="mr-1.5" style={{ color: '#565f89' }}>
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
                <TreeNode key={index} item={child} level={level + 1} onProjectClick={onProjectClick} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link
          href={`/projects/${item.path}`}
          className="flex items-center py-1.5 px-2 rounded-lg transition-colors duration-150"
          style={{
            paddingLeft: `${level * 1.25 + 0.5}rem`,
            color: '#c0caf5',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color = '#7dcfff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#c0caf5';
          }}
          onClick={onProjectClick}
        >
          <span className="mr-1.5" style={{ color: '#565f89' }}><IconFile size={13} /></span>
          <span className="text-sm">{item.name}</span>
        </Link>
      )}
    </div>
  );
}

export default function ProjectsSidebar({ tree }: { tree: ProjectTreeItem[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-[4.25rem] right-4 z-50 p-2 rounded-lg transition-colors"
        style={{
          backgroundColor: '#1a1b26',
          border: '1px solid rgba(255,255,255,0.06)',
          color: '#c0caf5',
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

      {/* Sidebar */}
      <div className={`
        w-64 overflow-y-auto p-4
        fixed md:sticky top-14 md:top-0 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
        style={{
          backgroundColor: '#16161e',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          height: 'calc(100vh - 3.5rem)',
        }}
      >
        <div className="mb-4 pb-4 mt-2 md:mt-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link
            href="/projects"
            className="text-lg font-bold transition-colors"
            style={{ color: '#c0caf5' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#7dcfff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#c0caf5'; }}
            onClick={closeSidebar}
          >
            Projects & Writeups
          </Link>
        </div>
        <div className="space-y-0.5">
          {tree.map((item, index) => (
            <TreeNode key={index} item={item} onProjectClick={closeSidebar} />
          ))}
        </div>
      </div>
    </>
  );
}
