import React, { useRef, useState, useEffect, useCallback } from 'react';
import styled from '@emotion/styled';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';
import { SEGMENT_CONSTANTS } from '../const/segment';
import { COLORS } from '../const/colors';



export function Video() {
  const [error, setError] = useState<string | null>(null);
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      setError('인식 모델을 불러오는데 실패했습니다.');
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
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
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  const toggleWebcam = useCallback(async () => {
    if (!segmenterRef.current) return;

    if (isWebcamEnabled) {
      setIsWebcamEnabled(false);
      stopCamera();
    } else {
      setIsWebcamEnabled(true);
      await startCamera();
    }
  }, [isWebcamEnabled, startCamera, stopCamera]);

  const processFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !segmenterRef.current || !isWebcamEnabled) return;

    const currentTime = videoRef.current.currentTime;
    if (currentTime === lastVideoTimeRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }
    lastVideoTimeRef.current = currentTime;

    const canvasContext = canvasRef.current.getContext('2d');
    if (!canvasContext) return;

    // 캔버스 크기를 비디오와 동일하게 설정
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    canvasContext.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const startTimeMs = performance.now();

    try {
      // 이미지 세그멘테이션 실행
      await segmenterRef.current.segmentForVideo(videoRef.current, startTimeMs, (results) => {
        if (results.categoryMask && canvasRef.current) {
          const imageData = canvasContext.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
          const mask = results.categoryMask.getAsFloat32Array();

          for (let i = 0; i < mask.length; ++i) {
            const maskVal = Math.round(mask[i] * 255.0);
            const j = i * 4;
            
            if (maskVal === 0) { // 배경인 경우
              imageData.data[j] = 0;       // R
              imageData.data[j + 1] = 0;   // G
              imageData.data[j + 2] = 0;   // B
              imageData.data[j + 3] = 255;   // A (투명)
            } else { // 객체인 경우
              imageData.data[j] = 255;       // R
              imageData.data[j + 1] = 255;   // G
              imageData.data[j + 2] = 255;   // B
              imageData.data[j + 3] = 255; // A
            }
          }

          // 전체 화면을 검은색으로 채우기
          canvasContext.fillStyle = 'black';
          canvasContext.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // 세그멘테이션 결과 그리기
          canvasContext.putImageData(imageData, 0, 0);
        }
      });
    } catch (err) {
      console.error('프레임 처리 중 오류:', err);
    }

    if (isWebcamEnabled) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  }, [isWebcamEnabled]);

  useEffect(() => {
    initializeSegmenter();
  }, [initializeSegmenter]);

  useEffect(() => {
    if (videoRef.current && segmenterRef.current && isWebcamEnabled) {
      videoRef.current.onloadedmetadata = () => {
        processFrame();
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      stopCamera();
    };
  }, [isWebcamEnabled, processFrame, stopCamera]);

  return (
    <VideoContainer>
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <VideoWrapper>
          <StyledVideo ref={videoRef} autoPlay playsInline />
          <StyledCanvas ref={canvasRef} />
          <WebcamButton onClick={toggleWebcam}>
            {isWebcamEnabled ? 'DISABLE SEGMENTATION' : 'ENABLE SEGMENTATION'}
          </WebcamButton>
        </VideoWrapper>
      )}
    </VideoContainer>
  );
}

const VideoContainer = styled.div`
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #000;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const StyledVideo = styled.video`
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  transform: scaleX(-1);
  display: block;
`;

const StyledCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
`;

const ErrorMessage = styled.div`
  color: red;
  margin: 20px 0;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 20px;
  border-radius: 8px;
  color: white;
  text-align: center;
`;

const WebcamButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  z-index: 1000;

  &:hover {
    background-color: #0056b3;
  }
`;