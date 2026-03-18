import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { readJob, updateJob, jobExists } from '@/lib/jobStore';
import { renderVideo } from '@/lib/ffmpeg';
import { jobVideoDir } from '@/lib/storage';

async function startRender(jobId: string) {
  const job = readJob(jobId);
  const videoDir = jobVideoDir(jobId);
  const outputPath = path.join(videoDir, 'output.mp4');

  const frames = job.frames
    .filter((f) => f.status === 'done' && f.imagePath)
    .sort((a, b) => a.index - b.index)
    .map((f) => ({
      index: f.index,
      imagePath: f.imagePath!,
      durationSec: job.meta.frameDurationSeconds,
    }));

  if (frames.length === 0) {
    updateJob(jobId, { status: 'error', errorMessage: 'No frames available to render' });
    return;
  }

  updateJob(jobId, { status: 'rendering_video', renderProgress: 0 });

  await renderVideo({
    jobId,
    frames,
    outputPath,
    onProgress: (pct) => {
      updateJob(jobId, { renderProgress: pct });
    },
  });

  updateJob(jobId, {
    status: 'complete',
    videoPath: outputPath,
    videoUrl: `/api/files/videos/${jobId}/output.mp4`,
    renderProgress: 100,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();
    if (!jobId || !jobExists(jobId)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Fire and forget
    startRender(jobId).catch((err) => {
      console.error('[render-video] error:', err);
      updateJob(jobId, { status: 'error', errorMessage: String(err) });
    });

    return NextResponse.json({ message: 'Render started' }, { status: 202 });
  } catch (err) {
    console.error('[render-video]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
