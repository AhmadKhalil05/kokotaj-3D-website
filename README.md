# koko — Coconut Product 3D Scroll Website

A premium, Apple-style 3D scroll-animation product showcase website built with **Preact + Vite**. Engineered for maximum performance and buttery-smooth 24 FPS scrolling experiences on any device.

---

## 🧠 Architecture Decisions & Technical Discussion

### ❌ Why NOT Video Scrubbing

One of the first approaches considered was scrubbing a WebM/MP4 video's `currentTime` on scroll. **This was rejected** for the following reasons:

- iOS Safari and various desktop browsers handle `video.currentTime` seeking poorly.
- Seeking introduces massive keyframe decoding delays.
- Results in choppy, unreliable playback especially on lower-end devices.
- The browser's video pipeline is optimized for sequential playback, not random-access jumping.

### ❌ Why NOT Raw JPEG Sequences (30 FPS)

Splitting a video into 30 FPS JPEGs and toggling an `<img>` tag's `src` attribute was also rejected:

- Swapping `src` causes the browser to re-decode the JPEG on the main thread every frame.
- 30 FPS is unnecessarily high and adds significant asset overhead.
- JPEG format has higher CPU decoding cost compared to WebP.
- **24 FPS is the cinematic standard** and is more than sufficient.

---

## ✅ Chosen Architecture: Preloaded WebP Sequence + HTML5 Canvas + Lerp

This is exactly how Apple builds their product pages. The strategy works as follows:

### 1. Asset Strategy

- **24 FPS** animation export — cinematic standard, reduces total frame count significantly.
- **Two separate video exports** for responsive design:
  - **Desktop** → 16:9 aspect ratio
  - **Mobile** → 9:16 aspect ratio (tightly framed for portrait screens)
- Extract frames using `ffmpeg` or a batch converter.

### 2. Differential Compression

| Platform | Folder | WebP Quality | Reasoning |
|---|---|---|---|
| Desktop | `/public/assets/desktop/` | 75–80% | Crisp metallic textures on large monitors |
| Mobile | `/public/assets/mobile/` | 55–60% | Smaller screens + Retina DPI masks artifacts |

Mobile assets are compressed more aggressively because high-DPI mobile screens can absorb quality loss invisibly, while saving significant bandwidth for users on the go.

### 3. Smart Conditional Preloading

Before starting the loading sequence, a device-type check ensures **only one asset set** is ever loaded into memory:

```js
const isMobile = window.matchMedia("(max-width: 768px)").matches;
const assetFolder = isMobile ? "/assets/mobile" : "/assets/desktop";
```

This guarantees we never waste memory or bandwidth downloading both portrait and landscape sequences.

### 4. Browser-Native Image Decoding (`img.decode()`)

Every image is decoded in the browser's **background thread** using the native `img.decode()` API before the loading screen is dismissed. This means:

- The main thread (and thus the scroll loop) is **never blocked** by image decoding.
- Frames are instantly available in RAM during scrolling with **0ms latency**.
- Devices with slower CPUs still get smooth output because all hard work is done upfront.

### 5. HTML5 Canvas Rendering (Not `<img>` tags)

All frames are drawn onto an HTML5 `<canvas>` element using the **hardware-accelerated 2D context**. This is vastly superior to cycling the `src` of an `<img>` tag because:

- Canvas drawing is GPU-accelerated.
- No DOM layout recalculations triggered on every frame change.
- Full control over aspect ratio cropping (custom `object-fit: cover` logic).

### 6. Linear Interpolation (Lerp) for Smooth Scrolling

The scroll position is **never mapped directly** to a frame index. Direct mapping causes jarring snaps when the user moves their mouse wheel quickly.

Instead, a Lerp (Linear Interpolation) function is applied inside a `requestAnimationFrame` loop:

```js
currentFrame += (targetFrame - currentFrame) * 0.08;
```

This creates a cushioned, organic easing effect where the animation "chases" the scroll position smoothly. The factor `0.08` (configurable) controls how tight or loose the response feels.

### 7. High-DPI / Retina Support

The canvas buffer is sized using `window.devicePixelRatio` to ensure pixel-perfect sharpness on Retina and QHD displays:

