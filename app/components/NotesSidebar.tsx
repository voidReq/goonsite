'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { NoteTreeItem } from '@/lib/notes';

function TreeNode({ item, level = 0 }: { item: NoteTreeItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasChildren = item.type === 'directory' && item.children && item.children.length > 0;
  
  return (
    <div className="select-none">
      {item.type === 'directory' ? (
        <div>
          <div
            className="flex items-center py-1 px-2 hover:bg-gray-800 rounded cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          >
            <span className="mr-2 text-gray-400 text-xs">
              {isOpen ? '▼' : '▶'}
            </span>
            <span className="text-blue-400 font-semibold text-sm">{item.name}</span>
          </div>
          {isOpen && hasChildren && (
            <div>
              {item.children!.map((child, index) => (
                <TreeNode key={index} item={child} level={level + 1} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link 
          href={`/notes/${item.path.split('/').map(s => encodeURIComponent(s)).join('/')}`}
          className="flex items-center py-1 px-2 hover:bg-gray-800 rounded transition-colors"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        >
          <span className="text-gray-200 hover:text-white text-sm">{item.name}</span>
        </Link>
      )}
    </div>
  );
}

export default function NotesSidebar({ tree }: { tree: NoteTreeItem[] }) {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen overflow-y-auto sticky top-0 p-4">
      <div className="mb-4 pb-4 border-b border-gray-800">
        <Link href="/" className="block text-gray-400 hover:text-white transition-colors text-sm mb-3">
          ← Home
        </Link>
        <Link href="/notes" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">
          Notes
        </Link>
      </div>
      <div className="space-y-1">
        {tree.map((item, index) => (
          <TreeNode key={index} item={item} />
        ))}
      </div>
    </div>
  );
}
