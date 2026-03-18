import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const client = new OpenAI({
  baseURL: process.env.VISION_LLM_URL || 'http://localhost:8080/v1',
  apiKey: 'local',
});

const MODEL       = process.env.VISION_LLM_MODEL || 'qwen3';
const FRAME_COUNT = parseInt(process.env.FRAME_COUNT || '20', 10);
const VIDEO_DUR   = parseInt(process.env.VIDEO_DURATION_SECONDS || '600', 10);
// Raise this if the model supports it — 8192 is safe for most local models
const MAX_TOKENS  = parseInt(process.env.LLM_MAX_TOKENS || '8192', 10);

const SYSTEM_PROMPT = `You are a cinematic storyteller and visual director.
Given an image, you will:
1. Write a vivid narrative story (2-3 paragraphs) describing what happened BEFORE this moment and what happens AFTER.
2. Generate exactly ${FRAME_COUNT} frame descriptions for a cinematic slideshow video.
   - Frames 0 to ${Math.floor(FRAME_COUNT * 0.4) - 1}: "before" scenes
   - Frame ${Math.floor(FRAME_COUNT * 0.4)}: the original image scene (anchor)
   - Frames ${Math.floor(FRAME_COUNT * 0.4) + 1} to ${FRAME_COUNT - 1}: "after" scenes
   Each description: one concise sentence (max 40 words) describing the visual scene for image generation.

Return ONLY valid JSON. No markdown, no code fences, no <think> tags, no explanation.`;

const USER_PROMPT = `Analyze this image. Return ONLY this JSON (no other text):
{
  "narration": "2-3 paragraph story...",
  "frames": [
    { "index": 0, "description": "one sentence visual scene description" },
    { "index": 1, "description": "..." }
  ]
}
Exactly ${FRAME_COUNT} frames, indexed 0 to ${FRAME_COUNT - 1}. Keep each description under 40 words.`;

export interface AnalysisResult {
  narration: string;
  frames: Array<{ index: number; description: string; timestamp: number }>;
  originalFrameIndex: number;
}

function detectMimeType(imagePath: string): string {
  const ext = path.extname(imagePath).toLowerCase();
  const map: Record<string, string> = {
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png',  '.webp': 'image/webp', '.gif': 'image/gif',
  };
  return map[ext] || 'image/jpeg';
}

function extractJson(raw: string): string {
  // Remove <think>...</think> blocks Qwen3 emits
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  // Extract the outermost {...} block
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }
  return text;
}

function repairTruncatedJson(json: string): string {
  // If JSON was cut off mid-stream, try to close it so we can parse what arrived
  let text = json.trimEnd();

  // Close any unterminated string
  const quoteCount = (text.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) text += '"';

  // Close open objects/arrays from the inside out
  const stack: string[] = [];
  for (const ch of text) {
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }
  // Close in reverse order
  while (stack.length) text += stack.pop();

  return text;
}

export async function analyzeImage(imagePath: string): Promise<AnalysisResult> {
  const imageBuffer    = fs.readFileSync(imagePath);
  const base64Image    = imageBuffer.toString('base64');
  const mediaType      = detectMimeType(imagePath);
  const frameDuration  = Math.round(VIDEO_DUR / FRAME_COUNT);
  const originalFrameIndex = Math.floor(FRAME_COUNT * 0.4);

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64Image}` } },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
  });

  const raw      = response.choices[0]?.message?.content ?? '';
  const finish   = response.choices[0]?.finish_reason;

  // Warn in server logs if the model was cut off
  if (finish === 'length') {
    console.warn(`[analyze] Warning: model hit max_tokens (${MAX_TOKENS}). Response may be truncated. Increase LLM_MAX_TOKENS env var.`);
  }

  let jsonText = extractJson(raw);

  // Attempt to repair truncated JSON before parsing
  let parsed: { narration?: string; frames?: { index: number; description: string }[] };
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // Try repairing and parsing again
    try {
      parsed = JSON.parse(repairTruncatedJson(jsonText));
      console.warn('[analyze] Used truncation repair to parse JSON');
    } catch {
      throw new Error(
        `Failed to parse JSON from model response (finish_reason=${finish}). ` +
        `Try increasing LLM_MAX_TOKENS in .env.local. ` +
        `Response preview: ${raw.slice(0, 300)}`
      );
    }
  }

  const narration = parsed.narration ?? 'No narration generated.';
  const rawFrames = Array.isArray(parsed.frames) ? parsed.frames : [];

  // If we got fewer frames than expected, pad with placeholders
  const frameMap = new Map(rawFrames.map(f => [f.index, f]));
  const frames = Array.from({ length: FRAME_COUNT }, (_, i) => {
    const f = frameMap.get(i);
    return {
      index: i,
      description: f?.description ?? `Cinematic scene ${i + 1}, continuing the visual story`,
      timestamp: i * frameDuration,
    };
  });

  if (rawFrames.length < FRAME_COUNT) {
    console.warn(`[analyze] Got ${rawFrames.length}/${FRAME_COUNT} frames — padded missing ones with placeholders.`);
  }

  return { narration, frames, originalFrameIndex };
}
