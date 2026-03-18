import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StoryFrame — Turn Any Image into a Video',
  description: 'Upload an image, AI creates the story before and after, generates frames, and renders a cinematic video.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 overflow-x-hidden">

        {/* ── Animated background mesh ──────────────────────────────────── */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
          {/* Orb 1 — warm orange, top-left */}
          <div
            className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-[0.07] animate-orb-1"
            style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }}
          />
          {/* Orb 2 — amber, bottom-right */}
          <div
            className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full opacity-[0.06] animate-orb-2"
            style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }}
          />
          {/* Orb 3 — deep purple accent, center */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full opacity-[0.04] animate-orb-3"
            style={{ background: 'radial-gradient(ellipse, #a855f7 0%, transparent 70%)' }}
          />
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* ── Nav ──────────────────────────────────────────────────────── */}
        <nav className="border-b border-gray-800/60 bg-gray-950/70 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-3">
            {/* Animated logo */}
            <div className="relative w-7 h-7">
              <div
                className="absolute inset-0 rounded-lg opacity-60 animate-gradient-shift"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #fbbf24, #ea580c)',
                  backgroundSize: '300% 300%',
                }}
              />
              <div className="relative w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                S
              </div>
            </div>
            <span className="font-semibold text-white tracking-tight">StoryFrame</span>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden sm:block text-xs text-gray-600 font-medium uppercase tracking-widest">
                AI Video Creator
              </span>
              {/* Live indicator */}
              <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Local AI
              </span>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
