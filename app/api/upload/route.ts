import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createJob } from '@/lib/jobStore';
import { jobUploadDir, ensureDirs } from '@/lib/storage';
import { Job } from '@/types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export async function POST(req: NextRequest) {
  try {
    ensureDirs();

    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const jobId = uuidv4();
    const ext = EXT_MAP[file.type] || '.jpg';
    const uploadDir = jobUploadDir(jobId);
    const filename = `original${ext}`;
    const filePath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    const FRAME_COUNT = parseInt(process.env.FRAME_COUNT || '20', 10);
    const VIDEO_DURATION = parseInt(process.env.VIDEO_DURATION_SECONDS || '600', 10);
    const frameDuration = Math.round(VIDEO_DURATION / FRAME_COUNT);

    const job: Job = {
      id: jobId,
      createdAt: new Date().toISOString(),
      status: 'created',
      originalImagePath: filePath,
      originalImageUrl: `/api/files/uploads/${jobId}/${filename}`,
      narration: '',
      frames: [],
      videoPath: null,
      videoUrl: null,
      renderProgress: 0,
      shareToken: null,
      errorMessage: null,
      meta: {
        uploadedFileName: file.name,
        mimeType: file.type,
        totalDurationSeconds: VIDEO_DURATION,
        fps: 24,
        frameDurationSeconds: frameDuration,
      },
    };

    createJob(job);

    return NextResponse.json({ jobId, imageUrl: job.originalImageUrl });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
