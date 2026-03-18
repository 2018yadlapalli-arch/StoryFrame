'use client';

import Image from 'next/image';
import { FrameDescription } from '@/types';

interface Props {
  frame: FrameDescription;
  onChange: (index: number, description: string) => void;
  disabled: boolean;
}

const STATUS_BADGE = {
  pending:    'bg-gray-700/80 text-gray-400',
  generating: 'bg-brand-600/30 text-brand-300',
  done:       'bg-green-600/20 text-green-400',
  error:      'bg-red-600/20 text-red-400',
};

export default function FrameCard({ frame, onChange, disabled }: Props) {
  const isGenerating = frame.status === 'generating';
  const isDone       = frame.status === 'done';

  // Stagger entrance by frame index (capped at 500ms)
  const delay = Math.min(frame.index * 40, 500);

  return (
    <div
      className={`rounded-xl border transition-all duration-300 card-glow opacity-0 animate-slide-up group
        ${frame.isOriginal
          ? 'border-brand-500/60 bg-brand-500/5'
          : isDone
          ? 'border-gray-700 bg-gray-900 hover:border-brand-600/40'
          : 'border-gray-800/80 bg-gray-900/40 hover:border-gray-700'
        }`}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: 'forwards',
        ...(isDone && frame.isOriginal ? { boxShadow: '0 0 20px rgba(249,115,22,0.15)' } : {}),
      }}
    >
      {/* Image area */}
      <div className="relative aspect-video rounded-t-xl overflow-hidden bg-gray-800/80">

        {/* Done — show generated image */}
        {isDone && frame.imageUrl ? (
          <Image
            src={frame.imageUrl}
            alt={`Frame ${frame.index + 1}`}
            fill
            className="object-cover animate-fade-in"
            unoptimized
          />
        ) : isGenerating ? (
          /* Generating — shimmer + spinner */
          <>
            <div className="absolute inset-0 shimmer" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div
                className="w-6 h-6 rounded-full border-2 border-transparent border-t-brand-400 animate-spin"
                style={{ borderTopColor: '#fb923c' }}
              />
              <span className="text-[10px] text-brand-400 font-medium tracking-wide">GENERATING</span>
            </div>
          </>
        ) : (
          /* Pending */
          <div className="absolute inset-0 flex items-center justify-center text-2xl opacity-20
            group-hover:opacity-40 transition-opacity duration-300">
            {frame.isOriginal ? '📷' : '🎨'}
          </div>
        )}

        {/* Frame number */}
        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5
          text-[10px] text-gray-300 font-mono tracking-wider">
          {String(frame.index + 1).padStart(2, '0')}
        </div>

        {/* Original badge */}
        {frame.isOriginal && (
          <div className="absolute top-1.5 right-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
            YOUR PHOTO
          </div>
        )}

        {/* Done sparkle */}
        {isDone && !frame.isOriginal && (
          <div className="absolute bottom-1.5 right-1.5 text-green-400 text-xs animate-scale-in">✓</div>
        )}
      </div>

      {/* Info row */}
      <div className="p-2.5 space-y-2">
        <div className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[frame.status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full bg-current ${isGenerating ? 'animate-pulse' : ''}`} />
          {frame.status === 'pending' ? 'Waiting' : frame.status.charAt(0).toUpperCase() + frame.status.slice(1)}
        </div>

        <textarea
          value={frame.description}
          onChange={(e) => onChange(frame.index, e.target.value)}
          disabled={disabled || frame.isOriginal}
          rows={3}
          className="w-full bg-gray-800/50 text-gray-300 text-[11px] rounded-lg px-2.5 py-2
            border border-gray-700/40 focus:outline-none focus:border-brand-500/50 focus:bg-gray-800
            resize-none placeholder-gray-600 disabled:opacity-40 disabled:cursor-not-allowed
            leading-relaxed scrollbar-thin transition-colors duration-200"
          placeholder="Frame description..."
        />

        {frame.errorMessage && (
          <p className="text-[10px] text-red-400 leading-tight">{frame.errorMessage}</p>
        )}
      </div>
    </div>
  );
}
