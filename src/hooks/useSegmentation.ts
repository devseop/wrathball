import { useRef, useCallback } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { SEGMENT_CONSTANTS } from '../const/segment';
import { getAsciiChar, calculateDistance, getNearestPersonPixel } from '../utils/asciiUtils';

export const useSegmentation = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
  const segmenterRef = useRef<ImageSegmenter | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const initializeSegmenter = useCallback(async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(SEGMENT_CONSTANTS.visionTaskPath);
      const segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: SEGMENT_CONSTANTS.modelAssetPath,
          delegate: 'GPU'
        },
        outputCategoryMask: true,
        outputConfidenceMasks: false,
        runningMode: SEGMENT_CONSTANTS.runningMode
      });

      segmenterRef.current = segmenter;
    } catch (err) {
      console.error('세그멘터 초기화 실패:', err);
      throw new Error('인식 모델을 불러오는데 실패했습니다.');
    }
  }, []);

  const processFrame = useCallback(async (isWebcamEnabled: boolean) => {
    if (!videoRef.current || !canvasRef.current || !segmenterRef.current || !isWebcamEnabled) return;

    const currentTime = videoRef.current.currentTime;
    if (currentTime === lastVideoTimeRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => processFrame(isWebcamEnabled));
      return;
    }
    lastVideoTimeRef.current = currentTime;

    const canvasContext = canvasRef.current.getContext('2d');
    if (!canvasContext) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    canvasContext.fillStyle = 'black';
    canvasContext.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    const startTimeMs = performance.now();

    try {
      await segmenterRef.current.segmentForVideo(videoRef.current, startTimeMs, (results) => {
        if (results.categoryMask && canvasRef.current) {
          const mask = results.categoryMask.getAsFloat32Array();
          const personCenter = getNearestPersonPixel(mask, canvasRef.current.width, canvasRef.current.height);

          if (personCenter) {
            const maxDistance = Math.max(
              Math.max(personCenter.x, canvasRef.current.width - personCenter.x),
              Math.max(personCenter.y, canvasRef.current.height - personCenter.y)
            );

            canvasContext.fillStyle = 'white';
            canvasContext.font = '9px monospace';
            canvasContext.textAlign = 'center';
            canvasContext.textBaseline = 'middle';

            const gridSize = 9;
            for (let y = 0; y < canvasRef.current.height; y += gridSize) {
              for (let x = 0; x < canvasRef.current.width; x += gridSize) {
                const index = y * canvasRef.current.width + x;
                const maskVal = Math.round(mask[index] * 255.0);
                const distance = calculateDistance(x, y, personCenter.x, personCenter.y);
                const normalizedDistance = distance / maxDistance;
                const asciiChar = getAsciiChar(normalizedDistance, maskVal);
                
                canvasContext.fillStyle = 'white';
                canvasContext.fillText(asciiChar, x + gridSize/2, y + gridSize/2);
              }
            }
          }
        }
      });
    } catch (err) {
      console.error('프레임 처리 중 오류:', err);
    }

    if (isWebcamEnabled) {
      animationFrameRef.current = requestAnimationFrame(() => processFrame(isWebcamEnabled));
    }
  }, []);

  return {
    initializeSegmenter,
    processFrame,
    animationFrameRef
  };
}; 