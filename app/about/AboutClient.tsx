'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  IconUser,
  IconBriefcase,
  IconCode,
  IconBug,
  IconSchool,
  IconCpu,
  IconNotes,
  IconSparkles,
  IconChevronDown,
  IconExternalLink,
  IconArrowRight,
  IconMapPin,
  IconBrandLinkedin,
  IconBrandGithub,
  IconWorld,
  IconCertificate,
  IconChevronsDown,
  IconChevronsUp,
} from '@tabler/icons-react';

export interface AboutItem {
  name: string;
  href: string;
  desc?: string;
  external?: boolean;
}

const externalProps = { target: '_blank', rel: 'noopener noreferrer' };

interface FoldableSectionProps {
  id: string;
  title: string;
  badge?: string;
  icon: typeof IconUser;
  color: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function FoldableSection({
  id,
  title,
  badge,
  icon: Icon,
  color,
  isOpen,
  onToggle,
  children,
}: FoldableSectionProps) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-colors"
      style={{
        border: '1px solid var(--site-border)',
        backgroundColor: 'var(--site-surface)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`section-panel-${id}`}
        className="w-full text-left p-4 md:p-5 flex items-center gap-3 transition-colors hover:bg-white/[0.02] cursor-pointer select-none"
      >
        <div
          className="p-2 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>

        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-mono text-base md:text-lg font-bold" style={{ color: 'var(--site-text)' }}>
            {title}
          </span>
          {badge && (
            <span
              className="text-xs font-mono px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${color}15`,
                color,
                border: `1px solid ${color}30`,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <div className="flex-1 h-px mx-2 hidden sm:block" style={{ backgroundColor: `${color}20` }} />

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-auto"
        >
          <IconChevronDown size={18} style={{ color: 'var(--site-text-dim)' }} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`section-panel-${id}`}
            role="region"
            aria-label={title}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className="p-4 md:p-6 pt-0 space-y-6"
              style={{ borderTop: '1px solid var(--site-border)' }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Tag({ label, color = 'var(--site-cyan)' }: { label: string; color?: string }) {
  return (
    <span
      className="text-xs font-mono px-2 py-0.5 rounded-md"
      style={{
        backgroundColor: `${color}10`,
        color,
        border: `1px solid ${color}25`,
      }}
    >
      {label}
    </span>
  );
}

export default function AboutClient({
  builds = [],
  writeups = [],
  topics = [],
}: {
  builds?: AboutItem[];
  writeups?: AboutItem[];
  topics?: string[];
}) {
  const sectionKeys = ['experience', 'projects', 'education', 'skills', 'notes', 'interests'];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    experience: true,
    projects: true,
    education: true,
    skills: true,
    notes: true,
    interests: true,
  });

  const allOpen = sectionKeys.every((k) => openSections[k]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAll = () => {
    const nextState = !allOpen;
    const updated: Record<string, boolean> = {};
    for (const key of sectionKeys) {
      updated[key] = nextState;
    }
    setOpenSections(updated);
  };

  return (
    <div className="relative min-h-[calc(100dvh-3.5rem)] overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 mesh-gradient-purple pointer-events-none" />
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 scanline-overlay pointer-events-none" />

      <div
        className="orb"
        style={{
          width: 350,
          height: 350,
          background: '#e0af68',
          top: '-5%',
          right: '-5%',
          animationDelay: '-3s',
        }}
      />
      <div
        className="orb"
        style={{
          width: 250,
          height: 250,
          background: '#bb9af7',
          bottom: '10%',
          left: '-5%',
          animationDelay: '-10s',
        }}
      />

      {/* Main Content Column */}
      <div className="relative z-10 p-4 md:p-8 mx-auto" style={{ maxWidth: '58rem' }}>
        {/* Intro & Resume Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Terminal Path Header */}
          <div className="flex items-center gap-2 mb-3 font-mono text-xs" style={{ color: 'var(--site-text-dim)' }}>
            <span style={{ color: 'var(--site-purple)' }}>guest@6A68</span>
            <span>:</span>
            <span style={{ color: 'var(--site-cyan)' }}>~/about</span>
            <span style={{ color: 'var(--site-amber)' }}>$</span>
            <span>cat resume.md</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b" style={{ borderColor: 'var(--site-border)' }}>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-mono tracking-tight" style={{ color: 'var(--site-text)' }}>
                James Hanstedt
              </h1>
              <p className="text-sm font-mono mt-1" style={{ color: 'var(--site-cyan)' }}>
                Electrical &amp; Computer Engineering @ Northeastern University
              </p>
            </div>

            {/* Links / Contact (omitting phone and email) */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--site-border)',
                  color: 'var(--site-text-dim)',
                }}
              >
                <IconMapPin size={14} style={{ color: 'var(--site-amber)' }} />
                Boston, MA
              </span>
              <a
                href="https://linkedin.com/in/james-hanstedt/"
                {...externalProps}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:border-cyan-400"
                style={{
                  backgroundColor: 'rgba(125, 207, 255, 0.06)',
                  border: '1px solid rgba(125, 207, 255, 0.2)',
                  color: 'var(--site-cyan)',
                  textDecoration: 'none',
                }}
              >
                <IconBrandLinkedin size={14} />
                LinkedIn
                <IconExternalLink size={12} />
              </a>
              <a
                href="https://github.com/voidReq"
                {...externalProps}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:border-purple-400"
                style={{
                  backgroundColor: 'rgba(187, 154, 247, 0.06)',
                  border: '1px solid rgba(187, 154, 247, 0.2)',
                  color: 'var(--site-purple)',
                  textDecoration: 'none',
                }}
              >
                <IconBrandGithub size={14} />
                GitHub
                <IconExternalLink size={12} />
              </a>
              <Link
                href="/"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors hover:border-amber-400"
                style={{
                  backgroundColor: 'rgba(224, 175, 104, 0.06)',
                  border: '1px solid rgba(224, 175, 104, 0.2)',
                  color: 'var(--site-amber)',
                  textDecoration: 'none',
                }}
              >
                <IconWorld size={14} />
                6A68.dev
              </Link>
            </div>
          </div>

          {/* Quick Intro Paragraph */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm md:text-base leading-relaxed" style={{ color: 'var(--site-text)' }}>
              Electrical &amp; Computer Engineering student at Northeastern University with a focus on offensive security research, embedded systems, and full-stack software development. Welcome to my interactive resume and digital garden.
            </p>
            <button
              type="button"
              onClick={toggleAll}
              className="shrink-0 self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all hover:bg-white/[0.05] cursor-pointer"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--site-border)',
                color: 'var(--site-cyan)',
              }}
            >
              {allOpen ? (
                <>
                  <IconChevronsUp size={14} />
                  Collapse All
                </>
              ) : (
                <>
                  <IconChevronsDown size={14} />
                  Expand All
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Foldable Resume Sections */}
        <div className="space-y-4">
          {/* SECTION: EXPERIENCE */}
          <FoldableSection
            id="experience"
            title="Experience"
            badge="4 roles"
            icon={IconBriefcase}
            color="#7dcfff"
            isOpen={openSections.experience}
            onToggle={() => toggleSection('experience')}
          >
            {/* 1. Confluence */}
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                    Confluence
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    pre-launch
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                    • Co-founder / Full-Stack Developer
                  </span>
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                  July 2026 – Present | Remote
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm mt-3 ml-1" style={{ color: 'var(--site-text)' }}>
                <li>
                  Architecting frontend and backend of a high-throughput trading platform utilizing Next.js/React, FastAPI, Supabase (PostgreSQL), and Redis.
                </li>
                <li>
                  Deploying a multi-service cloud architecture on Oracle Cloud (Ubuntu) with automated CI/CD pipelines enforcing linting, testing, and containerized deployment gates.
                </li>
                <li>
                  Designing and implementing shared schemas, typed API contracts, and event streams connecting the web interface, backend microservices, and execution engine.
                </li>
                <li>
                  Hardening platform security posture: PostgreSQL Row-Level Security (RLS) policies, rigorous input sanitization, JWT validation, and ongoing defensive penetration testing.
                </li>
              </ul>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Next.js', 'React', 'FastAPI', 'Python', 'Supabase', 'PostgreSQL', 'Redis', 'Oracle Cloud', 'CI/CD', 'Penetration Testing'].map((t) => (
                  <Tag key={t} label={t} color="#7dcfff" />
                ))}
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

            {/* 2. Freelance Security Researcher */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                    Freelance Security Researcher
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                    • Self-Taught Analyst
                  </span>
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                  Dec 2024 – Present | Remote
                </span>
              </div>
              <ul className="list-disc list-inside space-y-2 text-xs md:text-sm mt-3 ml-1" style={{ color: 'var(--site-text)' }}>
                <li>
                  Responsibly disclosed 12+ security vulnerabilities to companies and startups as an independent security analyst.
                </li>
                <li>
                  <strong style={{ color: 'var(--site-text)' }}>DoorList</strong> (Social platform active at 250+ universities): Reported 10+ vulnerabilities (multiple critical and high severity) directly to executive leadership, including PII leaks and authorization bypasses affecting 400k+ students.
                </li>
                <li>
                  <strong style={{ color: 'var(--site-text)' }}>Undisclosed Website</strong> (~100k accounts, 2,000+ paying): Discovered and reported a critical Insecure Direct Object Reference (IDOR) and backend leak that exposed sensitive user records (names, addresses, emails, partial credit card information).
                  <div className="mt-1.5 pl-4">
                    <Link
                      href="/projects/writeups/critical-idor-pii-exposure"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors"
                      style={{
                        backgroundColor: 'rgba(158, 206, 106, 0.1)',
                        border: '1px solid rgba(158, 206, 106, 0.3)',
                        color: 'var(--site-green)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBug size={13} />
                      Read Writeup: Critical IDOR PII Exposure
                      <IconArrowRight size={13} />
                    </Link>
                  </div>
                </li>
                <li>
                  <strong style={{ color: 'var(--site-text)' }}>Undisclosed Company</strong> (~40k monthly organic visitors): Identified a stored Cross-Site Scripting (XSS) vulnerability; bypassed character filters blocking equals signs by deploying WebSockets to exfiltrate session cookies past CORS boundaries.
                  <div className="mt-1.5 pl-4">
                    <Link
                      href="/projects/writeups/critical-xss"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors"
                      style={{
                        backgroundColor: 'rgba(158, 206, 106, 0.1)',
                        border: '1px solid rgba(158, 206, 106, 0.3)',
                        color: 'var(--site-green)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBug size={13} />
                      Read Writeup: Critical Stored XSS &amp; Cookie Exfiltration
                      <IconArrowRight size={13} />
                    </Link>
                  </div>
                </li>
              </ul>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Burp Suite', 'Caido', 'Penetration Testing', 'IDOR', 'Stored XSS', 'WebSockets', 'Responsible Disclosure'].map((t) => (
                  <Tag key={t} label={t} color="#9ece6a" />
                ))}
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

            {/* 3. FRC Robotics Team 2530 */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                    FRC Robotics Team 2530
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                    • Team Captain &amp; Programming Lead
                  </span>
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                  Sep 2023 – May 2025 | Rochester, MN
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm mt-3 ml-1" style={{ color: 'var(--site-text)' }}>
                <li>
                  Led a 40+ member competitive robotics engineering team across programming, electrical wiring, mechanical prototyping, and tournament scouting operations.
                </li>
                <li>
                  Aided in 2x FIRST Robotics World Championship qualifications through contributions to swerve drive odometry, robotic controls, and autonomous path planning (Java/Python).
                </li>
                <li>
                  Engineered custom quantitative scouting and match-prediction software to analyze team metrics and optimize alliance drafting strategies during championship events.
                </li>
              </ul>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Java', 'Python', 'WPILib', 'Robotics Controls', 'Swerve Odometry', 'Data Aggregation', 'Leadership'].map((t) => (
                  <Tag key={t} label={t} color="#e0af68" />
                ))}
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

            {/* 4. Virginia Military Institute */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                    Virginia Military Institute (CCI Internship)
                  </span>
                  <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                    • Hardware/Software Engineer Intern
                  </span>
                </div>
                <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                  Mar – May 2023 | Lexington, VA
                </span>
              </div>
              <ul className="list-disc list-inside space-y-1.5 text-xs md:text-sm mt-3 ml-1" style={{ color: 'var(--site-text)' }}>
                <li>
                  Engineered an IoT-based smart grid cybersecurity simulation testbed and wired hardware for power distribution testbeds during a Commonwealth Cyber Initiative (CCI) internship.
                </li>
                <li>
                  Constructed cyber-physical testing hardware using ESP8266 microcontrollers, INA219 power monitors, relays, and solar/hydro generation models communicating over MQTT.
                </li>
                <li>
                  Demonstrated supervisory control and remote actuation attack vectors against critical power infrastructure.
                  <div className="mt-1.5 pl-4 flex flex-wrap gap-2">
                    <Link
                      href="/projects/projects/miscellaneous/smartgrid-iot"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors"
                      style={{
                        backgroundColor: 'rgba(125, 207, 255, 0.1)',
                        border: '1px solid rgba(125, 207, 255, 0.3)',
                        color: 'var(--site-cyan)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconCode size={13} />
                      View Project: SmartGrid IoT
                      <IconArrowRight size={13} />
                    </Link>
                    <a
                      href="https://github.com/voidReq/SmartGrid_IoT"
                      {...externalProps}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-colors"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--site-border)',
                        color: 'var(--site-text)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandGithub size={13} />
                      GitHub Repo
                      <IconExternalLink size={12} />
                    </a>
                  </div>
                </li>
              </ul>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {['Arduino', 'C++', 'ESP8266', 'MQTT', 'INA219 Sensors', 'IoT Security', 'Hardware Prototyping'].map((t) => (
                  <Tag key={t} label={t} color="#7dcfff" />
                ))}
              </div>
            </div>
          </FoldableSection>

          {/* SECTION: PROJECTS & WRITEUPS */}
          <FoldableSection
            id="projects"
            title="Projects &amp; Writeups"
            badge="7 items"
            icon={IconCode}
            color="#e0af68"
            isOpen={openSections.projects}
            onToggle={() => toggleSection('projects')}
          >
            <div className="space-y-6 pt-2">
              {/* 1. Personal Website */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                      Personal Website (6A68.dev / goonsite.org)
                    </span>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(224, 175, 104, 0.1)',
                        border: '1px solid rgba(224, 175, 104, 0.3)',
                        color: 'var(--site-amber)',
                        textDecoration: 'none',
                      }}
                    >
                      Visit Site
                    </Link>
                    <a
                      href="https://github.com/voidReq/6A68"
                      {...externalProps}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--site-border)',
                        color: 'var(--site-text-dim)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandGithub size={12} />
                      Source
                      <IconExternalLink size={11} />
                    </a>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Jan 2025 – Present
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: 'var(--site-text)' }}>
                  Full-stack personal website and portfolio with dual-persona architecture: the clean, professional <span className="font-mono text-xs text-amber-300">6A68.dev</span> view and the interactive hacker console <span className="font-mono text-xs text-cyan-300">goonsite.org</span>. Includes custom visitor geo-IP tracking telemetry, an interactive sitemap terminal emulator supporting full shell navigation (<code className="font-mono text-xs">cd</code>, <code className="font-mono text-xs">ls</code>, <code className="font-mono text-xs">tree</code>), and Obsidian markdown notes synchronization.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Three.js / Fiber', 'APIs', 'Git'].map((t) => (
                    <Tag key={t} label={t} color="#e0af68" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              {/* 2. NUauto */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                      NUauto
                    </span>
                    <a
                      href="https://github.com/voidReq/NUauto/blob/main/README.md"
                      {...externalProps}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(125, 207, 255, 0.1)',
                        border: '1px solid rgba(125, 207, 255, 0.3)',
                        color: 'var(--site-cyan)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandGithub size={12} />
                      NUauto README
                      <IconExternalLink size={11} />
                    </a>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    2026
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: 'var(--site-text)' }}>
                  Automated co-op search and submission assistant tailored for Northeastern University students. Scrapes NUworks job listings, cross-references qualification requirements against candidate resumes, and automates submission for student-approved positions.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['Python', 'Web Automation', 'Scraping', 'CLI'].map((t) => (
                    <Tag key={t} label={t} color="#7dcfff" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              {/* 3. Discord Remote Access */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                      Discord Remote Access
                    </span>
                    <Link
                      href="/projects/projects/security/discord-remote-access"
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(247, 118, 142, 0.1)',
                        border: '1px solid rgba(247, 118, 142, 0.3)',
                        color: 'var(--site-red)',
                        textDecoration: 'none',
                      }}
                    >
                      View Project Page
                      <IconArrowRight size={11} />
                    </Link>
                    <a
                      href="https://github.com/voidReq/discordRemoteAccess"
                      {...externalProps}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--site-border)',
                        color: 'var(--site-text-dim)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandGithub size={12} />
                      Source
                      <IconExternalLink size={11} />
                    </a>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    2025
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: 'var(--site-text)' }}>
                  Proof-of-concept remote access tool written in pure C for educational security research. Repurposes the Discord Bot API (WebSocket + REST) as an encrypted covert command-and-control (C2) channel, illustrating how legitimate communication platforms can be abused to bypass perimeter firewall egress restrictions.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['C', 'Windows API', 'Discord Bot API', 'WebSockets', 'Covert C2', 'Security Research'].map((t) => (
                    <Tag key={t} label={t} color="#f7768e" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              {/* 4. T-Watch Evil Portal */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                      T-Watch Evil Portal
                    </span>
                    <Link
                      href="/projects/projects/security/t-watch-evil-portal"
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(247, 118, 142, 0.1)',
                        border: '1px solid rgba(247, 118, 142, 0.3)',
                        color: 'var(--site-red)',
                        textDecoration: 'none',
                      }}
                    >
                      View Project Page
                      <IconArrowRight size={11} />
                    </Link>
                    <a
                      href="https://github.com/voidReq/T-Watch_Evil_Portal"
                      {...externalProps}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--site-border)',
                        color: 'var(--site-text-dim)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandGithub size={12} />
                      Source
                      <IconExternalLink size={11} />
                    </a>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Aug 2025
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: 'var(--site-text)' }}>
                  Captive portal phishing framework engineered for the ESP32-based LILYGO T-Watch S3 wearable smartwatch. Spawns configurable rogue WiFi access points, intercepts DNS queries for captive portal auto-detection, serves spoofed credential landing pages, and logs harvested credentials locally.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['C++', 'ESP32', 'Arduino / PlatformIO', 'HTML/CSS', 'Wearable Hacking', 'Wireless Security'].map((t) => (
                    <Tag key={t} label={t} color="#f7768e" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              {/* 5. Revolutions */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                      Revolutions | Calculus II Visualizer
                    </span>
                    <Link
                      href="/projects/projects/miscellaneous/revolutions"
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(187, 154, 247, 0.1)',
                        border: '1px solid rgba(187, 154, 247, 0.3)',
                        color: 'var(--site-purple)',
                        textDecoration: 'none',
                      }}
                    >
                      View Project Page
                      <IconArrowRight size={11} />
                    </Link>
                    <a
                      href="https://github.com/voidReq/revolutions"
                      {...externalProps}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--site-border)',
                        color: 'var(--site-text-dim)',
                        textDecoration: 'none',
                      }}
                    >
                      <IconBrandGithub size={12} />
                      Source
                      <IconExternalLink size={11} />
                    </a>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Mar 2025
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: 'var(--site-text)' }}>
                  3D mathematical software visualizing rotations of non-polynomial functions about arbitrary linear axes. Uses NumPy for parametric curve sampling and rotational transformations, rendered interactively with Matplotlib surface plotting.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['Python', 'NumPy', 'Matplotlib', '3D Graphics', 'Calculus'].map((t) => (
                    <Tag key={t} label={t} color="#bb9af7" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              {/* 6. Homelab */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: 'var(--site-text)' }}>
                      Homelab Infrastructure
                    </span>
                  </div>
                  <span className="text-xs font-mono shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Jan 2025 – Present
                  </span>
                </div>
                <p className="text-xs md:text-sm mt-2 leading-relaxed" style={{ color: 'var(--site-text)' }}>
                  Assembled a hybrid homelab linking a Raspberry Pi 5 and repurposed x86 hardware running Ubuntu and Raspberry Pi OS. Configured an encrypted Tailscale mesh network (Tailnet) for remote access, hosting automation services, DNS filtering, and private development sandbox environments.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {['Linux', 'Ubuntu', 'Raspberry Pi OS', 'Tailscale', 'Networking', 'Automation'].map((t) => (
                    <Tag key={t} label={t} color="#7dcfff" />
                  ))}
                </div>
              </div>
            </div>
          </FoldableSection>

          {/* SECTION: EDUCATION */}
          <FoldableSection
            id="education"
            title="Education"
            badge="GPA 4.0 / 4.0"
            icon={IconSchool}
            color="#bb9af7"
            isOpen={openSections.education}
            onToggle={() => toggleSection('education')}
          >
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div>
                  <h3 className="font-mono text-base md:text-lg font-bold" style={{ color: 'var(--site-text)' }}>
                    Northeastern University
                  </h3>
                  <p className="text-xs md:text-sm font-mono mt-0.5" style={{ color: 'var(--site-cyan)' }}>
                    Candidate for B.S. in Electrical and Computer Engineering, Minor in Mathematics
                  </p>
                </div>
                <div className="sm:text-right shrink-0">
                  <span className="text-xs font-mono block" style={{ color: 'var(--site-text-dim)' }}>
                    Expected May 2029
                  </span>
                  <span className="text-xs font-mono block" style={{ color: 'var(--site-text-dim)' }}>
                    Boston, MA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 my-3">
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/25">
                  GPA: 4.0 / 4.0
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                  Dean’s List
                </span>
              </div>

              <div className="mt-3">
                <span className="text-xs font-mono font-semibold block mb-2" style={{ color: 'var(--site-text)' }}>
                  Relevant Coursework:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Embedded Design',
                    'Program Design (CS 2500 / CS 2510)',
                    'Relational Databases (CS 3200)',
                    'Calculus 3 (Multivariable)',
                    'Linear Algebra & Differential Equations',
                  ].map((c) => (
                    <span
                      key={c}
                      className="text-xs font-mono px-2.5 py-1 rounded"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--site-border)',
                        color: 'var(--site-text)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2" style={{ borderColor: 'var(--site-border)' }}>
                <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                  Study notes synced from my Obsidian vault:
                </span>
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded transition-colors"
                  style={{
                    backgroundColor: 'rgba(187, 154, 247, 0.1)',
                    border: '1px solid rgba(187, 154, 247, 0.25)',
                    color: 'var(--site-purple)',
                    textDecoration: 'none',
                  }}
                >
                  <IconNotes size={13} />
                  Browse Notes
                  <IconArrowRight size={12} />
                </Link>
              </div>
            </div>
          </FoldableSection>

          {/* SECTION: TECHNICAL SKILLS & TOOLS */}
          <FoldableSection
            id="skills"
            title="Technical Skills &amp; Certifications"
            badge="Tools & Stack"
            icon={IconCpu}
            color="#9ece6a"
            isOpen={openSections.skills}
            onToggle={() => toggleSection('skills')}
          >
            <div className="space-y-4 pt-2">
              <div>
                <span className="text-xs font-mono font-semibold block mb-2" style={{ color: 'var(--site-green)' }}>
                  Technical Skills &amp; Languages
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Penetration Testing',
                    'Python',
                    'Java',
                    'C/C++',
                    'Bash',
                    'TypeScript',
                    'JavaScript',
                    'SQL',
                    'Next.js / React',
                    'FastAPI',
                    'Embedded Systems',
                    'Computer Networking',
                    'CI/CD Pipelines',
                    'Row-Level Security (RLS)',
                  ].map((s) => (
                    <Tag key={s} label={s} color="#9ece6a" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              <div>
                <span className="text-xs font-mono font-semibold block mb-2" style={{ color: 'var(--site-cyan)' }}>
                  Tools, Hardware &amp; Platforms
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Burp Suite',
                    'Caido',
                    'Nmap',
                    'Wireshark',
                    'Git',
                    'Linux (Ubuntu, Debian, Pi OS)',
                    'Neovim',
                    'Claude Code',
                    'Oracle Cloud',
                    'Supabase',
                    'Redis',
                    'Raspberry Pi',
                    'ESP32 / ESP8266',
                    'Flipper Zero',
                  ].map((t) => (
                    <Tag key={t} label={t} color="#7dcfff" />
                  ))}
                </div>
              </div>

              <div className="h-px" style={{ backgroundColor: 'var(--site-border)' }} />

              <div>
                <span className="text-xs font-mono font-semibold block mb-2" style={{ color: 'var(--site-amber)' }}>
                  Certifications
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    className="p-3 rounded-lg flex items-start gap-2.5"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--site-border)',
                    }}
                  >
                    <IconCertificate size={16} style={{ color: 'var(--site-amber)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <span className="text-xs font-mono font-bold block" style={{ color: 'var(--site-text)' }}>
                        MTA: Security Fundamentals
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                        Microsoft • 2022
                      </span>
                    </div>
                  </div>
                  <div
                    className="p-3 rounded-lg flex items-start gap-2.5"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--site-border)',
                    }}
                  >
                    <IconCertificate size={16} style={{ color: 'var(--site-amber)', marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <span className="text-xs font-mono font-bold block" style={{ color: 'var(--site-text)' }}>
                        MTA: Introduction to Programming Using Python
                      </span>
                      <span className="text-xs font-mono" style={{ color: 'var(--site-text-dim)' }}>
                        Microsoft • 2022
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FoldableSection>

          {/* SECTION: DIGITAL GARDEN & NOTES */}
          <FoldableSection
            id="notes"
            title="Notes &amp; Digital Garden"
            badge="Obsidian Synced"
            icon={IconNotes}
            color="#bb9af7"
            isOpen={openSections.notes}
            onToggle={() => toggleSection('notes')}
          >
            <div className="pt-2">
              <p className="text-xs md:text-sm leading-relaxed mb-3" style={{ color: 'var(--site-text)' }}>
                I maintain an open digital garden synced from my local Obsidian vault to this site. It compiles concepts, architectural references, and cheatsheets across computer science, networking, and security.
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {topics.map((topic) => (
                  <Link
                    key={topic}
                    href="/notes"
                    className="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors hover:border-purple-400"
                    style={{
                      color: 'var(--site-text)',
                      backgroundColor: 'rgba(187, 154, 247, 0.08)',
                      border: '1px solid rgba(187, 154, 247, 0.2)',
                      textDecoration: 'none',
                    }}
                  >
                    {topic}
                  </Link>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t" style={{ borderColor: 'var(--site-border)' }}>
                <Link
                  href="/notes"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                  style={{
                    backgroundColor: 'rgba(187, 154, 247, 0.1)',
                    border: '1px solid rgba(187, 154, 247, 0.3)',
                    color: 'var(--site-purple)',
                    textDecoration: 'none',
                  }}
                >
                  <IconNotes size={14} />
                  Open Notes Viewer
                  <IconArrowRight size={13} />
                </Link>
                <a
                  href="https://github.com/voidReq/notes"
                  {...externalProps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--site-border)',
                    color: 'var(--site-text-dim)',
                    textDecoration: 'none',
                  }}
                >
                  <IconBrandGithub size={14} />
                  github.com/voidReq/notes
                  <IconExternalLink size={12} />
                </a>
              </div>
            </div>
          </FoldableSection>

          {/* SECTION: OTHER INTERESTS */}
          <FoldableSection
            id="interests"
            title="Other Interests"
            badge="Beyond the terminal"
            icon={IconSparkles}
            color="#f7768e"
            isOpen={openSections.interests}
            onToggle={() => toggleSection('interests')}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {[
                { title: 'AR / VR', desc: 'Spatial computing, immersive interfaces, and experimental interaction design' },
                { title: 'Culinary Arts', desc: 'Passionate cook and culinary explorer; experienced part-time sous chef' },
                { title: 'Computer Architecture', desc: 'Instruction set architectures, CPU microarchitecture, and low-level memory models' },
                { title: 'Travel & Exploration', desc: 'Hiking, discovering new cities, and exploring global cultures' },
                { title: '3D Printing & CAD', desc: 'Parametric CAD modeling and functional prototyping for robotics and electronics' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-3.5 rounded-xl transition-colors"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--site-border)',
                  }}
                >
                  <span className="font-mono text-xs font-bold block mb-1" style={{ color: 'var(--site-red)' }}>
                    {item.title}
                  </span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--site-text-dim)' }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </FoldableSection>
        </div>
      </div>
    </div>
  );
}
