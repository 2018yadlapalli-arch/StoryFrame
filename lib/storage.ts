import path from 'path';
import fs from 'fs';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

export const DIRS = {
  jobs: path.join(DATA_DIR, 'jobs'),
  uploads: path.join(DATA_DIR, 'uploads'),
  frames: path.join(DATA_DIR, 'frames'),
  videos: path.join(DATA_DIR, 'videos'),
};

export function ensureDirs() {
  for (const dir of Object.values(DIRS)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function jobUploadDir(jobId: string) {
  const d = path.join(DIRS.uploads, jobId);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function jobFramesDir(jobId: string) {
  const d = path.join(DIRS.frames, jobId);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

export function jobVideoDir(jobId: string) {
  const d = path.join(DIRS.videos, jobId);
  fs.mkdirSync(d, { recursive: true });
  return d;
}

// Resolve a safe file path within DATA_DIR (prevent traversal)
export function safePath(...parts: string[]): string | null {
  const resolved = path.resolve(path.join(DATA_DIR, ...parts));
  if (!resolved.startsWith(DATA_DIR)) return null;
  return resolved;
}
