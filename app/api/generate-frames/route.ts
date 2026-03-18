import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readJob, updateJob, updateFrame, jobExists } from '@/lib/jobStore';
import { generateFrameImage } from '@/lib/replicate';
import { jobFramesDir } from '@/lib/storage';
import { FrameDescription } from '@/types';

const BATCH_SIZE = 1; // local FLUX server handles one request at a time

async function processFrames(jobId: string, frames: FrameDescription[]) {
  const job = readJob(jobId);
  const framesDir = jobFramesDir(jobId);

  for (let i = 0; i < frames.length; i += BATCH_SIZE) {
    const batch = frames.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (frame) => {
        const outputPath = path.join(framesDir, `frame_${String(frame.index).padStart(3, '0')}.png`);

        // If this is the original image frame, copy it instead of generating
        if (frame.isOriginal) {
          fs.copyFileSync(job.originalImagePath, outputPath);
          updateFrame(jobId, frame.index, {
            status: 'done',
            imagePath: outputPath,
            imageUrl: `/api/files/frames/${jobId}/frame_${String(frame.index).padStart(3, '0')}.png`,
          });
          return;
        }

        updateFrame(jobId, frame.index, { status: 'generating' });

        try {
          await generateFrameImage(frame.description, outputPath);
          updateFrame(jobId, frame.index, {
            status: 'done',
            imagePath: outputPath,
            imageUrl: `/api/files/frames/${jobId}/frame_${String(frame.index).padStart(3, '0')}.png`,
          });
        } catch (err) {
          console.error(`[generate-frames] frame ${frame.index} failed:`, err);
          updateFrame(jobId, frame.index, {
            status: 'error',
            errorMessage: String(err),
          });
        }
      })
    );

    // Brief pause between batches to respect rate limits
    if (i + BATCH_SIZE < frames.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Check if all frames are done (some may have errored)
  const finalJob = readJob(jobId);
  const allDone = finalJob.frames.every((f) => f.status === 'done' || f.status === 'error');
  if (allDone) {
    updateJob(jobId, { status: 'frames_ready' });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, frames, narration } = body as {
      jobId: string;
      frames: FrameDescription[];
      narration: string;
    };

    if (!jobId || !jobExists(jobId)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Save user-edited narration and frames
    updateJob(jobId, {
      status: 'generating_frames',
      narration,
      frames: frames.map((f) => ({ ...f, status: 'pending' })),
    });

    // Fire and forget — returns immediately
    processFrames(jobId, frames).catch((err) => {
      console.error('[generate-frames] background error:', err);
      updateJob(jobId, { status: 'error', errorMessage: String(err) });
    });

    return NextResponse.json(
      { message: 'Frame generation started', frameCount: frames.length },
      { status: 202 }
    );
  } catch (err) {
    console.error('[generate-frames]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
