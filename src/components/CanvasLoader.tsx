import { useEffect, useState } from 'preact/hooks';
import type { DeviceType } from '../hooks/useDeviceType';

interface CanvasLoaderProps {
  deviceType: DeviceType;
  frameCount: number;
  fileNamePrefix?: string;
  fileNameDigits?: number;
  fileExtension?: string;
  onComplete: (images: HTMLImageElement[]) => void;
  baseUrl?: string;
}

/**
 * Preloads and decodes 3D image sequences in background threads with 0 shadows.
 */
export function CanvasLoader({
  deviceType,
  frameCount,
  fileNamePrefix = 'frame_',
  fileNameDigits = 3,
  fileExtension = 'webp',
  onComplete,
  baseUrl,
}: CanvasLoaderProps) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadedImages: HTMLImageElement[] = [];
    let completedCount = 0;

    const folder = deviceType === 'mobile' ? 'mobile' : 'desktop';
    const finalBaseUrl = baseUrl || `/assets/${folder}/`;

    const getFrameUrl = (index: number) => {
      const frameNum = String(index).padStart(fileNameDigits, '0');
      return `${finalBaseUrl}${fileNamePrefix}${frameNum}.${fileExtension}`;
    };

    const preloadAll = async () => {
      setProgress(0);
      setError(null);

      const promises = Array.from({ length: frameCount }, (_, i) => {
        const frameIndex = i + 1;
        return new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.src = getFrameUrl(frameIndex);

          const handleLoad = () => {
            if ('decode' in img) {
              img
                .decode()
                .then(() => {
                  if (!active) return;
                  completedCount++;
                  setProgress(Math.round((completedCount / frameCount) * 100));
                  resolve(img);
                })
                .catch(() => {
                  if (!active) return;
                  completedCount++;
                  setProgress(Math.round((completedCount / frameCount) * 100));
                  resolve(img);
                });
            } else {
              if (!active) return;
              completedCount++;
              setProgress(Math.round((completedCount / frameCount) * 100));
              resolve(img);
            }
          };

          const handleError = () => {
            if (!active) return;
            reject(new Error(`Failed to load frame at: ${img.src}`));
          };

          img.onload = handleLoad;
          img.onerror = handleError;
          loadedImages[i] = img;
        });
      });

      try {
        const results = await Promise.all(promises);
        if (active) {
          onComplete(results);
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(
            'Failed to load 3D frames. Please verify frames exist in /public/assets/.'
          );
        }
      }
    };

    preloadAll();

    return () => {
      active = false;
    };
  }, [deviceType, frameCount, fileNamePrefix, fileNameDigits, fileExtension]);

  return (
    <div className="loader-container">
      <div className="loader-content">
        <div className="loader-badge">
          <span className="loader-dot" />
          <span>3D SCROLL EXPERIENCE</span>
        </div>

        <h1 className="loader-title">
          KOKO<span className="accent">TAJ</span>
        </h1>
        <p className="loader-subtext">
          Ultra-High Definition 3D Coconut
        </p>

        <div className="loader-progress-track">
          <div className="loader-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="loader-status-row">
          <span>Decaching assets</span>
          <span className="loader-percentage">{progress}%</span>
        </div>

        {error && (
          <div className="loader-error">
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
