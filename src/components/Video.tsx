import React, { useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';

export function Video() {
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  return (
    <VideoContainer>
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <StyledVideo ref={videoRef} autoPlay playsInline />
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

const StyledVideo = styled.video`
  width: 100vw;
  height: 100vh;
  object-fit: cover;
  transform: scaleX(-1);
  display: block;
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