import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';

// Use bundled ffmpeg binary — no system install required
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Try to use ffprobe-static if available
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ffprobeStatic = require('ffprobe-static');
  if (ffprobeStatic?.path) ffmpeg.setFfprobePath(ffprobeStatic.path);
} catch {
  // ffprobe not critical for our use case
}

type KenBurnsDirection =
  | 'zoom-in-center'
  | 'zoom-out-center'
  | 'pan-left-to-right'
  | 'pan-right-to-left'
  | 'pan-top-to-bottom'
  | 'pan-bottom-to-top'
  | 'zoom-in-topleft'
  | 'zoom-in-bottomright';

const DIRECTIONS: KenBurnsDirection[] = [
  'zoom-in-center',
  'pan-left-to-right',
  'zoom-out-center',
  'pan-right-to-left',
  'zoom-in-topleft',
  'pan-top-to-bottom',
  'zoom-in-bottomright',
  'pan-bottom-to-top',
];

function getKenBurnsFilter(direction: KenBurnsDirection, durationSec: number, fps = 24): string {
  const d = Math.round(durationSec * fps);
  const w = 1920;
  const h = 1080;

  const filters: Record<KenBurnsDirection, string> = {
    'zoom-in-center':
      `zoompan=z='min(zoom+0.0015,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=${fps}`,
    'zoom-out-center':
      `zoompan=z='if(lte(zoom,1.0),1.5,max(1.0,zoom-0.0015))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=${fps}`,
    'pan-left-to-right':
      `zoompan=z='1.3':x='min(iw/4,on*iw/(${d}*4))':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=${fps}`,
    'pan-right-to-left':
      `zoompan=z='1.3':x='max(0,iw/4-on*iw/(${d}*4))':y='ih/2-(ih/zoom/2)':d=${d}:s=${w}x${h}:fps=${fps}`,
    'pan-top-to-bottom':
      `zoompan=z='1.3':x='iw/2-(iw/zoom/2)':y='min(ih/4,on*ih/(${d}*4))':d=${d}:s=${w}x${h}:fps=${fps}`,
    'pan-bottom-to-top':
      `zoompan=z='1.3':x='iw/2-(iw/zoom/2)':y='max(0,ih/4-on*ih/(${d}*4))':d=${d}:s=${w}x${h}:fps=${fps}`,
    'zoom-in-topleft':
      `zoompan=z='min(zoom+0.002,1.8)':x='0':y='0':d=${d}:s=${w}x${h}:fps=${fps}`,
    'zoom-in-bottomright':
      `zoompan=z='min(zoom+0.002,1.8)':x='iw/4':y='ih/4':d=${d}:s=${w}x${h}:fps=${fps}`,
  };

  return filters[direction];
}

async function renderClip(
  imagePath: string,
  outputPath: string,
  durationSec: number,
  frameIndex: number
): Promise<void> {
  const direction = DIRECTIONS[frameIndex % DIRECTIONS.length];
  const kbFilter = getKenBurnsFilter(direction, durationSec);
  const fadeOut = `fade=t=out:st=${Math.max(0, durationSec - 0.5)}:d=0.5`;
  const fadeIn = `fade=t=in:st=0:d=0.5`;

  // Scale image up first so zoompan has room to move
  const scaleFilter = `scale=3840:2160:flags=lanczos`;
  const filterChain = `${scaleFilter},${kbFilter},${fadeIn},${fadeOut}`;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(imagePath)
      .inputOptions(['-loop 1', '-framerate 24'])
      .outputOptions([
        `-t ${durationSec}`,
        `-vf ${filterChain}`,
        '-c:v libx264',
        '-preset fast',
        '-crf 20',
        '-pix_fmt yuv420p',
        '-r 24',
        '-an',
      ])
      .output(outputPath)
      .on('error', (err) => reject(new Error(`Clip ${frameIndex} failed: ${err.message}`)))
      .on('end', () => resolve())
      .run();
  });
}

export interface RenderOptions {
  jobId: string;
  frames: Array<{ index: number; imagePath: string; durationSec: number }>;
  outputPath: string;
  onProgress?: (pct: number) => void;
}

export async function renderVideo(opts: RenderOptions): Promise<void> {
  const { frames, outputPath, onProgress } = opts;
  const clipPaths: string[] = [];
  const baseDir = path.dirname(outputPath);

  // Step 1: Render each frame as a Ken Burns clip
  for (const frame of frames) {
    const clipPath = path.join(baseDir, `clip_${frame.index}.mp4`);
    await renderClip(frame.imagePath, clipPath, frame.durationSec, frame.index);
    clipPaths.push(clipPath);
    if (onProgress) onProgress(Math.round((clipPaths.length / frames.length) * 80));
  }

  // Step 2: Write concat list
  const concatPath = path.join(baseDir, 'concat.txt');
  fs.writeFileSync(concatPath, clipPaths.map((p) => `file '${p}'`).join('\n'));

  // Step 3: Concatenate clips into final video
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(concatPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-c:v copy',
        '-movflags +faststart',
      ])
      .output(outputPath)
      .on('error', (err) => reject(new Error(`Concat failed: ${err.message}`)))
      .on('end', () => resolve())
      .run();
  });

  if (onProgress) onProgress(95);

  // Step 4: Cleanup intermediate files
  for (const cp of clipPaths) {
    try { fs.unlinkSync(cp); } catch { /* ignore */ }
  }
  try { fs.unlinkSync(concatPath); } catch { /* ignore */ }

  if (onProgress) onProgress(100);
}
