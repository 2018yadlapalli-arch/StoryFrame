'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import StepIndicator from '@/components/shared/StepIndicator';

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_NARRATION = `The F-16 Viper, tail number 757, had been the pride of the 57th Wing demonstration team for three consecutive seasons. Senior Airman Rodriguez had spent six hours meticulously preparing the aircraft — calibrating the fly-by-wire controls, checking the afterburner fuel delivery system, ensuring every red-and-silver panel sat flush against the composite skin. The airshow at Edwards Air Force Base drew 85,000 spectators, the largest crowd in its forty-year history.

Captain Sarah Chen had flown "The Thunderstrike" sequence 200 times in simulation and 47 times in the air. The maneuver required pulling 7.5 Gs through a rolling scissors at 400 knots, transitioning directly into a 70-degree bank with full afterburner — the kind of flying that made the crowd go silent before erupting. She'd been running it flawlessly in the two days of practice. Today, with cameras rolling and the blue Mojave sky as her canvas, she pushed the throttle through the gate.

The photograph catches the exact instant of maximum bank — wings vertical, the Viper's silver belly catching the late-afternoon sun, the afterburner painting a white contrail across the blue dome of the sky. In the stands, 85,000 people are holding their breath. Thirty seconds later, she'll pull the nose vertical, light the burner to full military power, and climb straight up until she disappears into the blue. The crowd will exhale as one.`;

const MOCK_FRAMES = [
  { index: 0,  desc: 'Edwards AFB flightline at dawn, rows of F-16s, ground crew in orange vests beginning preflight checks' },
  { index: 1,  desc: 'Pilot briefing room, Captain Chen studying maneuver cards, tactical displays glowing in dim light' },
  { index: 2,  desc: 'Ground crew chief inspecting F-16 engine intake, red-and-silver Thunderbirds livery gleaming under hangar lights' },
  { index: 3,  desc: 'Cockpit preflight — helmet visor down, oxygen mask connected, HUD glowing green in dark cockpit' },
  { index: 4,  desc: 'F-16 taxiing to runway, heat shimmer rising off tarmac, crowd safety barriers in the background' },
  { index: 5,  desc: 'Afterburner ignition on the runway — orange flame erupting from nozzle, aircraft shaking, smoke rolling' },
  { index: 6,  desc: 'Wheels-up, steep 60-degree climb angle, blue California sky opening vast and clear above the jet' },
  { index: 7,  desc: 'Diamond formation of four F-16s in tight spacing, contrails threading parallel lines through open sky' },
  { index: 8,  desc: 'Low-level high-speed pass at 200 feet, shock wave condensation cloud visible in the humid desert air' },
  { index: 9,  desc: 'Pulling into the vertical, G-suit inflating hard, horizon tilting dramatically, blue sky ahead' },
  { index: 10, desc: 'THE ANCHOR — F-16 in maximum 70-degree bank, silver belly to the sun, white contrail arcing across Mojave blue' },
  { index: 11, desc: 'Nose pitching vertical, full afterburner lit, climbing straight toward the sun on a column of fire' },
  { index: 12, desc: 'Inverted roll at 10,000 feet, canopy pointing toward the desert floor, clouds framing the scene' },
  { index: 13, desc: 'High-G break turn, wingtip vortex cones spiraling white against deep blue, full military power' },
  { index: 14, desc: 'Slow-speed pass with gear extended, demonstrating precise control authority at 150 knots over the crowd' },
  { index: 15, desc: 'Opposing solo pass — two F-16s crossing head-on at 1000 knots combined, crowd below gasping in awe' },
  { index: 16, desc: 'Final vertical climb, the Viper becoming a silver speck shrinking into deep endless Mojave blue' },
  { index: 17, desc: 'Landing approach over the crowd line, gear down, flaps extended, smoke from tires on perfect touchdown' },
  { index: 18, desc: 'Pilot climbing down from cockpit, crowd applauding, ground crew swarming the still-hot aircraft' },
  { index: 19, desc: 'Sunset over Edwards AFB, F-16 silhouettes against a blazing orange horizon, end of a perfect airshow day' },
];

