import { useEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';

interface ScrollCanvasProps {
  totalFrames?: number;
  baseUrl?: string;
  fileNamePrefix?: string;
  fileNameDigits?: number;
  fileExtension?: string;
  useEasing?: boolean;
  lerpFactor?: number;
}

interface TrailPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  angle: number;
}

interface PeelParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  thickness: number;
  angle: number;
  spin: number;
  opacity: number;
  life: number;
  maxLife: number;
  curve: number;
}

interface AmbientParticle {
  x: number; // 0..1 relative screen width
  y: number; // 0..1 relative screen height
  vx: number;
  vy: number;
  length: number;
  thickness: number;
  angle: number;
  spin: number;
  curve: number;
  baseAlpha: number;
  seed: number;
}

const MAX_PARTICLES = 40;
const MAX_TRAIL = 16;
const AMBIENT_COUNT = 18;

/**
 * Mobile-Hardened High-Performance ScrollCanvas:
 * 1. Safe Image Loader (guaranteed onload with fallback, zero crashes on iOS/Android)
 * 2. Mobile RAM Protection (throttled streaming queue, 1.5 DPR clamp)
 * 3. Nearest-Loaded Frame Fallback (guarantees canvas is NEVER blank or black)
 * 4. Ambient Organic Shavings on Phase 01 + Magic Hook Reveal on Phase 05
 */
