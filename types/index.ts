export type JobStatus =
  | 'created'
  | 'analyzing'
  | 'analyzed'
  | 'generating_frames'
  | 'frames_ready'
  | 'rendering_video'
  | 'complete'
  | 'error';

export interface FrameDescription {
  index: number;
  timestamp: number;
  description: string;
  imagePath: string | null;
  imageUrl: string | null;
  replicateId: string | null;
  isOriginal: boolean;
  status: 'pending' | 'generating' | 'done' | 'error';
  errorMessage?: string;
}

export interface JobMeta {
  uploadedFileName: string;
  mimeType: string;
  totalDurationSeconds: number;
  fps: number;
  frameDurationSeconds: number;
}

export interface Job {
  id: string;
  createdAt: string;
  status: JobStatus;
  originalImagePath: string;
  originalImageUrl: string;
  narration: string;
  frames: FrameDescription[];
  videoPath: string | null;
  videoUrl: string | null;
  renderProgress: number;
  shareToken: string | null;
  errorMessage: string | null;
  meta: JobMeta;
}