// Gradient pairs: [from-color, to-color] — dark military dawn → sky blue → fire
const GRADIENTS = [
  ['#0f172a','#1e3a5f'], // 0  dawn flightline
  ['#1e293b','#334155'], // 1  briefing room
  ['#111827','#1f2937'], // 2  hangar interior
  ['#0a0f1a','#1a2744'], // 3  cockpit dark
  ['#1e3a5f','#2d5f9c'], // 4  blue sky taxi
  ['#7c2d12','#dc2626'], // 5  afterburner fire
  ['#1d4ed8','#3b82f6'], // 6  climb blue
  ['#0ea5e9','#38bdf8'], // 7  formation sky
  ['#164e63','#0e7490'], // 8  low pass teal
  ['#1e3a5f','#2563eb'], // 9  vertical pull
  ['#2c6fad','#4a9fd4'], // 10 anchor — Mojave blue
  ['#1d4ed8','#2563eb'], // 11 afterburner climb
  ['#0c4a6e','#1e3a5f'], // 12 inverted roll
  ['#1e40af','#3b82f6'], // 13 high-G turn
  ['#334155','#475569'], // 14 slow-speed pass
  ['#0f172a','#1e3a5f'], // 15 opposing pass
  ['#1e3a5f','#0369a1'], // 16 final climb
  ['#78350f','#b45309'], // 17 landing warm
  ['#374151','#4b5563'], // 18 pilot out
  ['#7c2d12','#c2410c'], // 19 sunset
];

type Phase = 'intro' | 'uploading' | 'analyzing' | 'studio' | 'generating' | 'frames_ready' | 'rendering' | 'complete';

