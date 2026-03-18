'use client';

import { useEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import StepIndicator from '@/components/shared/StepIndicator';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VideoStatus {
  status: string;
  progress: number;
  videoUrl: string | null;
  errorMessage: string | null;
}

export default function PreviewClient({ jobId }: { jobId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [copied, setCopied] = useState(false);

  const { data, error } = useSWR<VideoStatus>(
    `/api/video-status/${jobId}`,
    fetcher,
    {
      refreshInterval: (data) => {
        if (!data) return 3000;
        if (data.status === 'complete' || data.status === 'error') return 0;
        return 3000;
      },
    }
  );

  const isComplete = data?.status === 'complete';
  const isError = data?.status === 'error';
  const progress = data?.progress ?? 0;

  function handleCopyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={3} />

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {isComplete ? 'Your video is ready!' : 'Rendering your video...'}
        </h1>
        <p className="text-gray-400">
          {isComplete
            ? 'Watch, download, or share your cinematic story.'
            : 'FFmpeg is applying Ken Burns effects and stitching your frames together.'}
        </p>
      </div>

      {/* Render progress */}
      {!isComplete && !isError && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 mb-6 text-center space-y-4">
          <div className="text-4xl">🎬</div>
          <p className="text-brand-400 font-medium">
            {data?.status === 'rendering_video' ? 'Rendering...' : 'Starting render...'}
          </p>
          <div className="max-w-sm mx-auto space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 max-w-sm mx-auto">
            Ken Burns effects are CPU-intensive. Render time depends on your machine.
            This page will automatically update when done.
          </p>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 mb-6 text-center">
          <p className="text-red-400 font-medium mb-2">Render failed</p>
          <p className="text-gray-400 text-sm">{data?.errorMessage}</p>
          <Link
            href={`/studio/${jobId}`}
            className="mt-4 inline-block text-sm text-brand-400 hover:text-brand-300 underline"
          >
            Back to Studio
          </Link>
        </div>
      )}

      {/* Video player */}
      {isComplete && data?.videoUrl && (
        <div className="space-y-6">
          <div className="bg-black rounded-2xl overflow-hidden border border-gray-800">
            <video
              ref={videoRef}
              src={data.videoUrl}
              controls
              className="w-full aspect-video"
              poster=""
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={data.videoUrl}
              download="storyframe-video.mp4"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500
                text-white font-semibold transition-all active:scale-95"
            >
              <span>⬇</span> Download MP4
            </a>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700
                text-white font-semibold transition-all active:scale-95"
            >
              <span>{copied ? '✓' : '🔗'}</span>
              {copied ? 'Copied!' : 'Copy Link'}
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700
                text-white font-semibold transition-all active:scale-95"
            >
              <span>+</span> Create Another
            </Link>
          </div>

          <div className="bg-gray-900/50 rounded-xl border border-gray-800/50 p-4 text-xs text-gray-500 text-center">
            Video saved at: <code className="text-gray-400 font-mono">{data.videoUrl.replace('/api/files', 'data')}</code>
          </div>
        </div>
      )}

      {(error) && (
        <div className="text-red-400 text-sm text-center">
          Failed to load video status. <Link href="/" className="underline">Go home</Link>
        </div>
      )}
    </div>
  );
}