```js
const dpr = window.devicePixelRatio || 1;
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);
```

### 8. `object-fit: cover` on Canvas

A custom `drawImageCover` function replicates CSS `object-fit: cover` behavior inside the canvas draw loop. This means the animation always fills the screen perfectly regardless of aspect ratio mismatch between the source asset and the user's viewport, with the subject centered and sides cropped cleanly.

---

## ⚙️ Framework Choice: Preact + Vite

### Why NOT pure Vanilla JS?

While Vanilla TS has zero runtime overhead, the website is a **full product site** with multiple sections (header, hero, product details, footer, etc.). A component architecture is essential for maintainability, readability, and speed of development.

### Why NOT React / Next.js?

React ships a significant JS runtime (~45KB+). Next.js adds SSR hydration overhead and a larger bundle. The 3D canvas animation competes with framework overhead for CPU time.

### Why Preact?

**Preact** is API-compatible with React but has a runtime footprint of only **~3KB**. It provides:

- Full component/hook architecture identical to React.
- Negligible runtime overhead — the CPU is almost entirely free for canvas rendering.
- Vite HMR support with instant hot updates that **preserve scroll position** during development — critical for debugging frame-accurate scroll animations.

### Why Vite?

- **HMR (Hot Module Replacement)**: Content, style, and logic changes inject instantly without a full page reload.
- Sub-millisecond dev server startup.
- Tree-shaking and optimized production builds out of the box.

---

## 📂 Project Structure

```
coconut-website/
├── public/
│   └── assets/
│       ├── desktop/    ← Drop 16:9 WebP frames here (frame_001.webp, frame_002.webp, ...)
│       └── mobile/     ← Drop 9:16 WebP frames here (frame_001.webp, frame_002.webp, ...)
├── src/
│   ├── components/
│   │   ├── CanvasLoader.tsx    ← Preloads & decodes all frames before page reveal
│   │   ├── ScrollCanvas.tsx    ← RAF loop, lerp, cover-crop canvas drawing
│   │   ├── Header.tsx          ← Glassmorphism sticky nav
│   │   ├── Hero.tsx            ← Landing viewport with animated scroll prompt
│   │   ├── ProductDetails.tsx  ← Narrative overlay cards layered over the canvas
│   │   └── Footer.tsx          ← Full-width site footer
│   ├── hooks/
│   │   └── useDeviceType.ts    ← Reactive mobile/desktop detection hook
│   ├── app.tsx                 ← Root orchestrator, ANIMATION_CONFIG lives here
│   ├── index.css               ← Global design system (dark theme, glassmorphism)
│   └── main.tsx                ← Preact entry point
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Build for production
npm run build
```

---

## 🎬 Adding Your 3D Animation Frames

### Step 1 — Export from your 3D software
Export your animation at **24 FPS** as a video file (MP4 or MOV). Create two versions:
- **Desktop**: 16:9 (e.g., 1920×1080)
- **Mobile**: 9:16 (e.g., 1080×1920), framed tightly around the product

### Step 2 — Extract frames with ffmpeg

```bash
# Desktop frames
ffmpeg -i desktop_animation.mp4 -vf fps=24 public/assets/desktop/frame_%03d.webp -q:v 80

# Mobile frames (more aggressive compression)
ffmpeg -i mobile_animation.mp4 -vf fps=24 -q:v 60 public/assets/mobile/frame_%03d.webp
```

> **Note:** ffmpeg's `-q:v` for WebP ranges from 0 (worst) to 100 (best). Use 80 for desktop and 60 for mobile.

### Step 3 — Update the config in `src/app.tsx`

```ts
const ANIMATION_CONFIG = {
  desktopFrameCount: 120,   // Set to your actual frame count
  mobileFrameCount: 120,    // Set to your actual frame count
  fileNamePrefix: 'frame_',
  fileNameDigits: 3,
  fileExtension: 'webp',
  lerpFactor: 0.08,         // Adjust for desired scroll feel
};
```

That's it — drop the frames in the correct folder and the loader handles the rest automatically.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| `--bg-color` | `#0c0e12` | Site background |
| `--accent-color` | `#f5f2eb` | Primary cream white |
| `--accent-gold` | `#d8c29d` | CTAs, highlights, progress bar |
| `--text-primary` | `#ffffff` | Headings |
| `--text-secondary` | `#909bb0` | Body copy |
| `--glass-bg` | `rgba(12,14,18,0.65)` | Glassmorphism cards & header |

