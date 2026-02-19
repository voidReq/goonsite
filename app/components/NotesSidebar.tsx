'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { NoteTreeItem } from '@/lib/notes';

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
                <TreeNode key={index} item={child} level={level + 1} onNoteClick={onNoteClick} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <Link 
          href={`/notes/${item.path.split('/').map(s => encodeURIComponent(s)).join('/')}`}
          className="flex items-center py-1 px-2 hover:bg-gray-800 rounded transition-colors"
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={onNoteClick}
        >
          <span className="text-gray-200 hover:text-white text-sm">{item.name}</span>
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
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition-colors"
        aria-label="Toggle navigation"
      >
        <svg 
          className="w-6 h-6 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        w-64 bg-gray-900 border-r border-gray-800 h-screen overflow-y-auto p-4
        fixed md:sticky top-0 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="mb-4 pb-4 border-b border-gray-800 mt-12 md:mt-0">
          <Link 
            href="/" 
            className="block text-gray-400 hover:text-white transition-colors text-sm mb-3"
            onClick={closeSidebar}
          >
            ← Home
          </Link>
          <Link 
            href="/notes" 
            className="text-xl font-bold text-white hover:text-blue-400 transition-colors"
            onClick={closeSidebar}
          >
            Notes
          </Link>
        </div>
        <div className="space-y-1">
          {tree.map((item, index) => (
            <TreeNode key={index} item={item} onNoteClick={closeSidebar} />
          ))}
        </div>
      </div>
    </>
  );
}
