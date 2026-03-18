'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Image from 'next/image';
import StepIndicator from '@/components/shared/StepIndicator';
import FrameCard from '@/components/studio/FrameCard';
import { Job, FrameDescription } from '@/types';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StudioClient({ initialJob }: { initialJob: Job }) {
  const router = useRouter();
  const jobId = initialJob.id;

  const [narration, setNarration] = useState(initialJob.narration);
  const [frames, setFrames] = useState<FrameDescription[]>(initialJob.frames);
  const [isGenerating, setIsGenerating] = useState(
    initialJob.status === 'generating_frames'
  );
  const [isRendering, setIsRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Poll frame status while generating
  const { data: frameStatus } = useSWR(
    isGenerating ? `/api/frame-status/${jobId}` : null,
    fetcher,
    { refreshInterval: 2000 }
  );

  useEffect(() => {
    if (!frameStatus) return;
    setFrames(
      frameStatus.frames.map((f: FrameDescription) => ({
        ...f,
        description: f.description,
      }))
    );
    if (frameStatus.jobStatus === 'frames_ready' || frameStatus.progress === 100) {
      setIsGenerating(false);
    }
  }, [frameStatus]);

  const handleFrameChange = useCallback((index: number, description: string) => {
    setFrames((prev) =>
      prev.map((f) => (f.index === index ? { ...f, description } : f))
    );
  }, []);

  async function handleGenerateFrames() {
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, frames, narration }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to start generation');
    } catch (err) {
      setIsGenerating(false);
      setError(String(err instanceof Error ? err.message : err));
    }
  }

  async function handleRenderVideo() {
    setError(null);
    setIsRendering(true);
    try {
      const res = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Render failed');
      router.push(`/preview/${jobId}`);
    } catch (err) {
      setIsRendering(false);
      setError(String(err instanceof Error ? err.message : err));
    }
  }

  const doneCount = frames.filter((f) => f.status === 'done').length;
  const totalCount = frames.length;
  const allDone = doneCount === totalCount && totalCount > 0;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
      <StepIndicator currentStep={2} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel: image + narration */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="relative aspect-video">
              <Image
                src={initialJob.originalImageUrl}
                alt="Your image"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Your image</p>
              <p className="text-sm text-gray-300">{initialJob.meta.uploadedFileName}</p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white">Narration</h2>
              <span className="text-xs text-gray-500">Edit before generating</span>
            </div>
            <textarea
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              disabled={isGenerating || isRendering}
              rows={12}
              className="w-full bg-gray-800 text-gray-200 text-sm rounded-xl px-4 py-3 border border-gray-700
                focus:outline-none focus:border-brand-500/50 resize-none placeholder-gray-600
                disabled:opacity-50 scrollbar-thin leading-relaxed"
              placeholder="The AI-generated story will appear here..."
            />
            <p className="text-xs text-gray-600">
              This narration guides the overall story. Edit it however you like.
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {!isGenerating && !allDone && (
              <button
                onClick={handleGenerateFrames}
                disabled={isRendering || frames.length === 0}
                className="w-full py-3 rounded-xl font-semibold text-white bg-brand-600 hover:bg-brand-500
                  disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                  transition-all active:scale-95"
              >
                Generate {frames.length} Frame Images
              </button>
            )}

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-brand-400 font-medium flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin inline-block" />
                    Generating frames
                  </span>
                  <span className="text-gray-400">{doneCount}/{totalCount}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
            )}

            {allDone && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                  <span>✓</span>
                  <span>All {totalCount} frames generated!</span>
                </div>
                <button
                  onClick={handleRenderVideo}
                  disabled={isRendering}
                  className="w-full py-3 rounded-xl font-semibold text-white bg-green-700 hover:bg-green-600
                    disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed
                    transition-all active:scale-95"
                >
                  {isRendering ? 'Starting render...' : 'Render Video'}
                </button>
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                {error}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-4 space-y-2 text-xs text-gray-500">
            <p><strong className="text-gray-400">Video length:</strong> {Math.round(initialJob.meta.totalDurationSeconds / 60)} minutes</p>
            <p><strong className="text-gray-400">Frames:</strong> {totalCount} images × {initialJob.meta.frameDurationSeconds}s each</p>
            <p><strong className="text-gray-400">Resolution:</strong> 1920×1080 @ 24fps</p>
            <p><strong className="text-gray-400">Effect:</strong> Ken Burns pan &amp; zoom</p>
          </div>
        </div>

        {/* Right panel: frame grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white text-lg">
              Video Frames
              <span className="ml-2 text-sm text-gray-500 font-normal">
                ({doneCount}/{totalCount} ready)
              </span>
            </h2>
            {isGenerating && (
              <span className="text-xs text-brand-400 font-medium animate-pulse">
                Generating with AI...
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {frames.map((frame) => (
              <FrameCard
                key={frame.index}
                frame={frame}
                onChange={handleFrameChange}
                disabled={isGenerating || isRendering}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
