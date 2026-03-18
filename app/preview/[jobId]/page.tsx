import { redirect } from 'next/navigation';
import { jobExists } from '@/lib/jobStore';
import PreviewClient from './PreviewClient';

export default async function PreviewPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  if (!jobExists(jobId)) redirect('/');
  return <PreviewClient jobId={jobId} />;
}
