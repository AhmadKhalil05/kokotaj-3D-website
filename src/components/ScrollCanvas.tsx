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

/**
 * ScrollCanvas with instant-start background streaming, smooth initial page entrance,
 * and a signature White Magic Peeling Hook Trail & Flying Shavings Particle effect on final state.
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
  const imagesCacheRef = useRef<(HTMLImageElement | null)[]>(new Array(totalFrames).fill(null));

  const stateRef = useRef({
    currentFrame: 0,
    targetFrame: 0,
    scrollProgress: 0,
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

  // White Magic Hook Ribbon Trail and Peeling Shavings particles
  const trailRef = useRef<TrailPoint[]>([]);
  const particlesRef = useRef<PeelParticle[]>([]);

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
    lensRef.current.targetX = initRect.width / 2;
    lensRef.current.targetY = initRect.height / 2;
    lensRef.current.smoothX = initRect.width / 2;
    lensRef.current.smoothY = initRect.height / 2;
    lensRef.current.lastSmoothX = initRect.width / 2;
    lensRef.current.lastSmoothY = initRect.height / 2;

    // Aspect-fit cover drawer
    const drawImageCover = (
      context: CanvasRenderingContext2D,
      img: HTMLImageElement,
      cw: number,
      ch: number
    ) => {
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

      context.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      renderScene();
    };

    const spawnPeelParticles = (x: number, y: number, vx: number, vy: number, speed: number) => {
      if (speed < 1.2) return;
      const particles = particlesRef.current;
      if (particles.length > 50) return; // Prevent excessive allocations

      const count = Math.min(3, Math.max(1, Math.round(speed / 4)));
      const baseAngle = Math.atan2(vy, vx) + Math.PI; // Fly backwards from motion

      for (let i = 0; i < count; i++) {
        const spread = (Math.random() - 0.5) * 1.4;
        const particleAngle = baseAngle + spread;
        const particleSpeed = (Math.random() * 2.5 + 1.2) * (speed * 0.15 + 0.8);

        // Spawn along the outer circumference of the reveal lens
        const radius = lensRef.current.currentRadius * (0.7 + Math.random() * 0.3);
        const spawnOffsetAngle = baseAngle + (Math.random() - 0.5) * 1.8;
        const px = x + Math.cos(spawnOffsetAngle) * radius;
        const py = y + Math.sin(spawnOffsetAngle) * radius;

        particles.push({
          x: px,
          y: py,
          vx: Math.cos(particleAngle) * particleSpeed,
          vy: Math.sin(particleAngle) * particleSpeed - Math.random() * 0.8,
          length: Math.random() * 6 + 3,
          thickness: Math.random() * 1.5 + 0.8,
          angle: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.25,
          opacity: 1.0,
          life: 0,
          maxLife: Math.random() * 25 + 20, // ~30-45 frames lifetime
          curve: (Math.random() - 0.5) * 3.0,
        });
      }
    };

    const renderScene = () => {
      const rect = canvas.getBoundingClientRect();
      const cw = rect.width;
      const ch = rect.height;
      if (cw === 0 || ch === 0) return;

      const targetIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(stateRef.current.currentFrame))
      );

      // 1. Find target image or nearest loaded fallback
      let img = imagesCacheRef.current[targetIndex];
      if (!img) {
        for (let i = targetIndex; i >= 0; i--) {
          if (imagesCacheRef.current[i]) {
            img = imagesCacheRef.current[i];
            break;
          }
        }
      }
      if (!img) {
        for (let i = targetIndex; i < totalFrames; i++) {
          if (imagesCacheRef.current[i]) {
            img = imagesCacheRef.current[i];
            break;
          }
        }
      }

      // 2. Clear canvas
      ctx.clearRect(0, 0, cw, ch);

      // 3. Render base active frame (e.g. final carved white coconut in Phase 5)
      if (img && img.complete && img.naturalWidth > 0) {
        drawImageCover(ctx, img, cw, ch);
      }

      // 4. Natural Clean Reveal Mask (Zero Inner Shadow)
      const progress = stateRef.current.scrollProgress;
      const lens = lensRef.current;
      const firstGreenImg = imagesCacheRef.current[0];
      const isFinalStage = progress >= 0.85 || targetIndex >= totalFrames * 0.85;

      if (isFinalStage && firstGreenImg && firstGreenImg.complete && lens.currentRadius > 1.0) {
        const { smoothX, smoothY, currentRadius } = lens;

        ctx.save();

        // Crisp, pure circular reveal aperture (NO dark inner shadow)
        ctx.beginPath();
        ctx.arc(smoothX, smoothY, currentRadius, 0, Math.PI * 2);
        ctx.clip();

        // Draw pristine raw green coconut underneath
        drawImageCover(ctx, firstGreenImg, cw, ch);

        ctx.restore();

        // 5. White Magic Hook Tail Ribbon (ذيل الخطاف الانسيابي الساحر)
        const trail = trailRef.current;
        if (trail.length >= 3) {
          ctx.save();

          for (let i = 0; i < trail.length - 1; i++) {
            const p1 = trail[i];
            const p2 = trail[i + 1];
            const progressRatio = i / (trail.length - 1); // 0 (tail) -> 1 (head near cursor)

            // Hook curve dynamic displacement at the tail end
            let hookOffsetX = 0;
            let hookOffsetY = 0;
            if (i < 3) {
              const hookFactor = (3 - i) / 3;
              const perpAngle = p1.angle + Math.PI / 2;
              const hookDistance = Math.min(18, p1.speed * 1.5) * hookFactor;
              hookOffsetX = Math.cos(perpAngle) * hookDistance;
              hookOffsetY = Math.sin(perpAngle) * hookDistance;
            }

            const x1 = p1.x + hookOffsetX;
            const y1 = p1.y + hookOffsetY;
            const x2 = p2.x;
            const y2 = p2.y;

            // Fluid tapered ribbon width: delicate at tail (0.8px), expanding to 8px near cursor
            const ribbonWidth = Math.max(0.5, progressRatio * Math.min(9, lens.speed * 0.8 + 2));
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

        // 6. Flying White Peeling Shavings & Organic Magic Flakes (جزيئات التقشر المتطايرة)
        const particles = particlesRef.current;
        if (particles.length > 0) {
          ctx.save();
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const alpha = Math.max(0, p.opacity * (1 - p.life / p.maxLife));

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            // Draw delicate curved white peel shaving
            ctx.beginPath();
            ctx.moveTo(-p.length / 2, 0);
            ctx.quadraticCurveTo(0, p.curve, p.length / 2, 0);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.lineWidth = p.thickness;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Subtle luminous core sparkle
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

    // 1. Instant Load Frame 1 with Smooth Synchronized Entrance Animation
    const firstImg = new Image();
    firstImg.src = getFrameUrl(1);
    firstImg.onload = () => {
      if (!active) return;
      imagesCacheRef.current[0] = firstImg;
      renderScene();

      gsap.fromTo(
        canvas,
        {
          opacity: 0,
          scale: 1.04,
          filter: 'blur(10px)',
        },
        {
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.1,
          ease: 'power3.out',
        }
      );
    };

    // 2. Preload Sequence
    const preloadFirstSequence = async () => {
      const introCount = Math.min(35, totalFrames);
      for (let i = 1; i <= introCount; i++) {
        if (!active) break;
        const img = new Image();
        img.src = getFrameUrl(i);
        img.decode().catch(() => {}).then(() => {
          if (active) imagesCacheRef.current[i - 1] = img;
        });
      }
    };
    preloadFirstSequence();

    const preloadRemaining = async () => {
      for (let i = 36; i <= totalFrames; i++) {
        if (!active) break;
        const img = new Image();
        img.src = getFrameUrl(i);
        img.decode().catch(() => {}).then(() => {
          if (active) imagesCacheRef.current[i - 1] = img;
        });
      }
    };
    preloadRemaining();

    // 3. Real-time 60fps/120fps Render Loop
    let lastRenderedFrame = -1;

    const tick = () => {
      // Real-time scroll sampling
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const rawProgress = scrollHeight <= 0 ? 0 : scrollTop / scrollHeight;
      const progress = Math.min(1, Math.max(0, rawProgress));
      stateRef.current.scrollProgress = progress;

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
      const maxRadius = isSmall ? 110 : 155;

      const desiredRadius = (isFinalStage && lens.isPointerActive) ? maxRadius : 0;

      // Coordinate easing
      const dx = lens.targetX - lens.smoothX;
      const dy = lens.targetY - lens.smoothY;
      lens.smoothX += dx * 0.16;
      lens.smoothY += dy * 0.16;

      const dr = desiredRadius - lens.currentRadius;
      lens.currentRadius += dr * 0.12;

      // Real-time velocity and movement angle
      const vx = lens.smoothX - lens.lastSmoothX;
      const vy = lens.smoothY - lens.lastSmoothY;
      const currentSpeed = Math.hypot(vx, vy);
      lens.speed += (currentSpeed - lens.speed) * 0.25;
      lens.angle = Math.atan2(vy, vx);
      lens.lastSmoothX = lens.smoothX;
      lens.lastSmoothY = lens.smoothY;

      // Manage Magic Hook Trail Points
      if (isFinalStage && lens.currentRadius > 5) {
        if (currentSpeed > 0.4) {
          trailRef.current.push({
            x: lens.smoothX,
            y: lens.smoothY,
            vx,
            vy,
            speed: currentSpeed,
            angle: lens.angle,
          });
        }

        // Limit trail history length (~14-16 historical points for a crisp hook ribbon)
        if (trailRef.current.length > 15) {
          trailRef.current.shift();
        }

        // Spawn Peeling Shavings along motion
        if (currentSpeed > 1.2) {
          spawnPeelParticles(lens.smoothX, lens.smoothY, vx, vy, currentSpeed);
        }
      } else {
        trailRef.current = [];
      }

      // Update Peeling Particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.94; // Air resistance
        p.vy *= 0.94;
        p.vy += 0.04; // Subtle gravity
        p.angle += p.spin;
        p.life += 1;

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      // Render condition: Frame change OR active lens / particles / trail
      const isActivelyAnimating =
        isFinalStage &&
        (lens.currentRadius > 0.5 || desiredRadius > 0 || particles.length > 0 || trailRef.current.length > 0);

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