Font: **Outfit** (Google Fonts) — weights 300, 400, 600, 800.

---

## ❌ Why NOT GSAP

GSAP was considered and **explicitly rejected** for this project. Here's the full reasoning:

### For the Canvas Animation: Hard No

GSAP is designed to animate **DOM elements** — it has no concept of drawing frames onto a `<canvas>`. Our `requestAnimationFrame + Lerp` loop already does exactly what `gsap.to()` with an `ease` would do, with zero overhead:

```js
// This replaces gsap.to() with ease — no library needed
currentFrame += (targetFrame - currentFrame) * 0.08;
```

Adding GSAP here would be dead weight on the bundle with zero benefit.

### For DOM Animations (text, cards, reveals): Still Not Needed

GSAP's `ScrollTrigger` is powerful, but all the same effects are achievable with:
- **CSS `transition` + `@keyframes`** for the visual smoothness.
- **`IntersectionObserver`** or the scroll progress value from the Canvas loop for the trigger.

This keeps the JS bundle microscopic and the CPU free for the Canvas rendering loop — which was the core design goal from the start.

### Decision Summary

| Use Case | Solution | GSAP? |
|---|---|---|
| Canvas frame animation | `rAF + Lerp` | ❌ Not applicable |
| Text / card reveal | CSS transitions | ❌ Not needed |
| Hero entrance animation | CSS `@keyframes` | ❌ Not needed |
| Header scroll opacity | Inline style via scroll progress | ❌ Not needed |

> **Rule:** Zero animation dependencies. Every effect is achievable with native browser APIs and CSS.

---

## 🎭 Scroll-Driven Reveals & Flow Control

The Canvas animation and the DOM text/card overlays are **two separate layers**, both controlled by the same scroll progress value (`0 → 1`).

### The Two-Layer Architecture

```
┌─────────────────────────────────────┐
│  DOM Layer  (text, cards, buttons)  │  ← gradual reveal, fade in/out
├─────────────────────────────────────┤
│  Canvas Layer  (3D product frames)  │  ← frame scrubbing via lerp
└─────────────────────────────────────┘
         Both driven by scrollProgress (0.0 → 1.0)
```

The Canvas loop calculates `scrollProgress` on every `requestAnimationFrame` tick. This same value can be read by any component to trigger reveals, parallax, and fades.

### How to Trigger a Reveal at a Specific Scroll Point

```js
// Inside the rAF loop or a scroll listener:
if (scrollProgress > 0.25) card1.classList.add('visible');
if (scrollProgress > 0.50) card2.classList.add('visible');
if (scrollProgress > 0.75) card3.classList.add('visible');

// To fade OUT a card after it's passed:
if (scrollProgress > 0.45) card1.classList.remove('visible');
```

The CSS handles the visual smoothness — zero JS animation math needed:

```css
.detail-card {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}

.detail-card.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### Full Flow Control Reference

| Effect | Implementation |
|---|---|
| Fade in card at scroll 25% | Add `.visible` class when `scrollProgress > 0.25` |
| Fade OUT card at scroll 50% | Remove `.visible` when `scrollProgress > 0.5` |
| Parallax text drift | `translateY(-scrollProgress * 80px)` inline style |
| Canvas opacity blend | `ctx.globalAlpha = someValue` before `drawImage` |
| Stagger multiple cards | Different thresholds per card (0.2, 0.3, 0.4...) |
| Text character reveal | CSS `clip-path` width transition on `.visible` |
| Header transparency | `header.style.opacity = 1 - scrollProgress * 2` |

### Key Insight

The `scrollProgress` value is essentially your **timeline controller** — the same concept as GSAP's `ScrollTrigger` progress, but without the library. You have complete, fine-grained control over what appears, when it appears, and how it transitions, all with native CSS and a single number.

---

## 📦 Repository

GitHub: [https://github.com/AhmadKhalil05/kokotaj-3D-website](https://github.com/AhmadKhalil05/kokotaj-3D-website)