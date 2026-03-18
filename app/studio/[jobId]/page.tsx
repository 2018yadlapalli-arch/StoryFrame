import { readJob, jobExists } from '@/lib/jobStore';
import { redirect } from 'next/navigation';
import StudioClient from './StudioClient';

export default async function StudioPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!jobExists(jobId)) redirect('/');
  const job = readJob(jobId);
  return <StudioClient initialJob={job} />;
}