export function ScrollCanvas({
  totalFrames = 241,
  baseUrl = '/assets/desktop/',
  fileNamePrefix = 'frame_',
  fileNameDigits = 3,
  fileExtension = 'webp',
  useEasing = true,
  lerpFactor = 0.08,
}: ScrollCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Cached frame images and load statuses (0: not loaded, 1: loading, 2: loaded)
  const imagesCacheRef = useRef<(HTMLImageElement | null)[]>(new Array(totalFrames).fill(null));
  const loadStatusRef = useRef<Uint8Array>(new Uint8Array(totalFrames));

  const stateRef = useRef({
    currentFrame: 0,
    targetFrame: 0,
    scrollProgress: 0,
    ambientTime: 0,
  });

  // Natural Organic Reveal Lens Physics State
  const lensRef = useRef({
    targetX: 0,
    targetY: 0,
    smoothX: 0,
    smoothY: 0,
    lastSmoothX: 0,
    lastSmoothY: 0,
    targetRadius: 0,
    currentRadius: 0,
    isPointerActive: false,
    speed: 0,
    angle: 0,
  });

  // Pre-allocated Zero-Allocation Particle Pool for Cursor Reveal
  const particlePoolRef = useRef<PeelParticle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      length: 0,
      thickness: 0,
      angle: 0,
      spin: 0,
      opacity: 0,
      life: 0,
      maxLife: 0,
      curve: 0,
    }))
  );

  // Pre-allocated Ambient Floating Particles for Initial Scene
  const ambientParticlesRef = useRef<AmbientParticle[]>(
    Array.from({ length: AMBIENT_COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: -(Math.random() * 0.0006 + 0.0003),
      length: Math.random() * 5 + 3,
      thickness: Math.random() * 1.2 + 0.6,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.015,
      curve: (Math.random() - 0.5) * 2.5,
      baseAlpha: Math.random() * 0.45 + 0.25,
      seed: i * 1.37 + Math.random() * 10,
    }))
  );

  // Pre-allocated Zero-Allocation Trail Ring Buffer
  const trailRingRef = useRef<{
    points: TrailPoint[];
    head: number;
    count: number;
  }>({
    points: Array.from({ length: MAX_TRAIL }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      speed: 0,
      angle: 0,
    })),
    head: 0,
    count: 0,
  });

  const getFrameUrl = (index: number) => {
    const frameNum = String(index).padStart(fileNameDigits, '0');
    return `${baseUrl}${fileNamePrefix}${frameNum}.${fileExtension}`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let active = true;

    // Center coordinates as initial pointer resting position
    const initRect = canvas.getBoundingClientRect();
    const initialWidth = initRect.width || window.innerWidth;
    const initialHeight = initRect.height || window.innerHeight;
    lensRef.current.targetX = initialWidth / 2;
    lensRef.current.targetY = initialHeight / 2;
    lensRef.current.smoothX = initialWidth / 2;
    lensRef.current.smoothY = initialHeight / 2;
    lensRef.current.lastSmoothX = initialWidth / 2;
    lensRef.current.lastSmoothY = initialHeight / 2;

    // 100% True Full-Bleed Cover Drawer (Full Screen, Zero Black Bars)
    const drawImageCover = (
      context: CanvasRenderingContext2D,
      img: HTMLImageElement,
      cw: number,
      ch: number
    ) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const imgRatio = img.width / img.height;
      const canvasRatio = cw / ch;

      let sx = 0, sy = 0, sw = img.width, sh = img.height;

      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }

      // 100% Full-bleed edge-to-edge fill
      context.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width || window.innerWidth;
      const ch = rect.height || window.innerHeight;
      if (cw === 0 || ch === 0) return;

      // DPR clamped to 1.5 on mobile/tablets to prevent iOS memory crashes
      const isMobile = cw < 768;
      const dpr = isMobile ? Math.min(window.devicePixelRatio || 1, 1.5) : Math.min(window.devicePixelRatio || 1, 1.75);

      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      renderScene();
    };

    // Zero-Allocation Particle Spawn for Cursor Hover
    const spawnPeelParticleFromPool = (x: number, y: number, vx: number, vy: number, speed: number) => {
      if (speed < 1.2) return;
      const pool = particlePoolRef.current;
      const baseAngle = Math.atan2(vy, vx) + Math.PI;
      const count = Math.min(2, Math.max(1, Math.round(speed / 5)));

      for (let c = 0; c < count; c++) {
        let p: PeelParticle | null = null;
        for (let i = 0; i < MAX_PARTICLES; i++) {
          if (!pool[i].active) {
            p = pool[i];
            break;
          }
        }
        if (!p) p = pool[Math.floor(Math.random() * MAX_PARTICLES)];

        const spread = (Math.random() - 0.5) * 1.4;
        const particleAngle = baseAngle + spread;
        const particleSpeed = (Math.random() * 2.0 + 0.8) * (speed * 0.1 + 0.8);

        const radius = lensRef.current.currentRadius * (0.7 + Math.random() * 0.3);
        const spawnOffsetAngle = baseAngle + (Math.random() - 0.5) * 1.8;
        const px = x + Math.cos(spawnOffsetAngle) * radius;
        const py = y + Math.sin(spawnOffsetAngle) * radius;

        p.active = true;
        p.x = px;
        p.y = py;
        p.vx = Math.cos(particleAngle) * particleSpeed;
        p.vy = Math.sin(particleAngle) * particleSpeed - Math.random() * 0.5;
        p.length = Math.random() * 5 + 3;
        p.thickness = Math.random() * 1.3 + 0.7;
        p.angle = Math.random() * Math.PI * 2;
        p.spin = (Math.random() - 0.5) * 0.2;
        p.opacity = 1.0;
        p.life = 0;
        p.maxLife = Math.random() * 20 + 16;
        p.curve = (Math.random() - 0.5) * 2.5;
      }
    };

    // Zero-Allocation Trail Push into Ring Buffer
    const pushTrailPoint = (x: number, y: number, vx: number, vy: number, speed: number, angle: number) => {
      const ring = trailRingRef.current;
      const pt = ring.points[ring.head];
      pt.x = x;
      pt.y = y;
      pt.vx = vx;
      pt.vy = vy;
      pt.speed = speed;
      pt.angle = angle;

      ring.head = (ring.head + 1) % MAX_TRAIL;
      if (ring.count < MAX_TRAIL) {
        ring.count++;
      }
    };

    const renderScene = () => {
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width || window.innerWidth;
      const ch = rect.height || window.innerHeight;
      if (cw === 0 || ch === 0) return;

      const targetIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(stateRef.current.currentFrame))
      );

      // 1. Find target image or nearest loaded fallback (Scans backwards, fallback to 0)
      let img = imagesCacheRef.current[targetIndex];
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let i = targetIndex; i >= 0; i--) {
          const fallback = imagesCacheRef.current[i];
          if (fallback && fallback.complete && fallback.naturalWidth > 0) {
            img = fallback;
            break;
          }
        }
      }
      if (!img || !img.complete || img.naturalWidth === 0) {
        for (let i = targetIndex; i < totalFrames; i++) {
          const fallback = imagesCacheRef.current[i];
          if (fallback && fallback.complete && fallback.naturalWidth > 0) {
            img = fallback;
            break;
          }
        }
      }

      // 2. Clear canvas
      ctx.clearRect(0, 0, cw, ch);

      // 3. Render base active frame
      if (img && img.complete && img.naturalWidth > 0) {
        drawImageCover(ctx, img, cw, ch);
      }

      const progress = stateRef.current.scrollProgress;

      // 4. Ambient Floating Organic Shavings on Initial Scene (Phase 01: progress < 0.12)
      const introFade = Math.max(0, 1 - (progress / 0.10));
      if (introFade > 0.01) {
        const ambients = ambientParticlesRef.current;
        const time = stateRef.current.ambientTime;
        ctx.save();

        for (let i = 0; i < AMBIENT_COUNT; i++) {
          const p = ambients[i];
          const px = p.x * cw + Math.sin(time * 0.8 + p.seed) * 10;
          const py = p.y * ch + Math.cos(time * 0.6 + p.seed) * 7;
          const alpha = p.baseAlpha * introFade;

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(p.angle);

          ctx.beginPath();
          ctx.moveTo(-p.length / 2, 0);
          ctx.quadraticCurveTo(0, p.curve, p.length / 2, 0);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
          ctx.lineWidth = p.thickness;
          ctx.lineCap = 'round';
          ctx.stroke();

          if (p.length > 4.5) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
            ctx.beginPath();
            ctx.arc(0, 0, p.thickness * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        ctx.restore();
      }

      // 5. Natural Clean Reveal Mask (Active in final phase)
      const lens = lensRef.current;
      const firstGreenImg = imagesCacheRef.current[0];
      const isFinalStage = progress >= 0.85 || targetIndex >= totalFrames * 0.85;

      if (isFinalStage && firstGreenImg && firstGreenImg.complete && firstGreenImg.naturalWidth > 0 && lens.currentRadius > 1.0) {
        const { smoothX, smoothY, currentRadius } = lens;

        ctx.save();

        // Crisp, pure circular reveal aperture (NO dark inner shadow)
        ctx.beginPath();
        ctx.arc(smoothX, smoothY, currentRadius, 0, Math.PI * 2);
        ctx.clip();

        // Draw pristine raw green coconut underneath
        drawImageCover(ctx, firstGreenImg, cw, ch);

        ctx.restore();

        // 6. White Magic Hook Tail Ribbon
        const ring = trailRingRef.current;
        if (ring.count >= 3) {
          ctx.save();
          const startIdx = (ring.head - ring.count + MAX_TRAIL) % MAX_TRAIL;

          for (let i = 0; i < ring.count - 1; i++) {
            const idx1 = (startIdx + i) % MAX_TRAIL;
            const idx2 = (startIdx + i + 1) % MAX_TRAIL;
            const p1 = ring.points[idx1];
            const p2 = ring.points[idx2];
            const progressRatio = i / (ring.count - 1);

            let hookOffsetX = 0;
            let hookOffsetY = 0;
            if (i < 3) {
              const hookFactor = (3 - i) / 3;
              const perpAngle = p1.angle + Math.PI / 2;
              const hookDistance = Math.min(14, p1.speed * 1.3) * hookFactor;
              hookOffsetX = Math.cos(perpAngle) * hookDistance;
              hookOffsetY = Math.sin(perpAngle) * hookDistance;
            }

            const x1 = p1.x + hookOffsetX;
            const y1 = p1.y + hookOffsetY;
            const x2 = p2.x;
            const y2 = p2.y;

            const ribbonWidth = Math.max(0.5, progressRatio * Math.min(7.5, lens.speed * 0.7 + 1.5));
            const alpha = Math.min(0.85, Math.pow(progressRatio, 1.3) * 0.9);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = ribbonWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
          }

          ctx.restore();
        }

        // 7. Flying White Peeling Shavings & Organic Flakes
        const pool = particlePoolRef.current;
        ctx.save();
        for (let i = 0; i < MAX_PARTICLES; i++) {
          const p = pool[i];
          if (!p.active) continue;

          const alpha = Math.max(0, p.opacity * (1 - p.life / p.maxLife));

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);

          ctx.beginPath();
          ctx.moveTo(-p.length / 2, 0);
          ctx.quadraticCurveTo(0, p.curve, p.length / 2, 0);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.lineWidth = p.thickness;
          ctx.lineCap = 'round';
          ctx.stroke();

          if (p.length > 4) {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.75})`;
            ctx.beginPath();
            ctx.arc(0, 0, p.thickness * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
        ctx.restore();
      }
    };

    // Pointer & Touch Handlers
    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      lensRef.current.targetX = e.clientX - rect.left;
      lensRef.current.targetY = e.clientY - rect.top;
      lensRef.current.isPointerActive = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      lensRef.current.targetX = e.clientX - rect.left;
      lensRef.current.targetY = e.clientY - rect.top;
      lensRef.current.isPointerActive = true;
    };

    const onMouseLeave = () => {
      lensRef.current.isPointerActive = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        lensRef.current.targetX = touch.clientX - rect.left;
        lensRef.current.targetY = touch.clientY - rect.top;
        lensRef.current.isPointerActive = true;
      }
    };

    const onTouchEnd = () => {
      lensRef.current.isPointerActive = false;
    };

    // --- ROBUST MOBILE & DESKTOP ASYNC LOADER ---
    const loadSingleImage = (frameIndex: number): Promise<void> => {
      return new Promise((resolve) => {
        if (!active || loadStatusRef.current[frameIndex] !== 0) {
          resolve();
          return;
        }

        loadStatusRef.current[frameIndex] = 1; // Mark loading
        const img = new Image();

        img.onload = () => {
          if (active) {
            imagesCacheRef.current[frameIndex] = img;
            loadStatusRef.current[frameIndex] = 2; // Mark loaded
          }
          resolve();
        };

        img.onerror = () => {
          if (active) {
            loadStatusRef.current[frameIndex] = 0; // Reset for retry
          }
          resolve();
        };

        img.src = getFrameUrl(frameIndex + 1);
      });
    };

    // 1. Instant Load Frame 1 (Guaranteed first paint)
    const initEngine = async () => {
      await loadSingleImage(0);
      if (!active) return;
      renderScene();

      gsap.fromTo(
        canvas,
        { opacity: 0, scale: 1.04, filter: 'blur(10px)' },
        { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1.1, ease: 'power3.out' }
      );

      // 2. Load Strategic Anchor Keyframes
      const keyframes = [59, 119, 179, totalFrames - 1];
      for (const k of keyframes) {
        if (!active) break;
        await loadSingleImage(k);
      }

      // 3. Smart Proximity Background Streamer with Device-Aware Concurrency
      const isMobile = (window.innerWidth || 1000) < 768;
      const maxConcurrency = isMobile ? 3 : 4;
      let activeWorkers = 0;

      const pumpQueue = () => {
        if (!active) return;

        while (activeWorkers < maxConcurrency) {
          const current = Math.round(stateRef.current.currentFrame);
          let bestIdx = -1;
          let bestDist = Infinity;

          for (let i = 0; i < totalFrames; i++) {
            if (loadStatusRef.current[i] === 0) {
              const dist = Math.abs(i - current);
              if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
              }
            }
          }

          if (bestIdx === -1) break; // All frames loaded

          activeWorkers++;
          loadSingleImage(bestIdx).then(() => {
            activeWorkers--;
            pumpQueue();
          });
        }
      };

      pumpQueue();
    };

    initEngine();

    // 4. Real-time 60fps/120fps Zero-Allocation Render Loop
    let lastRenderedFrame = -1;

    const tick = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const rawProgress = scrollHeight <= 0 ? 0 : scrollTop / scrollHeight;
      const progress = Math.min(1, Math.max(0, rawProgress));
      stateRef.current.scrollProgress = progress;

      stateRef.current.ambientTime += 0.018;

      // Update Ambient Particles Positions (Phase 01)
      if (progress < 0.12) {
        const ambients = ambientParticlesRef.current;
        for (let i = 0; i < AMBIENT_COUNT; i++) {
          const p = ambients[i];
          p.x += p.vx;
          p.y += p.vy;
          p.angle += p.spin;

          if (p.y < -0.05) p.y = 1.05;
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;
        }
      }

      const targetFrame = progress * (totalFrames - 1);
      stateRef.current.targetFrame = targetFrame;

      if (useEasing) {
        const diff = stateRef.current.targetFrame - stateRef.current.currentFrame;
        stateRef.current.currentFrame += diff * lerpFactor;

        if (Math.abs(diff) < 0.001) {
          stateRef.current.currentFrame = stateRef.current.targetFrame;
        }
      } else {
        stateRef.current.currentFrame = stateRef.current.targetFrame;
      }

      const frameIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(stateRef.current.currentFrame))
      );

      // Lens Physics & Interpolation
      const lens = lensRef.current;
      const isFinalStage = progress >= 0.85 || frameIndex >= totalFrames * 0.85;
      const rect = canvas.getBoundingClientRect();
      const isSmall = rect.width < 768;
      const maxRadius = isSmall ? 100 : 155;

      const desiredRadius = (isFinalStage && lens.isPointerActive) ? maxRadius : 0;

      // Coordinate easing
      const dx = lens.targetX - lens.smoothX;
      const dy = lens.targetY - lens.smoothY;
      lens.smoothX += dx * 0.16;
      lens.smoothY += dy * 0.16;

      const dr = desiredRadius - lens.currentRadius;
      lens.currentRadius += dr * 0.12;

      // Velocity calculation
      const vx = lens.smoothX - lens.lastSmoothX;
      const vy = lens.smoothY - lens.lastSmoothY;
      const currentSpeed = Math.hypot(vx, vy);
      lens.speed += (currentSpeed - lens.speed) * 0.25;
      lens.angle = Math.atan2(vy, vx);
      lens.lastSmoothX = lens.smoothX;
      lens.lastSmoothY = lens.smoothY;

      // Manage Trail Points in Ring Buffer
      if (isFinalStage && lens.currentRadius > 5) {
        if (currentSpeed > 0.4) {
          pushTrailPoint(lens.smoothX, lens.smoothY, vx, vy, currentSpeed, lens.angle);
        }
        if (currentSpeed > 1.2) {
          spawnPeelParticleFromPool(lens.smoothX, lens.smoothY, vx, vy, currentSpeed);
        }
      } else {
        trailRingRef.current.count = 0;
      }

      // Update Cursor Peel Particles in-place
      let activeParticlesCount = 0;
      const pool = particlePoolRef.current;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = pool[i];
        if (!p.active) continue;

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94;
        p.vy *= 0.94;
        p.vy += 0.04;
        p.angle += p.spin;
        p.life += 1;

        if (p.life >= p.maxLife) {
          p.active = false;
        } else {
          activeParticlesCount++;
        }
      }

      const isAmbientActive = progress < 0.12;
      const isActivelyAnimating =
        isAmbientActive ||
        (isFinalStage &&
          (lens.currentRadius > 0.5 || desiredRadius > 0 || activeParticlesCount > 0 || trailRingRef.current.count > 0));

      if (frameIndex !== lastRenderedFrame || isActivelyAnimating) {
        renderScene();
        lastRenderedFrame = frameIndex;
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    resizeCanvas();
    animationFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [totalFrames, baseUrl, fileNamePrefix, fileNameDigits, fileExtension, useEasing, lerpFactor]);

  return (
    <div className="canvas-viewport-fixed">
      <canvas ref={canvasRef} />
    </div>
  );
}
