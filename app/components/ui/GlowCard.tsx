"use client";

import { useState, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlowCardProps {
  children: ReactNode;
  color?: string;
  className?: string;
  onClick?: () => void;
}

export default function GlowCard({ children, color = '#bb9af7', className = '', onClick }: GlowCardProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-xl overflow-hidden cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        border: '1px solid var(--goon-border)',
        backgroundColor: 'var(--goon-surface)',
      }}
    >
      {/* Glow effect following mouse */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            opacity: 0.15,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${color}, transparent 50%)`,
          }}
        />
      )}
      {/* Border glow */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          border: `1px solid ${color}30`,
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
