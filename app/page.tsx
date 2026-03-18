'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StepIndicator from '@/components/shared/StepIndicator';
import ImageDropzone from '@/components/upload/ImageDropzone';

type Phase = 'idle' | 'uploading' | 'analyzing' | 'error';

const FEATURES = [
  { icon: '🔍', title: 'Vision Analysis', desc: 'Qwen3 reads your image and crafts the full story arc', color: '#818cf8' },
  { icon: '🎨', title: 'Frame Generation', desc: 'FLUX.2 creates 20 unique cinematic scenes', color: '#f97316' },
  { icon: '🎬', title: 'Video Render', desc: 'Ken Burns pan & zoom · 1080p MP4 · 10 min', color: '#10b981' },
];

export default function HomePage() {
  const router = useRouter();
  const [phase, setPhase]         = useState<Phase>('idle');
  const [file, setFile]           = useState<File | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');
  const [analyzeTick, setAnalyzeTick] = useState(0);

  const handleSelect = useCallback((f: File, _preview: string) => {
    setFile(f);
    setError(null);
  }, []);

  async function handleStart() {
    if (!file) return;
    setError(null);
    try {
      setPhase('uploading');
      setStatusText('Uploading your image...');
      const form = new FormData();
      form.append('image', file);
      const upRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!upRes.ok) throw new Error((await upRes.json()).error || 'Upload failed');
      const { jobId } = await upRes.json();

      setPhase('analyzing');
      setStatusText('Qwen3 is reading your image...');
      const ticker = setInterval(() => setAnalyzeTick(t => t + 1), 600);
      const anRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      clearInterval(ticker);
      if (!anRes.ok) throw new Error((await anRes.json()).error || 'Analysis failed');

      router.push(`/studio/${jobId}`);
    } catch (err) {
      setPhase('error');
      setError(String(err instanceof Error ? err.message : err));
    }
  }

  const isLoading = phase === 'uploading' || phase === 'analyzing';

  const analyzeSteps = [
    'Identifying scene, subjects, and emotions',
    'Writing the narrative — before & after',
    'Crafting 20 cinematic frame descriptions',
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <StepIndicator currentStep={1} />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="text-center mb-10 animate-slide-up">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest
          text-brand-400 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Powered by Local AI
        </div>

        <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
          Turn any image into a{' '}
          <br className="hidden sm:block" />
          <span className="text-gradient">cinematic video</span>
        </h1>

        <p className="text-gray-400 text-lg mb-6 max-w-lg mx-auto leading-relaxed">
          Upload one photo. AI writes what happened before and after, generates 20 frames, and renders a 5–10 minute story.
        </p>

        <Link
          href="/demo"
          className="inline-flex items-center gap-2 text-sm font-medium text-white
            bg-gray-800 hover:bg-gray-750 border border-gray-700/60 hover:border-brand-600/50
            rounded-full px-5 py-2 transition-all duration-200 btn-glow group"
        >
          <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-xs
            group-hover:scale-110 transition-transform">▶</span>
          Watch a demo first
        </Link>
      </div>

      {/* ── Upload card ──────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-6 border border-gray-800/60 space-y-5 animate-slide-up delay-150"
        style={{
          background: 'linear-gradient(180deg, rgba(17,24,39,0.8) 0%, rgba(9,9,11,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          animationFillMode: 'forwards',
          opacity: 0,
        }}
      >
        <ImageDropzone onUpload={handleSelect} disabled={isLoading} />

        {/* File info */}
        {file && !isLoading && (
          <div className="text-sm text-gray-400 bg-gray-800/60 rounded-lg px-4 py-2.5
            flex items-center gap-2 animate-slide-up border border-gray-700/40">
            <span className="text-green-400 text-base">✓</span>
            <span className="truncate text-gray-300">{file.name}</span>
            <span className="text-gray-600 ml-auto shrink-0">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-3 animate-slide-up">
            <div className="flex items-center gap-3">
              <div
                className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                style={{ borderColor: 'rgba(249,115,22,0.3)', borderTopColor: '#f97316' }}
              />
              <span className="text-sm font-medium text-brand-400">{statusText}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full progress-shine rounded-full w-3/4" />
            </div>

            {/* Analyzing checklist */}
            {phase === 'analyzing' && (
              <div className="bg-gray-800/50 rounded-xl p-3.5 border border-gray-700/30 space-y-2">
                {analyzeSteps.map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2.5 text-xs transition-all duration-500 ${
                      analyzeTick > i ? 'text-gray-300' : 'text-gray-600'
                    }`}
                    style={{ transitionDelay: `${i * 150}ms` }}
                  >
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[9px]
                      transition-all duration-300 ${
                        analyzeTick > i
                          ? 'border-brand-500 bg-brand-600/30 text-brand-300'
                          : 'border-gray-700 text-gray-700'
                      }`}>
                      {analyzeTick > i ? '✓' : i + 1}
                    </span>
                    {step}
                  </div>
                ))}
                <p className="text-[11px] text-gray-600 pt-1">Usually takes 15–30 seconds...</p>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-slide-up">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={handleStart}
          disabled={!file || isLoading}
          className="relative w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200
            disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
            active:scale-[0.98] overflow-hidden btn-glow"
          style={(!file || isLoading) ? {} : {
            background: 'linear-gradient(135deg, #ea580c, #f97316, #ea580c)',
            backgroundSize: '200% 100%',
            animation: 'gradient-shift 3s ease infinite',
          }}
        >
          {/* Shine overlay on hover */}
          {!isLoading && file && (
            <span className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)' }} />
          )}
          <span className="relative">
            {isLoading ? 'Processing...' : 'Analyze & Generate Story →'}
          </span>
        </button>
      </div>

      {/* ── Feature cards ─────────────────────────────────────────────── */}
      <div className="mt-10 grid grid-cols-3 gap-4">
        {FEATURES.map((item, i) => (
          <div
            key={item.title}
            className="rounded-xl p-4 border border-gray-800/50 bg-gray-900/30 text-center
              card-glow opacity-0 animate-slide-up group cursor-default"
            style={{
              animationDelay: `${300 + i * 100}ms`,
              animationFillMode: 'forwards',
            }}
          >
            <div className="text-2xl mb-2 animate-float-slow" style={{ animationDelay: `${i * 0.8}s` }}>
              {item.icon}
            </div>
            <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">
              {item.title}
            </p>
            <p className="text-xs text-gray-600 mt-1 group-hover:text-gray-400 transition-colors leading-relaxed">
              {item.desc}
            </p>
            {/* Bottom accent line */}
            <div
              className="mt-3 mx-auto h-0.5 w-0 group-hover:w-8 rounded-full transition-all duration-500"
              style={{ background: item.color }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
