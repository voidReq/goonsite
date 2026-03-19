import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center font-mono">
        <div className="text-6xl font-bold mb-4" style={{ color: '#bb9af7' }}>404</div>
        <p className="text-white/60 mb-6">This page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-block px-4 py-2 rounded-lg border border-white/10 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
