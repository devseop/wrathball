import { useRef, useState, useCallback } from 'react';

export const useWebcam = () => {
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setError('카메라 접근에 실패했습니다. 카메라 권한을 확인해주세요.');
      console.error('카메라 오류:', errorMessage);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const toggleWebcam = useCallback(async () => {
    if (isWebcamEnabled) {
      setIsWebcamEnabled(false);
      stopCamera();
    } else {
      setIsWebcamEnabled(true);
      await startCamera();
    }
  }, [isWebcamEnabled, startCamera, stopCamera]);

  return {
    videoRef,
    isWebcamEnabled,
    error,
    toggleWebcam
  };
}; 