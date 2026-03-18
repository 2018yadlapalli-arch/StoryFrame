'use client';

import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import Image from 'next/image';

interface Props {
  onUpload: (file: File, preview: string) => void;
  disabled?: boolean;
}

export default function ImageDropzone({ onUpload, disabled }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError]     = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      setError(null);
      if (rejected.length > 0) { setError(rejected[0].errors[0].message); return; }
      if (accepted.length === 0) return;
      const file = accepted[0];
      const url = URL.createObjectURL(file);
      setPreview(url);
      onUpload(file, url);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    disabled,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`relative rounded-2xl transition-all duration-300 cursor-pointer group
          ${preview ? 'p-0 overflow-hidden border-0' : 'p-14 border-2 border-dashed'}
          ${isDragActive
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : preview
            ? ''
            : 'border-gray-700 hover:border-brand-600/60 bg-gray-900/40 hover:bg-gray-900/60'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={isDragActive ? { boxShadow: '0 0 40px rgba(249,115,22,0.2), inset 0 0 40px rgba(249,115,22,0.05)' } : {}}
      >
        <input {...getInputProps()} />

        {preview ? (
          /* ── Image preview ─────────────────────────────────────────── */
          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
            <Image src={preview} alt="Preview" fill className="object-contain" unoptimized />
            {!disabled && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <span className="text-white text-sm font-medium bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-sm">
                  Click or drag to change image
                </span>
              </div>
            )}
          </div>
        ) : (
          /* ── Empty state ───────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-5 text-center">
            {/* Film-frame corner brackets */}
            {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
              <span
                key={i}
                className={`absolute ${pos} w-5 h-5 border-brand-500/40 group-hover:border-brand-500/80 transition-colors duration-300`}
                style={{
                  borderTopWidth:    i < 2 ? '2px' : '0',
                  borderBottomWidth: i >= 2 ? '2px' : '0',
                  borderLeftWidth:   i % 2 === 0 ? '2px' : '0',
                  borderRightWidth:  i % 2 === 1 ? '2px' : '0',
                }}
              />
            ))}

            {/* Floating icon */}
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl
              transition-all duration-300 group-hover:scale-110 ${isDragActive ? 'animate-float' : ''}`}
              style={{
                background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,191,36,0.1))',
                boxShadow: '0 0 30px rgba(249,115,22,0.1)',
              }}
            >
              {isDragActive ? '✨' : '🖼️'}
              {/* Glow ring */}
              <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: '0 0 20px rgba(249,115,22,0.3)' }} />
            </div>

            <div>
              <p className={`text-lg font-semibold transition-colors duration-200 ${isDragActive ? 'text-brand-400' : 'text-gray-200 group-hover:text-white'}`}>
                {isDragActive ? 'Drop it — let the story begin' : 'Drop an image to start'}
              </p>
              <p className="text-sm text-gray-500 mt-1 group-hover:text-gray-400 transition-colors">
                or click to browse · JPEG, PNG, WebP · max 10 MB
              </p>
            </div>

            {/* Scan line (only in empty state) */}
            {!disabled && (
              <span className="absolute left-0 right-0 h-px pointer-events-none animate-scan opacity-0 group-hover:opacity-100"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(249,115,22,0.5), transparent)' }} />
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 animate-slide-up">
          {error}
        </div>
      )}
    </div>
  );
}
