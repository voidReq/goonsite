'use client';

import { useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  IconMapPin,
  IconBrandLinkedin,
  IconBrandGithub,
  IconWorld,
  IconExternalLink,
  IconChevronDown,
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
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function FoldableSection({
  id,
  title,
  isOpen,
  onToggle,
  children,
}: FoldableSectionProps) {
  return (
    <div className="pb-2">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`section-panel-${id}`}
        className="w-full text-left py-2 flex items-center justify-between group cursor-pointer select-none"
      >
        <span
          className="font-mono text-xs md:text-sm font-bold tracking-wider uppercase shrink-0"
          style={{ color: 'var(--site-text)' }}
        >
          {title}
        </span>
        <div
          className="flex-1 h-[2px] mx-4 rounded-full transition-colors group-hover:bg-white/40"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
        />
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0"
        >
          <IconChevronDown
            size={16}
            style={{ color: 'var(--site-text-dim)' }}
            className="group-hover:text-[var(--site-text)] transition-colors"
          />
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
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AboutClient({
  topics = [],
}: {
  builds?: AboutItem[];
  writeups?: AboutItem[];
  topics?: string[];
}) {
  const sectionKeys = ['education', 'technical', 'experience', 'projects', 'notes', 'interests'];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    education: true,
    technical: true,
    experience: true,
    projects: true,
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
      <div className="relative z-10 p-4 md:p-8 mx-auto" style={{ maxWidth: '52rem' }}>
        {/* Intro & Header */}
        <div className="mb-6 pb-6 border-b-[2px]" style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-tight" style={{ color: 'var(--site-text)' }}>
                James Hanstedt
              </h1>
              <p className="text-xs md:text-sm font-mono mt-1" style={{ color: 'var(--site-text-dim)' }}>
                Electrical &amp; Computer Engineering @ Northeastern University
              </p>
              <p className="text-xs md:text-sm leading-relaxed mt-3 max-w-lg" style={{ color: 'var(--site-text)' }}>
                Hey, I&apos;m James — studying Electrical &amp; Computer Engineering with a focus on security research, embedded systems, and full-stack software development.
              </p>
            </div>

            {/* Square Contact / Link Box (2x2 Grid) */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono shrink-0 w-full sm:w-auto">
              {/* Boston, MA */}
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--site-border)',
                  color: 'var(--site-text-dim)',
                }}
              >
                <IconMapPin size={14} style={{ color: 'var(--site-amber)' }} />
                <span>Boston, MA</span>
              </div>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/james-hanstedt/"
                {...externalProps}
                className="flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg transition-colors hover:border-[var(--site-border-hover)]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--site-border)',
                  color: 'var(--site-text)',
                  textDecoration: 'none',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <IconBrandLinkedin size={14} style={{ color: 'var(--site-cyan)' }} />
                  <span>LinkedIn</span>
                </span>
                <IconExternalLink size={12} style={{ color: 'var(--site-text-dim)' }} />
              </a>

              {/* 6A68.dev */}
              <Link
                href="/"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors hover:border-[var(--site-border-hover)]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--site-border)',
                  color: 'var(--site-text)',
                  textDecoration: 'none',
                }}
              >
                <IconWorld size={14} style={{ color: 'var(--site-amber)' }} />
                <span>6A68.dev</span>
              </Link>

              {/* GitHub */}
              <a
                href="https://github.com/voidReq"
                {...externalProps}
                className="flex items-center justify-between gap-1.5 px-3 py-2 rounded-lg transition-colors hover:border-[var(--site-border-hover)]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--site-border)',
                  color: 'var(--site-text)',
                  textDecoration: 'none',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <IconBrandGithub size={14} style={{ color: 'var(--site-purple)' }} />
                  <span>GitHub</span>
                </span>
                <IconExternalLink size={12} style={{ color: 'var(--site-text-dim)' }} />
              </a>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={toggleAll}
              className="font-mono text-xs text-[var(--site-text-dim)] hover:text-[var(--site-text)] transition-colors cursor-pointer"
            >
              {allOpen ? '[ Collapse All ]' : '[ Expand All ]'}
            </button>
          </div>
        </div>

        {/* Resume Sections */}
        <div className="space-y-6">
          {/* EDUCATION */}
          <FoldableSection
            id="education"
            title="Education"
            isOpen={openSections.education}
            onToggle={() => toggleSection('education')}
          >
            <div>
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                  Northeastern University
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--site-text-dim)' }}>
                  May 2029 | Boston, MA
                </span>
              </div>
              <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                <li>Candidate for B.S. in Electrical and Computer Engineering, Minor in Mathematics (4.0/4.0 GPA, Dean’s List)</li>
                <li>Courses: Embedded Design, Program Design, Databases, Calculus 3, Linear &amp; Differential Equations</li>
              </ul>
            </div>
          </FoldableSection>

          {/* TECHNICAL */}
          <FoldableSection
            id="technical"
            title="Technical"
            isOpen={openSections.technical}
            onToggle={() => toggleSection('technical')}
          >
            <div className="space-y-2 text-xs md:text-sm leading-relaxed" style={{ color: 'var(--site-text)' }}>
              <div>
                <span className="font-mono font-semibold" style={{ color: 'var(--site-text-dim)' }}>Skills: </span>
                <span>Penetration Testing, Python, Java, C/C++, Bash, TypeScript, Embedded Systems, Computer Networking (Security), CI/CD</span>
              </div>
              <div>
                <span className="font-mono font-semibold" style={{ color: 'var(--site-text-dim)' }}>Tools: </span>
                <span>Burp Suite, Caido, Nmap, Wireshark, Git, Linux, Neovim, Claude Code, Oracle Cloud, Supabase, Redis, Raspberry Pi, ESP32, Flipper Zero</span>
              </div>
              <div>
                <span className="font-mono font-semibold" style={{ color: 'var(--site-text-dim)' }}>Certifications: </span>
                <span>MTA: Introduction to Programming Using Python (2022), MTA: Security Fundamentals (2022)</span>
              </div>
            </div>
          </FoldableSection>

          {/* EXPERIENCE */}
          <FoldableSection
            id="experience"
            title="Experience"
            isOpen={openSections.experience}
            onToggle={() => toggleSection('experience')}
          >
            <div className="space-y-5">
              {/* Confluence */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    Confluence (pre-launch), Co-founder/Full-Stack Developer
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    July 2026 – Present | Remote
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1.5 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Architect frontend and backend of a high-throughput trading platform with Next.js/React, FastAPI, Supabase (PostgreSQL), and Redis</li>
                  <li>Deploy multi-service stack on Oracle Cloud (Ubuntu) with automated CI lint, test, and containerized integration gates</li>
                  <li>Design and implement shared schemas, docs, and internal contracts connecting the frontend, backend microservices, and execution engine</li>
                  <li>Manage security configurations: PostgreSQL Row-Level Security (RLS) policies, input sanitization, and defensive pentesting</li>
                </ul>
              </div>

              {/* Freelance Security Researcher */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    Freelance, Security Researcher
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Dec 2024 – Present | Remote
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1.5 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Responsibly disclosed 12+ vulnerabilities to several companies as a self-taught security analyst</li>
                  <li>
                    <strong>DoorList</strong> (social app used at 250+ colleges): Reported 10+ vulnerabilities (several critical/high severity) to founder/CEO including personal information leaks and improper authentication, affecting 400k+ users
                  </li>
                  <li>
                    <strong>Undisclosed website</strong> (~100k users, 2,000+ paying): Discovered and reported critical{' '}
                    <Link
                      href="/projects/writeups/critical-idor-pii-exposure"
                      className="font-medium hover:underline"
                      style={{ color: 'var(--site-cyan)' }}
                    >
                      insecure direct object reference (IDOR)
                    </Link>{' '}
                    and backend leak that exposed user information (emails, full names, addresses, partial credit card info)
                  </li>
                  <li>
                    <strong>Undisclosed platform</strong> (~40k monthly users): Found and reported a stored{' '}
                    <Link
                      href="/projects/writeups/critical-xss"
                      className="font-medium hover:underline"
                      style={{ color: 'var(--site-cyan)' }}
                    >
                      cross-site scripting (XSS)
                    </Link>{' '}
                    vulnerability, bypassing filter restrictions via WebSockets to demonstrate cookie exfiltration
                  </li>
                </ul>
              </div>

              {/* FRC Team 2530 */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    FRC Robotics Team 2530, Team Captain, Programming Lead
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Sep 2023 – May 2025 | Rochester, MN
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1.5 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Led a 40+ member team across onboarding, project management, programming, and tournament match scouting</li>
                  <li>Aided in 2x World Championship qualification through contributions to swerve odometry and robotic controls (Java/Python) as well as data aggregation and analysis for alliance selection</li>
                </ul>
              </div>

              {/* Virginia Military Institute */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    Virginia Military Institute, Hardware/Software Engineer Intern
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Mar – May 2023 | Lexington, VA
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1.5 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>
                    Engineered{' '}
                    <Link
                      href="/projects/projects/miscellaneous/smartgrid-iot"
                      className="font-medium hover:underline"
                      style={{ color: 'var(--site-cyan)' }}
                    >
                      SmartGrid IoT
                    </Link>{' '}
                    simulation testbed for cybersecurity research and wired hardware for power distribution testbeds (
                    <a
                      href="https://github.com/voidReq/SmartGrid_IoT"
                      {...externalProps}
                      className="hover:underline"
                      style={{ color: 'var(--site-text-dim)' }}
                    >
                      GitHub ↗
                    </a>
                    )
                  </li>
                  <li>Built familiarity with Arduino/C++, Python, MQTT, INA219 power monitors, and various development boards (primarily ESP family)</li>
                </ul>
              </div>
            </div>
          </FoldableSection>

          {/* PROJECTS */}
          <FoldableSection
            id="projects"
            title="Projects"
            isOpen={openSections.projects}
            onToggle={() => toggleSection('projects')}
          >
            <div className="space-y-5">
              {/* Personal Website */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    <Link href="/" className="hover:underline" style={{ color: 'var(--site-text)' }}>
                      Personal Website, www.6A68.dev
                    </Link>{' '}
                    (
                    <a
                      href="https://github.com/voidReq/6A68"
                      {...externalProps}
                      className="hover:underline"
                      style={{ color: 'var(--site-text-dim)' }}
                    >
                      github.com/voidReq/6A68 ↗
                    </a>
                    )
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Next.js/React, APIs, Git | Jan 2025 – Present
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Developed personal website with extensive personal notes, security writeups, and projects</li>
                  <li>Self-hosted with proprietary visitor tracking, sitemap terminal emulator, clean/goonsite dual mode, and Obsidian markdown sync</li>
                </ul>
              </div>

              {/* NUauto */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    NUauto (
                    <a
                      href="https://github.com/voidReq/NUauto/blob/main/README.md"
                      {...externalProps}
                      className="hover:underline"
                      style={{ color: 'var(--site-text-dim)' }}
                    >
                      github.com/voidReq/NUauto ↗
                    </a>
                    )
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Python, Web Automation | 2026
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Finds NUworks co-op postings that fit your resume and automates submission for student-approved positions</li>
                </ul>
              </div>

              {/* Discord Remote Access */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    <Link
                      href="/projects/projects/security/discord-remote-access"
                      className="hover:underline"
                      style={{ color: 'var(--site-text)' }}
                    >
                      Discord Remote Access
                    </Link>{' '}
                    (
                    <a
                      href="https://github.com/voidReq/discordRemoteAccess"
                      {...externalProps}
                      className="hover:underline"
                      style={{ color: 'var(--site-text-dim)' }}
                    >
                      github.com/voidReq/discordRemoteAccess ↗
                    </a>
                    )
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    C, Windows API | 2025
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Proof-of-concept remote access tool in pure C utilizing the Discord Bot API as an encrypted covert C2 channel</li>
                </ul>
              </div>

              {/* T-Watch Evil Portal */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    <Link
                      href="/projects/projects/security/t-watch-evil-portal"
                      className="hover:underline"
                      style={{ color: 'var(--site-text)' }}
                    >
                      T-Watch Evil Portal
                    </Link>{' '}
                    (
                    <a
                      href="https://github.com/voidReq/T-Watch_Evil_Portal"
                      {...externalProps}
                      className="hover:underline"
                      style={{ color: 'var(--site-text-dim)' }}
                    >
                      github.com/voidReq/T-Watch_Evil_Portal ↗
                    </a>
                    )
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    C++, HTML | Aug 2025
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Created PoC malicious WiFi access point hosted on ESP32-based smartwatch, along with WiFi diagnostics</li>
                </ul>
              </div>

              {/* Revolutions */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    <Link
                      href="/projects/projects/miscellaneous/revolutions"
                      className="hover:underline"
                      style={{ color: 'var(--site-text)' }}
                    >
                      Revolutions | Calculus II
                    </Link>{' '}
                    (
                    <a
                      href="https://github.com/voidReq/revolutions"
                      {...externalProps}
                      className="hover:underline"
                      style={{ color: 'var(--site-text-dim)' }}
                    >
                      github.com/voidReq/revolutions ↗
                    </a>
                    )
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Python | Mar 2025
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Wrote software to visualize rotations of functions about linear axes, with Python, NumPy, and Matplotlib</li>
                </ul>
              </div>

              {/* Homelab */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-sm font-semibold" style={{ color: 'var(--site-text)' }}>
                    Homelab
                  </span>
                  <span className="font-mono text-xs shrink-0" style={{ color: 'var(--site-text-dim)' }}>
                    Linux (Pi OS, Ubuntu), Networking | Jan 2025 – Present
                  </span>
                </div>
                <ul className="list-disc list-outside ml-4 mt-2 space-y-1 text-xs md:text-sm" style={{ color: 'var(--site-text)' }}>
                  <li>Assembled a Pi 5 and an old PC into a homelab, formed an encrypted Tailnet, and deployed various automation projects</li>
                </ul>
              </div>
            </div>
          </FoldableSection>

          {/* NOTES & DIGITAL GARDEN */}
          <FoldableSection
            id="notes"
            title="Notes &amp; Garden"
            isOpen={openSections.notes}
            onToggle={() => toggleSection('notes')}
          >
            <div className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--site-text)' }}>
              <span>Personal Obsidian vault notes on: </span>
              {topics.map((topic, i) => (
                <span key={topic}>
                  <Link
                    href="/notes"
                    className="hover:underline font-mono"
                    style={{ color: 'var(--site-cyan)' }}
                  >
                    {topic}
                  </Link>
                  {i < topics.length - 1 ? ', ' : ''}
                </span>
              ))}
              <span style={{ color: 'var(--site-text-dim)' }}>
                {' '}
                (
                <a
                  href="https://github.com/voidReq/notes"
                  {...externalProps}
                  className="hover:underline"
                  style={{ color: 'var(--site-text-dim)' }}
                >
                  github.com/voidReq/notes ↗
                </a>
                )
              </span>
            </div>
          </FoldableSection>

          {/* OTHER INTERESTS */}
          <FoldableSection
            id="interests"
            title="Other Interests"
            isOpen={openSections.interests}
            onToggle={() => toggleSection('interests')}
          >
            <p className="text-xs md:text-sm leading-relaxed" style={{ color: 'var(--site-text)' }}>
              AR/VR, cooking (part-time sous chef), computer architecture, travel, 3D printing/CAD.
            </p>
          </FoldableSection>
        </div>
      </div>
    </div>
  );
}
