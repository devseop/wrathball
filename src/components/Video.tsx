import React, { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export function Video() {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

  useEffect(() => {
    const initializeTensorFlow = async () => {
      try {
        await tf.setBackend('webgl');
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
      } catch (err) {
        console.error('모델 로딩 실패:', err);
        setError('인식 모델을 불러오는데 실패했습니다.');
      }
    };

    initializeTensorFlow();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
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
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current || !model) return;

      const canvasContext = canvasRef.current.getContext('2d');
      if (!canvasContext) return;

      // 캔버스 크기를 비디오와 동일하게 설정
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // 비디오 프레임을 캔버스에 그리기
      canvasContext.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);

      // 사람 인식 실행
      const predictions = await model.detect(videoRef.current);

      // 사람이 인식된 영역에 빨간색 윤곽선 그리기
      predictions.forEach(prediction => {
        if (prediction.class === 'person') {
          const [x, y, width, height] = prediction.bbox;
          
          // 윤곽선 스타일 설정
          canvasContext.strokeStyle = 'red';
          canvasContext.lineWidth = 10;
          
          // 사각형 윤곽선 그리기
          canvasContext.strokeRect(x, y, width, height);
        }
      });

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (videoRef.current && model) {
      videoRef.current.onloadedmetadata = () => {
        processFrame();
      };
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [model]);

  return (
    <VideoContainer>
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <VideoWrapper>
          <StyledVideo ref={videoRef} autoPlay playsInline />
          <StyledCanvas ref={canvasRef} />
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