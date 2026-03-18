# StoryFrame — AI Video Creator

> Turn any photo into a cinematic 10-minute video, automatically.

---

## What Is This?

**Think of it like a magic storyteller for your photos.**

You take **one photo** — anything you care about — and the app turns it into a **10-minute cinematic video** with a full story, automatically.

---

## How It Works (3 Simple Steps)

**1. Upload your photo**
Drag and drop any image onto the website. That's it.

**2. AI writes the story**
The app uses AI to look at your photo and imagine:
- *What happened before this moment?*
- *What happened after?*

It writes a full narrative — like a short film plot — and breaks it into **20 scenes** (before, during, and after your photo).

**3. A video is created automatically**
For each of those 20 scenes, the AI generates a brand-new image. Then all 20 images are stitched together into a **10-minute video** with smooth, cinematic zoom and pan effects (called the Ken Burns effect) — the kind you see in documentaries.

---

## What You Can Do With It

- **Edit the story** before the video is made — change anything you don't like
- **Download the finished video** as an MP4 file
- **Share it** with anyone

---

## Real Example

Take a photo of an F-16 jet banking hard at an airshow. The app would:
- See a fighter jet in a dramatic maneuver against a blue sky
- Write a story about the pilot, the airshow, the crowd, the mission
- Generate images of the preflight, the takeoff, the maneuver, the landing
- Deliver a 10-minute video that feels like a mini documentary — from one photo

**No video editing skills needed. No AI knowledge needed. Just a photo.**

▶ [Watch sample videos on Google Drive](https://drive.google.com/drive/folders/1YN4CwYBOezkg5-BkIotmMbkg1_ogrc_M?usp=sharing)

---

## Running the App

> Requires Node.js 20 (via nvm) and local AI servers running on ports 8080 and 8081.

```bash
# Load Node.js
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"

# Start the app
cd "/home/nvidia/AI Video"
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Want to see a demo without any setup? Go to [http://localhost:3000/demo](http://localhost:3000/demo).

---

## Local AI Servers Required

| Server | Port | Purpose |
|--------|------|---------|
| Qwen3 (OpenAI-compatible) | 8080 | Reads your image and writes the story |
| FLUX.2 (OpenAI-compatible) | 8081 | Generates the 20 frame images |

Both must be running before you upload an image.

---

## Configuration

Edit `.env.local` to change settings:

| Variable | Default | What it does |
|----------|---------|--------------|
| `FRAME_COUNT` | 20 | Number of images to generate |
| `VIDEO_DURATION_SECONDS` | 600 | Final video length (600 = 10 min) |
| `IMAGE_GEN_SIZE` | 1024x1024 | Image resolution (use 512x512 for speed) |
| `IMAGE_GEN_STEPS` | 8 | Generation quality steps |
| `LLM_MAX_TOKENS` | 8192 | Max tokens for story generation |

---

## Tech Stack

- **Next.js 16** — Web framework
- **Qwen3** — Vision AI for image analysis and story writing
- **FLUX.2** — Image generation AI
- **FFmpeg** — Video rendering with Ken Burns pan/zoom effects
- **Tailwind CSS** — Styling
