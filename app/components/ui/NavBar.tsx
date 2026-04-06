"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconNotes, IconCode, IconMap, IconMessageCircle, IconTools,
  IconTerminal2, IconMenu2, IconX, IconSun, IconMoon
} from '@tabler/icons-react';
import { useTheme } from '../../../src/context/ThemeContext';

const NAV_ITEMS = [
  { href: '/notes', label: 'Notes', icon: IconNotes, color: '#bb9af7' },
  { href: '/projects', label: 'Projects', icon: IconCode, color: '#7dcfff' },
  { href: '/goon-hub', label: 'Sitemap', icon: IconMap, color: '#9ece6a' },
  { href: '/message-board', label: 'Messages', icon: IconMessageCircle, color: '#e0af68' },
];

const TOOL_ITEMS = [
  { href: '/tools/encode', label: 'Encode/Hash', color: '#9ece6a' },
  { href: '/tools/jwt', label: 'JWT Debugger', color: '#bb9af7' },
  { href: '/tools/headers', label: 'Header Analyzer', color: '#7dcfff' },
];

export default function NavBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toolsBtnRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMobileOpen(false);
    setToolsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const isToolsActive = TOOL_ITEMS.some(t => isActive(t.href));

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50"
        style={{ backgroundColor: 'transparent' }}
      >
        {/* Visual backdrop — absolute so Safari doesn't sample it for toolbar tinting */}
        <div
          className="absolute inset-0 transition-all duration-300"
          style={{
            backgroundColor: scrolled ? 'var(--goon-nav-bg-scrolled)' : 'var(--goon-nav-bg)',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
            borderBottom: scrolled ? '1px solid var(--goon-border)' : '1px solid transparent',
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group shrink-0">
              <IconTerminal2 size={20} className="text-[#bb9af7] group-hover:text-[#7dcfff] transition-colors" />
              <span className="font-mono font-bold text-sm tracking-tight" style={{
                background: 'linear-gradient(135deg, #bb9af7, #7dcfff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                goonsite
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive(item.href) ? item.color : 'var(--goon-text-dim)',
                    backgroundColor: isActive(item.href) ? `${item.color}10` : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.color = 'var(--goon-text)';
                      e.currentTarget.style.backgroundColor = 'var(--goon-border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(item.href)) {
                      e.currentTarget.style.color = 'var(--goon-text-dim)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <item.icon size={15} />
                  <span>{item.label}</span>
                  {isActive(item.href) && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              ))}

              {/* Tools Dropdown */}
              <div
                ref={toolsBtnRef}
                className="relative"
                onMouseEnter={() => {
                  if (toolsBtnRef.current) {
                    const rect = toolsBtnRef.current.getBoundingClientRect();
                    setDropdownPos({ top: rect.bottom + 4, left: rect.right - 208 });
                  }
                  setToolsOpen(true);
                }}
                onMouseLeave={() => setToolsOpen(false)}
              >
                <Link
                  href="/tools/encode"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                  style={{
                    color: isToolsActive ? '#f7768e' : 'var(--goon-text-dim)',
                    backgroundColor: isToolsActive ? 'rgba(247,118,142,0.06)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isToolsActive) {
                      e.currentTarget.style.color = 'var(--goon-text)';
                      e.currentTarget.style.backgroundColor = 'var(--goon-border)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isToolsActive) {
                      e.currentTarget.style.color = 'var(--goon-text-dim)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={(e) => { e.preventDefault(); setToolsOpen(!toolsOpen); }}
                >
                  <IconTools size={15} />
                  <span>Tools</span>
                </Link>

                <AnimatePresence>
                  {toolsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.12 }}
                      className="dropdown-portal"
                      style={{
                        position: 'fixed',
                        top: `${dropdownPos.top}px`,
                        left: `${Math.max(8, dropdownPos.left)}px`,
                        zIndex: 9999,
                        width: '13rem',
                        borderRadius: '12px',
                        overflow: 'visible',
                        backgroundColor: 'var(--goon-surface)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid var(--goon-border)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--goon-border)',
                        maxWidth: 'none',
                      }}
                    >
                      <div className="py-1">
                        {TOOL_ITEMS.map(tool => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            className="flex items-center px-4 py-2.5 text-sm transition-colors"
                            style={{
                              color: isActive(tool.href) ? tool.color : 'var(--goon-text)',
                              backgroundColor: isActive(tool.href) ? `${tool.color}10` : 'transparent',
                              maxWidth: 'none',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--goon-border)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isActive(tool.href) ? `${tool.color}10` : 'transparent'; }}
                            onClick={() => setToolsOpen(false)}
                          >
                            {tool.label}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Status indicator + Theme toggle */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg transition-colors duration-200"
                style={{
                  color: 'var(--goon-text-dim)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--goon-text)';
                  e.currentTarget.style.backgroundColor = 'var(--goon-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--goon-text-dim)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
              </button>
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-[#9ece6a]" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-[#9ece6a] animate-ping opacity-40" />
              </div>
              <span className="text-[10px] font-mono" style={{ color: 'var(--goon-text-dim)' }}>online</span>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: 'var(--goon-text)' }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <IconX size={20} /> : <IconMenu2 size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ backgroundColor: 'var(--goon-overlay)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 p-6 md:hidden overflow-y-auto"
              style={{
                backgroundColor: 'var(--goon-surface)',
                borderLeft: '1px solid var(--goon-border)',
                paddingBottom: 'calc(3rem + env(safe-area-inset-bottom, 0px))',
              }}
            >
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg transition-colors"
                  style={{ color: 'var(--goon-text-dim)' }}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
                </button>
                <button
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--goon-text)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="mt-12 space-y-1">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      color: isActive(item.href) ? item.color : 'var(--goon-text)',
                      backgroundColor: isActive(item.href) ? `${item.color}10` : 'transparent',
                    }}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}

                <div className="pt-2 pb-1 px-4">
                  <span className="text-xs font-mono text-[#565f89] uppercase tracking-wider">Tools</span>
                </div>
                {TOOL_ITEMS.map(tool => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors pl-8"
                    style={{
                      color: isActive(tool.href) ? tool.color : 'var(--goon-text)',
                      backgroundColor: isActive(tool.href) ? `${tool.color}10` : 'transparent',
                    }}
                  >
                    {tool.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
