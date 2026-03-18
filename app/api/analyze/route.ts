import { NextRequest, NextResponse } from 'next/server';
import { readJob, updateJob, jobExists } from '@/lib/jobStore';
import { analyzeImage } from '@/lib/claude';
import { FrameDescription } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json();
    if (!jobId || !jobExists(jobId)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const job = readJob(jobId);
    updateJob(jobId, { status: 'analyzing' });

    const result = await analyzeImage(job.originalImagePath);

    const frames: FrameDescription[] = result.frames.map((f) => ({
      index: f.index,
      timestamp: f.timestamp,
      description: f.description,
      imagePath: null,
      imageUrl: null,
      replicateId: null,
      isOriginal: f.index === result.originalFrameIndex,
      status: 'pending',
    }));

    const updated = updateJob(jobId, {
      status: 'analyzed',
      narration: result.narration,
      frames,
    });

    return NextResponse.json({
      narration: updated.narration,
      frames: updated.frames,
    });
  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: 'Analysis failed', detail: String(err) }, { status: 500 });
  }
}
