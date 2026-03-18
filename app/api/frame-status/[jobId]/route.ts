import { NextRequest, NextResponse } from 'next/server';
import { readJob, jobExists } from '@/lib/jobStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  if (!jobExists(jobId)) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  const job = readJob(jobId);
  const total = job.frames.length;
  const completed = job.frames.filter((f) => f.status === 'done' || f.status === 'error').length;

  return NextResponse.json({
    jobStatus: job.status,
    frames: job.frames.map((f) => ({
      index: f.index,
      status: f.status,
      imageUrl: f.imageUrl,
      isOriginal: f.isOriginal,
      description: f.description,
      errorMessage: f.errorMessage,
    })),
    completedCount: completed,
    totalCount: total,
    progress: total > 0 ? Math.round((completed / total) * 100) : 0,
  });
}
