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

/**
 * ScrollCanvas with instant-start background streaming and cinematic intro autoplay.
 * On initial page join, smoothly auto-plays the first ~28 frames synchronized with typography,
 * then seamlessly hands over to user scrolling.
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
    introFrameOffset: 0,
  });

  const hasUserScrolledRef = useRef(false);

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

      context.clearRect(0, 0, cw, ch);
      context.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      renderCurrentFrame();
    };

    const renderCurrentFrame = () => {
      const rect = canvas.getBoundingClientRect();
      const targetIndex = Math.min(
        totalFrames - 1,
        Math.max(0, Math.round(stateRef.current.currentFrame))
      );

      // Find target image or nearest loaded fallback
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

      if (img && img.complete && img.naturalWidth > 0) {
        drawImageCover(ctx, img, rect.width, rect.height);
      }
    };

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const rawProgress = scrollHeight <= 0 ? 0 : scrollTop / scrollHeight;
      stateRef.current.scrollProgress = Math.min(1, Math.max(0, rawProgress));

      if (scrollTop > 10) {
        hasUserScrolledRef.current = true;
      }
    };

    // 1. Instant Load Frame 1
    const firstImg = new Image();
    firstImg.src = getFrameUrl(1);
    firstImg.onload = () => {
      if (!active) return;
      imagesCacheRef.current[0] = firstImg;
      renderCurrentFrame();
    };

    // 2. Prioritize preloading the first 35 frames for the cinematic auto-spin intro
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

    // 3. Stream remaining frames in background
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

    // 4. Cinematic Auto-Scroll / Intro Play on Join
    const introObj = { offset: 0 };
    const introTween = gsap.to(introObj, {
      offset: 26, // Smoothly rotate ~26 frames on arrival
      duration: 2.2,
      ease: 'power2.out',
      delay: 0.1,
      onUpdate: () => {
        if (!hasUserScrolledRef.current) {
          stateRef.current.introFrameOffset = introObj.offset;
        }
      },
    });

    // 5. Main Render Loop
    let lastRenderedFrame = -1;

    const tick = () => {
      const scrollFrame = stateRef.current.scrollProgress * (totalFrames - 1);
      // Blend out intro offset smoothly as user scrolls past 0%
      const introBlend = Math.max(0, 1 - (stateRef.current.scrollProgress / 0.08));
      const targetFrame = scrollFrame + (stateRef.current.introFrameOffset * introBlend);

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

      if (frameIndex !== lastRenderedFrame) {
        renderCurrentFrame();
        lastRenderedFrame = frameIndex;
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    resizeCanvas();
    updateScrollProgress();
    animationFrameIdRef.current = requestAnimationFrame(tick);

    return () => {
      active = false;
      introTween.kill();
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('scroll', updateScrollProgress);
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
