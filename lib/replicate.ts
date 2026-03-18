import fs from 'fs';

const BASE_URL = process.env.IMAGE_GEN_URL || 'http://localhost:8081/v1';
const MODEL    = process.env.IMAGE_GEN_MODEL || 'flux';
// Use 512x512 for speed, 1024x1024 for quality (both confirmed working)
const IMG_SIZE = process.env.IMAGE_GEN_SIZE || '1024x1024';
const STEPS    = parseInt(process.env.IMAGE_GEN_STEPS || '8', 10);

export async function generateFrameImage(
  description: string,
  outputPath: string
): Promise<string> {
  const prompt = `${description}, cinematic photography, high quality, dramatic lighting`;

  const body = {
    model: MODEL,
    prompt,
    size: IMG_SIZE,
    num_inference_steps: STEPS,
    n: 1,
    response_format: 'b64_json',
  };

  console.log('[image-gen] POST', `${BASE_URL}/images/generations`);
  console.log('[image-gen] request body:', JSON.stringify(body, null, 2));

  const res = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const rawBody = await res.text();
  console.log(`[image-gen] response status: ${res.status}`);
  console.log('[image-gen] response body:', rawBody);

  if (!res.ok) {
    throw new Error(`Image generation failed (${res.status}): ${rawBody}`);
  }

  let json: { data?: Array<{ b64_json?: string; url?: string }> };
  try {
    json = JSON.parse(rawBody);
  } catch {
    throw new Error(`Image generation returned non-JSON response: ${rawBody.slice(0, 300)}`);
  }

  const imageData = json.data?.[0];
  if (!imageData) throw new Error('Image generation returned empty response');

  let imageBuffer: Buffer;

  if (imageData.b64_json) {
    imageBuffer = Buffer.from(imageData.b64_json, 'base64');
  } else if (imageData.url) {
    // Server returned a URL — fetch it
    const imgRes = await fetch(imageData.url);
    if (!imgRes.ok) throw new Error(`Failed to fetch image from URL: ${imageData.url}`);
    imageBuffer = Buffer.from(await imgRes.arrayBuffer());
  } else {
    throw new Error('Image generation response had no b64_json or url field');
  }

  fs.writeFileSync(outputPath, imageBuffer);
  return outputPath;
}
