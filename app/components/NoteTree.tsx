'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { NoteTreeItem } from '@/lib/notes';

function TreeNode({ item, level = 0 }: { item: NoteTreeItem; level?: number }) {
  const [isOpen, setIsOpen] = useState(level === 0);
  
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
            <span className="mr-2 text-gray-400">
              {isOpen ? '▼' : '▶'}
            </span>
            <span className="text-blue-400 font-semibold">{item.name}</span>
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
          <span className="mr-2 text-gray-500">📄</span>
          <span className="text-gray-200 hover:text-white">{item.name}</span>
        </Link>
      )}
    </div>
  );
}

export default function NoteTree({ tree }: { tree: NoteTreeItem[] }) {
  return (
    <>
      {tree.map((item, index) => (
        <TreeNode key={index} item={item} />
      ))}
    </>
  );
}
