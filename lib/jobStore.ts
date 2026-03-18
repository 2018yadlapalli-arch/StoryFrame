import fs from 'fs';
import path from 'path';
import { Job, FrameDescription } from '@/types';
import { DIRS, ensureDirs } from './storage';

type CacheEntry = { job: Job; ts: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 500; // ms

function jobPath(jobId: string): string {
  return path.join(DIRS.jobs, `${jobId}.json`);
}

export function createJob(job: Job): Job {
  ensureDirs();
  fs.writeFileSync(jobPath(job.id), JSON.stringify(job, null, 2));
  cache.set(job.id, { job, ts: Date.now() });
  return job;
}

export function readJob(jobId: string): Job {
  const cached = cache.get(jobId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.job;
  const raw = fs.readFileSync(jobPath(jobId), 'utf8');
  const job = JSON.parse(raw) as Job;
  cache.set(jobId, { job, ts: Date.now() });
  return job;
}

export function updateJob(jobId: string, updates: Partial<Job>): Job {
  const existing = readJob(jobId);
  const updated = { ...existing, ...updates };
  fs.writeFileSync(jobPath(jobId), JSON.stringify(updated, null, 2));
  cache.set(jobId, { job: updated, ts: Date.now() });
  return updated;
}

export function updateFrame(
  jobId: string,
  frameIndex: number,
  updates: Partial<FrameDescription>
): void {
  const job = readJob(jobId);
  job.frames[frameIndex] = { ...job.frames[frameIndex], ...updates };
  updateJob(jobId, { frames: job.frames });
}

export function jobExists(jobId: string): boolean {
  return fs.existsSync(jobPath(jobId));
}