// ── F-16 Viper SVG (used in all demo phases) ──────────────────────────────────
// Jet at translate(390,225) rotate(-38): nose→lower-left, engine→upper-right (~500,139)
// Contrail path flows from lower-left of canvas up to the engine position.
function JetSVG({ id = 'a', animated = false }: { id?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 800 450" className="absolute inset-0 w-full h-full">
      <defs>
        {/* Mojave sky — steel blue matching the photo */}
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0.15" y2="1">
          <stop offset="0%" stopColor="#1e4a72"/>
          <stop offset="50%" stopColor="#3a7faa"/>
          <stop offset="100%" stopColor="#5da3c8"/>
        </linearGradient>
        {/* Fuselage silver sheen */}
        <linearGradient id={`fuse-${id}`} x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8"/>
          <stop offset="35%" stopColor="#e2e8f0"/>
          <stop offset="100%" stopColor="#78909c"/>
        </linearGradient>
        {/* Afterburner core */}
        <radialGradient id={`burn-${id}`} cx="25%" cy="50%" r="75%">
          <stop offset="0%"   stopColor="#ffffff"/>
          <stop offset="20%"  stopColor="#fde68a"/>
          <stop offset="55%"  stopColor="#f97316" stopOpacity="0.75"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>
        {/* Afterburner outer glow */}
        <radialGradient id={`burnGlow-${id}`} cx="25%" cy="50%" r="75%">
          <stop offset="0%"   stopColor="#f97316" stopOpacity="0.55"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="800" height="450" fill={`url(#sky-${id})`}/>
      {/* Subtle horizon haze */}
      <rect x="0" y="380" width="800" height="70" fill="#7ec8e3" opacity="0.06"/>

      {/* ── CONTRAIL (flight path from lower-left up to engine at ~500,139) ── */}
      {/* Wide outer diffusion */}
      <path d="M55,345 C160,295 275,250 385,213 C435,196 470,172 500,140"
        stroke="white" strokeWidth="22" strokeLinecap="round" fill="none" opacity="0.10"/>
      {/* Mid trail */}
      <path d="M55,345 C160,295 275,250 385,213 C435,196 470,172 500,140"
        stroke="white" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.22"/>
      {/* Bright core */}
      <path d="M220,278 C310,248 390,218 460,178 C480,166 493,152 500,140"
        stroke="white" strokeWidth="4"  strokeLinecap="round" fill="none" opacity="0.55"/>
      {/* Animated shimmer when playing */}
      {animated && (
        <path d="M55,345 C160,295 275,250 385,213 C435,196 470,172 500,140"
          stroke="white" strokeWidth="24" strokeLinecap="round" fill="none"
          strokeDasharray="18 9" opacity="0">
          <animate attributeName="opacity" values="0.04;0.14;0.04" dur="2.8s" repeatCount="indefinite"/>
          <animate attributeName="stroke-dashoffset" values="0;-270" dur="2.8s" repeatCount="indefinite"/>
        </path>
      )}

      {/* ── F-16 VIPER — translate(390,225) rotate(-38) ── */}
      <g transform="translate(390,225) rotate(-38)">

        {/* === DELTA WINGS === */}
        {/* Upper wing (away from viewer / top side) */}
        <polygon points="-28,-14 -108,-118 28,-17" fill="#b0bec5"/>
        <polygon points="-28,-14 -108,-118 -22,-16" fill="#cfd8dc" opacity="0.6"/>
        {/* Leading-edge highlight */}
        <line x1="-28" y1="-14" x2="-108" y2="-118" stroke="#e2e8f0" strokeWidth="1.2" opacity="0.5"/>
        {/* Lower wing (belly side, more visible from camera angle) */}
        <polygon points="-28,14 -92,112 32,19" fill="#90a4ae" opacity="0.92"/>
        {/* Wing strake (curved root fairing) */}
        <polygon points="8,-14 -28,-14 -82,-105 -60,-114 18,-16" fill="#9ca3af" opacity="0.55"/>

        {/* === HORIZONTAL STABILIZERS (rear) === */}
        <polygon points="84,2 132,-44 120,0"  fill="#90a4ae" opacity="0.9"/>
        <polygon points="84,2 130, 46 118,2"  fill="#78909c" opacity="0.8"/>

        {/* === VERTICAL TAIL FIN (signature tall F-16 fin) === */}
        <polygon points="72,-4 108,-82 118,-2" fill="#dc2626"/>
        <polygon points="74,-5 105,-74 110,-5" fill="#ef4444" opacity="0.4"/>
        <line x1="74" y1="-5" x2="106" y2="-76" stroke="#fca5a5" strokeWidth="1" opacity="0.35"/>

        {/* === FUSELAGE === */}
        <ellipse cx="0" cy="0" rx="148" ry="16" fill={`url(#fuse-${id})`}/>
        {/* Red Thunderbirds spine stripe */}
        <rect x="-52" y="-15" width="94" height="7" rx="2" fill="#dc2626" opacity="0.92"/>
        {/* White belly — "U.S. AIR FORCE" area */}
        <ellipse cx="-6" cy="9.5" rx="98" ry="9" fill="#f8fafc" opacity="0.93"/>
        {/* USAF text band (stylised) */}
        <rect x="-58" y="5" width="85" height="8" rx="2" fill="white" opacity="0.45"/>
        {/* Red star-and-bar roundel hint */}
        <circle cx="10" cy="9" r="5" fill="#dc2626" opacity="0.7"/>
        <circle cx="10" cy="9" r="3" fill="white" opacity="0.8"/>
        {/* Fuselage sheen */}
        <ellipse cx="-8" cy="-6" rx="88" ry="6" fill="white" opacity="0.07"/>

        {/* === AIR INTAKE (below-forward fuselage) === */}
        <ellipse cx="-67" cy="12" rx="20" ry="7.5" fill="#1e293b" opacity="0.92"/>
        <ellipse cx="-67" cy="12" rx="15" ry="5"   fill="#0f172a"/>

        {/* === COCKPIT CANOPY === */}
        <ellipse cx="-74" cy="-12" rx="27" ry="12"  fill="#1e3a5f" opacity="0.95"/>
        <ellipse cx="-78" cy="-13" rx="20" ry="8.5" fill="#2d5a8f" opacity="0.5"/>
        {/* Canopy glint */}
        <ellipse cx="-83" cy="-15" rx="11" ry="4" fill="white" opacity="0.14"/>

        {/* === NOSE === */}
        <ellipse cx="-148" cy="0" rx="14" ry="10" fill="#4b5563"/>
        <polygon points="-161,0 -220,-2 -220,2" fill="#374155"/>

        {/* === LANDING GEAR DOOR FAIRING === */}
        <rect x="-35" y="12" width="22" height="6" rx="2" fill="#475569" opacity="0.45"/>

        {/* === ENGINE NOZZLE === */}
        <ellipse cx="150" cy="0" rx="15" ry="11" fill="#374151"/>
        <ellipse cx="153" cy="0" rx="10" ry="7"  fill="#1f2937"/>
        <ellipse cx="154" cy="0" rx="7"  ry="5"  fill="#111827"/>

        {/* === AFTERBURNER FLAME === */}
        <ellipse cx="170" cy="0"
          rx={animated ? 34 : 18} ry={animated ? 16 : 9}
          fill={`url(#burn-${id})`} opacity={animated ? 0.95 : 0.3}>
          {animated && <animate attributeName="rx" values="34;48;24;40;34" dur="0.18s" repeatCount="indefinite"/>}
          {animated && <animate attributeName="ry" values="16;20;11;17;16" dur="0.18s" repeatCount="indefinite"/>}
          {animated && <animate attributeName="opacity" values="0.95;1;0.6;0.9;0.95" dur="0.18s" repeatCount="indefinite"/>}
        </ellipse>
        {/* Outer glow */}
        <ellipse cx="175" cy="0"
          rx={animated ? 62 : 28} ry={animated ? 32 : 14}
          fill={`url(#burnGlow-${id})`} opacity={animated ? 0.38 : 0.08}>
          {animated && <animate attributeName="rx" values="62;88;44;70;62" dur="0.18s" repeatCount="indefinite"/>}
          {animated && <animate attributeName="opacity" values="0.38;0.55;0.2;0.44;0.38" dur="0.18s" repeatCount="indefinite"/>}
        </ellipse>

        {/* Wingtip navigation light — blinks green when flying */}
        {animated && (
          <circle cx="-108" cy="-120" r="3.5" fill="#22c55e" opacity="0">
            <animate attributeName="opacity" values="0;0.9;0" dur="1.4s" repeatCount="indefinite"/>
          </circle>
        )}
      </g>

      {/* Sunlight glint on canopy glass */}
      <ellipse cx="317" cy="191" rx="17" ry="5" fill="white" opacity="0.18"
        transform="rotate(-38,317,191)"/>
      {/* Belly sunlight sheen */}
      <ellipse cx="362" cy="234" rx="36" ry="7" fill="white" opacity="0.11"
        transform="rotate(-38,362,234)"/>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [phase, setPhase]               = useState<Phase>('intro');
  const [analyzeProgress, setAnalyzePct]= useState(0);
  const [analyzeTick, setAnalyzeTick]   = useState(0);
  const [framesDone, setFramesDone]     = useState(0);
  const [renderProgress, setRenderPct]  = useState(0);
  const [narration, setNarration]       = useState(MOCK_NARRATION);
  const [frames, setFrames]             = useState(MOCK_FRAMES.map(f => ({ ...f, done: false })));
  const [isPlaying, setIsPlaying]       = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const timerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Advance ~1% per tick (30ms) → full 10-min demo plays in ~3 seconds of demo time
  // but visually shows a "scrubbing" feel; adjust divisor to taste
  const TICK_PCT = 100 / 900; // ~0.111% per tick → ~27s to complete

  useEffect(() => {
    if (isPlaying) {
      playInterval.current = setInterval(() => {
        setPlayProgress(p => {
          if (p >= 100) { setIsPlaying(false); return 100; }
          return Math.min(100, p + TICK_PCT);
        });
      }, 30);
    } else {
      if (playInterval.current) clearInterval(playInterval.current);
    }
    return () => { if (playInterval.current) clearInterval(playInterval.current); };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (playProgress >= 100) { setPlayProgress(0); return true; }
      return !prev;
    });
  }, [playProgress]);

  function formatTime(pct: number) {
    const secs = Math.floor((pct / 100) * 600);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setPlayProgress(pct);
  }

  function delay(ms: number) {
    return new Promise<void>(r => { timerRef.current = setTimeout(r, ms); });
  }

  async function runUpload() {
    setPhase('uploading');
    await delay(700);
    setPhase('analyzing');
    setAnalyzeTick(0);
    for (let i = 0; i <= 100; i += 4) {
      setAnalyzePct(i);
      if (i === 25) setAnalyzeTick(1);
      if (i === 55) setAnalyzeTick(2);
      if (i === 80) setAnalyzeTick(3);
      await delay(55);
    }
    await delay(350);
    setPhase('studio');
  }

  async function runGenerate() {
    setPhase('generating');
    setFramesDone(0);
    setFrames(MOCK_FRAMES.map(f => ({ ...f, done: false })));
    for (let i = 0; i < MOCK_FRAMES.length; i++) {
      await delay(260);
      const idx = i;
      setFramesDone(idx + 1);
      setFrames(prev => prev.map((f, j) => j === idx ? { ...f, done: true } : f));
    }
    await delay(350);
    setPhase('frames_ready');
  }

  async function runRender() {
    setPhase('rendering');
    setRenderPct(0);
    for (let i = 0; i <= 100; i += 2) {
      setRenderPct(i);
      await delay(75);
    }
    await delay(250);
    setPhase('complete');
  }

  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (playInterval.current) clearInterval(playInterval.current);
    setPhase('intro');
    setAnalyzePct(0); setAnalyzeTick(0);
    setFramesDone(0); setRenderPct(0);
    setNarration(MOCK_NARRATION);
    setFrames(MOCK_FRAMES.map(f => ({ ...f, done: false })));
    setIsPlaying(false); setPlayProgress(0);
  }

  const currentStep: 1|2|3 =
    ['intro','uploading','analyzing'].includes(phase) ? 1
    : ['studio','generating','frames_ready'].includes(phase) ? 2
    : 3;

  return (
    <div className="max-w-7xl mx-auto">

      {/* ── Demo banner ───────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 border border-brand-500/25 animate-fade-in"
        style={{ background: 'linear-gradient(90deg, rgba(249,115,22,0.07), rgba(251,191,36,0.05))' }}>
        <span className="text-xs font-bold uppercase tracking-widest text-brand-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Demo Mode
        </span>
        <span className="text-gray-400 text-sm flex-1">
          Simulated walkthrough — no API calls made. All content is pre-loaded mock data.
        </span>
        <Link href="/" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">← Back to app</Link>
      </div>

      <StepIndicator currentStep={currentStep} />

      {/* ══════════════════════════════════════════════════════════════════
          STEP 1 — Upload / Analyze
      ══════════════════════════════════════════════════════════════════ */}
      {['intro','uploading','analyzing'].includes(phase) && (
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
          <div className="text-center">
            <h1 className="text-5xl font-extrabold tracking-tight mb-4">
              Turn any image into a{' '}
              <span className="text-gradient">cinematic video</span>
            </h1>
            <p className="text-gray-400 text-lg">
              Upload any photo · AI writes the story · generates 20 cinematic frames · renders a 10-minute video
            </p>
          </div>

          {/* Upload card */}
          <div className="rounded-2xl p-6 border border-gray-800/60 space-y-5"
            style={{ background: 'linear-gradient(180deg,rgba(17,24,39,0.85),rgba(9,9,11,0.95))' }}>

            {/* Image preview with film frame corners */}
            <div className="relative aspect-video rounded-xl overflow-hidden group">
              <JetSVG id="upload" />
              {/* Film grain overlay */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none film-flicker"
                style={{
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                  backgroundSize: '150px',
                }}
              />
              {/* Film frame corners */}
              {[['top-2 left-2','top','left'],['top-2 right-2','top','right'],['bottom-2 left-2','bottom','left'],['bottom-2 right-2','bottom','right']].map(([pos,,], ci) => (
                <span key={ci} className={`absolute ${pos} w-4 h-4 opacity-60`} style={{
                  borderTop:    ci < 2 ? '2px solid #f97316' : 'none',
                  borderBottom: ci >= 2 ? '2px solid #f97316' : 'none',
                  borderLeft:   ci % 2 === 0 ? '2px solid #f97316' : 'none',
                  borderRight:  ci % 2 === 1 ? '2px solid #f97316' : 'none',
                }} />
              ))}
              {/* Scan line overlay while analyzing */}
              {phase === 'analyzing' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute left-0 right-0 h-px animate-scan"
                    style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.7),transparent)' }} />
                </div>
              )}
              {phase !== 'intro' && (
                <div className="absolute inset-0 bg-black/40 flex items-end pb-3 justify-center">
                  <span className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1 text-sm text-gray-300 font-mono">
                    f16_thunderbird.jpg
                  </span>
                </div>
              )}
            </div>

            {/* File row */}
            {phase === 'intro' && (
              <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-4 py-2.5 border border-gray-700/40 animate-fade-in">
                <span className="text-green-400">✓</span>
                <span className="text-sm text-gray-300">f16_thunderbird.jpg</span>
                <span className="text-gray-600 ml-auto text-sm">2.4 MB</span>
              </div>
            )}

            {/* Upload progress */}
            {phase === 'uploading' && (
              <div className="space-y-2 animate-slide-up">
                <div className="flex items-center gap-3 text-brand-400">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor:'#f97316' }} />
                  <span className="text-sm font-medium">Uploading image...</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full progress-shine rounded-full w-1/2" />
                </div>
              </div>
            )}

            {/* Analyze progress */}
            {phase === 'analyzing' && (
              <div className="space-y-3 animate-slide-up">
                <div className="flex items-center gap-3 text-brand-400">
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor:'#f97316' }} />
                  <span className="text-sm font-medium">Qwen3 is analyzing your image...</span>
                  <span className="ml-auto text-xs text-gray-600 font-mono">{analyzeProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full progress-shine rounded-full transition-all duration-100"
                    style={{ width: `${analyzeProgress}%` }} />
                </div>
                {/* Checklist */}
                <div className="rounded-xl p-3.5 border border-gray-700/30 space-y-2"
                  style={{ background: 'rgba(17,24,39,0.6)' }}>
                  {[
                    'Identifying scene, subjects, and emotional context',
                    'Writing the narrative arc — before & after',
                    'Crafting 20 cinematic frame descriptions',
                  ].map((text, i) => (
                    <div key={i} className={`flex items-center gap-2.5 text-xs transition-all duration-500 ${
                      analyzeTick > i ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] shrink-0 transition-all duration-300 ${
                        analyzeTick > i ? 'border-brand-500 text-brand-300' : 'border-gray-700'
                      }`}
                        style={analyzeTick > i ? { background: 'rgba(249,115,22,0.15)' } : {}}>
                        {analyzeTick > i ? '✓' : i + 1}
                      </div>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase === 'intro' && (
              <button
                onClick={runUpload}
                className="relative w-full py-3.5 rounded-xl font-semibold text-white overflow-hidden btn-glow active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316,#ea580c)', backgroundSize:'200% 100%', animation:'gradient-shift 3s ease infinite' }}
              >
                <span className="relative">Analyze &amp; Generate Story →</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2 — Studio
      ══════════════════════════════════════════════════════════════════ */}
      {['studio','generating','frames_ready'].includes(phase) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">

          {/* ── Left panel ──────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Original image */}
            <div className="rounded-2xl border border-gray-800 overflow-hidden"
              style={{ background: 'rgba(17,24,39,0.8)' }}>
              <div className="relative aspect-video">
                <JetSVG id="studio" />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded px-2 py-0.5 text-xs text-gray-300 font-mono">
                  f16_thunderbird.jpg
                </div>
              </div>
            </div>

            {/* Narration editor */}
            <div className="rounded-2xl border border-gray-800/60 p-4 space-y-3"
              style={{ background: 'rgba(17,24,39,0.8)' }}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white text-sm">Narration</h2>
                <span className="text-[10px] font-semibold text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full uppercase tracking-wide">
                  AI Generated
                </span>
              </div>
              <textarea
                value={narration}
                onChange={e => setNarration(e.target.value)}
                disabled={phase === 'generating'}
                rows={9}
                className="w-full bg-gray-800/60 text-gray-300 text-xs rounded-xl px-3 py-2.5 border border-gray-700/40
                  focus:outline-none focus:border-brand-500/40 resize-none scrollbar-thin leading-relaxed
                  disabled:opacity-40 transition-colors"
              />
              <p className="text-[11px] text-gray-600">Edit freely before generating frames.</p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {phase === 'studio' && (
                <button
                  onClick={runGenerate}
                  className="relative w-full py-3 rounded-xl font-semibold text-white overflow-hidden btn-glow active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', backgroundSize:'200% 100%', animation:'gradient-shift 3s ease infinite' }}
                >
                  Generate 20 Frame Images →
                </button>
              )}

              {phase === 'generating' && (
                <div className="space-y-2 rounded-xl border border-gray-800/60 p-3"
                  style={{ background: 'rgba(17,24,39,0.8)' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-brand-400 font-medium flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin inline-block"
                        style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor:'#f97316' }} />
                      FLUX.2 generating
                    </span>
                    <span className="text-xs text-gray-400 font-mono">{framesDone} / 20</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full progress-shine rounded-full transition-all duration-300"
                      style={{ width: `${(framesDone / 20) * 100}%` }} />
                  </div>
                </div>
              )}

              {phase === 'frames_ready' && (
                <div className="space-y-3 animate-slide-up">
                  <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
                    <span className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-xs">✓</span>
                    All 20 frames ready!
                  </div>
                  <button
                    onClick={runRender}
                    className="relative w-full py-3 rounded-xl font-semibold text-white overflow-hidden active:scale-[0.98] transition-all"
                    style={{ background: 'linear-gradient(135deg,#065f46,#059669)', boxShadow:'0 0 20px rgba(16,185,129,0.2)' }}
                  >
                    Render Video →
                  </button>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-gray-800/40 p-3 space-y-1.5 text-xs text-gray-500"
              style={{ background: 'rgba(9,9,11,0.5)' }}>
              {[
                ['Video length','10 minutes'],
                ['Frames','20 images × 30s each'],
                ['Resolution','1920×1080 @ 24fps'],
                ['Effect','Ken Burns pan & zoom'],
              ].map(([k,v]) => (
                <p key={k}><strong className="text-gray-400">{k}:</strong> {v}</p>
              ))}
            </div>
          </div>

          {/* ── Frame grid ──────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-white text-lg">
                Video Frames
                <span className="ml-2 text-sm text-gray-500 font-normal">({framesDone}/20)</span>
              </h2>
              {phase === 'generating' && (
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                  Generating
                </span>
              )}
              {phase === 'frames_ready' && (
                <span className="text-xs font-semibold text-green-400 flex items-center gap-1.5 animate-scale-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Complete
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {frames.map((frame, i) => {
                const isGenerating = phase === 'generating' && i === framesDone && i < 20;
                const isDone = frame.done;
                const isAnchor = i === 10;
                const delay = Math.min(i * 35, 400);

                return (
                  <div
                    key={i}
                    className={`rounded-xl border overflow-hidden transition-all duration-300 opacity-0 animate-slide-up group cursor-default`}
                    style={{
                      animationDelay: `${delay}ms`,
                      animationFillMode: 'forwards',
                      borderColor: isAnchor
                        ? 'rgba(249,115,22,0.5)'
                        : isDone
                        ? 'rgba(55,65,81,0.8)'
                        : 'rgba(31,41,55,0.6)',
                      background: isAnchor ? 'rgba(249,115,22,0.05)' : 'rgba(17,24,39,0.7)',
                      boxShadow: isDone && isAnchor ? '0 0 16px rgba(249,115,22,0.15)' : undefined,
                    }}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden"
                      style={{ background: `linear-gradient(135deg,${GRADIENTS[i][0]},${GRADIENTS[i][1]})` }}>

                      {/* Gradient shimmer while generating */}
                      {isGenerating && <div className="absolute inset-0 shimmer" />}

                      {/* Texture lines on done frames */}
                      {isDone && (
                        <div className="absolute inset-0 opacity-20"
                          style={{
                            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 4px,rgba(255,255,255,0.03) 4px,rgba(255,255,255,0.03) 5px)',
                          }} />
                      )}

                      {/* Spinner */}
                      {isGenerating && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                            style={{ borderColor:'rgba(249,115,22,0.3)', borderTopColor:'#fb923c' }} />
                          <span className="text-[9px] text-brand-400 font-bold tracking-widest uppercase">Flux</span>
                        </div>
                      )}

                      {!isDone && !isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-20 text-xl">
                          {isAnchor ? '📷' : '🎨'}
                        </div>
                      )}

                      {/* Badge row */}
                      <div className="absolute top-1 left-1 bg-black/70 rounded px-1 py-px text-[9px] text-gray-400 font-mono">
                        {String(i + 1).padStart(2,'0')}
                      </div>
                      {isAnchor && (
                        <div className="absolute top-1 right-1 rounded px-1 py-px text-[9px] font-bold text-white"
                          style={{ background:'linear-gradient(135deg,#ea580c,#f97316)' }}>
                          SOURCE
                        </div>
                      )}
                      {isDone && !isAnchor && (
                        <div className="absolute bottom-1 right-1 text-green-400 text-[10px] animate-scale-in">✓</div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="p-2 space-y-1.5">
                      <div className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-px rounded-full font-medium ${
                        isDone ? 'bg-green-600/20 text-green-400'
                        : isGenerating ? 'bg-brand-600/25 text-brand-300'
                        : 'bg-gray-700/60 text-gray-500'
                      }`}>
                        <span className={`w-1 h-1 rounded-full bg-current ${isGenerating ? 'animate-pulse' : ''}`} />
                        {isDone ? 'Done' : isGenerating ? 'Generating' : 'Pending'}
                      </div>
                      <p className="text-gray-500 text-[10px] leading-relaxed line-clamp-2 group-hover:text-gray-400 transition-colors">
                        {frame.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 3 — Preview
      ══════════════════════════════════════════════════════════════════ */}
      {['rendering','complete'].includes(phase) && (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">
              {phase === 'complete'
                ? <><span className="text-gradient">Your video is ready</span> ✦</>
                : 'Rendering your video...'}
            </h1>
            <p className="text-gray-400">
              {phase === 'complete'
                ? 'Watch, download, or share your cinematic story.'
                : 'FFmpeg is applying Ken Burns effects and stitching 20 frames together.'}
            </p>
          </div>

          {/* Render progress */}
          {phase === 'rendering' && (
            <div className="rounded-2xl border border-gray-800/60 p-10 text-center space-y-6"
              style={{ background: 'linear-gradient(180deg,rgba(17,24,39,0.9),rgba(9,9,11,0.95))' }}>
              <div className="text-5xl animate-float">🎬</div>
              <div>
                <p className="text-brand-400 font-semibold mb-1">Rendering 1920×1080 @ 24fps</p>
                <p className="text-xs text-gray-600">
                  {renderProgress < 80 ? 'Applying Ken Burns pan/zoom effects...' : 'Concatenating clips into final MP4...'}
                </p>
              </div>
              <div className="max-w-sm mx-auto space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Progress</span>
                  <span className="font-mono">{renderProgress}%</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden"
                  style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)' }}>
                  <div className="h-full progress-shine rounded-full transition-all duration-100"
                    style={{ width: `${Math.max(3, renderProgress)}%` }} />
                </div>
                {/* Frame counter */}
                <p className="text-xs text-gray-700">
                  Frame {Math.round(renderProgress * 0.2)}/20 rendered
                </p>
              </div>
            </div>
          )}

          {/* Video player */}
          {phase === 'complete' && (
            <div className="space-y-5 animate-scale-in">
              {/* Player */}
              <div className="rounded-2xl overflow-hidden border border-gray-800/60 relative aspect-video bg-black"
                style={{ boxShadow: '0 0 60px rgba(249,115,22,0.1), 0 20px 60px rgba(0,0,0,0.5)' }}>
                {/* Ken Burns animated background */}
                <div className="absolute inset-0 film-flicker">
                  <JetSVG id="player" animated={isPlaying} />
                </div>
                {/* Slow Ken Burns CSS animation — only runs while playing */}
                <div className="absolute inset-0 transition-transform duration-1000"
                  style={{ animation: isPlaying ? 'kenBurns 10s ease-in-out infinite alternate' : 'none', transformOrigin: 'center center' }}>
                  <div className="absolute inset-0 opacity-40"
                    style={{ background: 'linear-gradient(135deg,rgba(120,53,15,0.3),rgba(15,23,42,0.2))' }} />
                </div>
                {/* Film grain */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
                  style={{
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
                    backgroundSize: '120px',
                  }}
                />
                {/* Demo badge */}
                <div className="absolute top-3 right-3 rounded-md px-2 py-1 text-xs font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  Demo Preview
                </div>
                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4"
                  style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.85),transparent)' }}>
                  {/* Seek bar */}
                  <div
                    className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden cursor-pointer mb-3 group/seek"
                    onClick={seekTo}
                    title="Click to seek"
                  >
                    <div className="h-full rounded-full transition-all duration-75 group-hover/seek:brightness-125"
                      style={{ width: `${playProgress}%`, background: 'linear-gradient(90deg,#ea580c,#f97316)' }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={togglePlay}
                      className="text-white text-xl hover:text-brand-400 transition-colors w-7 text-center"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <span className="text-white text-xs font-mono tabular-nums">{formatTime(playProgress)} / 10:00</span>
                    <div className="flex-1" />
                    <span className="text-white/50 text-xs font-mono">DEMO</span>
                  </div>
                </div>
                <style>{`@keyframes kenBurns{from{transform:scale(1) translate(0,0)}to{transform:scale(1.12) translate(-1.5%,-1%)}}`}</style>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button disabled className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white/40 cursor-not-allowed border border-gray-800"
                  style={{ background: 'rgba(234,88,12,0.15)' }}>
                  ⬇ Download MP4 <span className="text-xs opacity-60">(demo)</span>
                </button>
                <button disabled className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white/40 cursor-not-allowed border border-gray-800"
                  style={{ background: 'rgba(55,65,81,0.4)' }}>
                  🔗 Copy Link <span className="text-xs opacity-60">(demo)</span>
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
                    border border-gray-700 hover:border-gray-600 transition-all active:scale-95"
                  style={{ background: 'rgba(55,65,81,0.6)' }}
                >
                  ↺ Replay Demo
                </button>
              </div>

              {/* CTA */}
              <div className="rounded-2xl p-6 text-center space-y-3 border border-brand-500/20"
                style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.08),rgba(251,191,36,0.04))' }}>
                <p className="text-white font-bold text-xl">Ready to create your own?</p>
                <p className="text-gray-400 text-sm">Make sure your local AI servers are running at :8080 and :8081, then upload any image.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white
                    transition-all active:scale-95 btn-glow"
                  style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', backgroundSize:'200% 100%', animation:'gradient-shift 3s ease infinite' }}
                >
                  Try it with your image →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
