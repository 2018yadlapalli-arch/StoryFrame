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
  return NextResponse.json(readJob(jobId));
}
