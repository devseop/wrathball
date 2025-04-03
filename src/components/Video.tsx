import React, { useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { useWebcam } from '../hooks/useWebcam';
import { useSegmentation } from '../hooks/useSegmentation';
import { TeamSelector } from './TeamSelector';

export function Video() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, isWebcamEnabled, error, selectedTeam, handleTeamSelect, handleTeamDeselect } = useWebcam();
  const { initializeSegmenter, processFrame, animationFrameRef } = useSegmentation(videoRef, canvasRef);

  useEffect(() => {
    initializeSegmenter();
  }, [initializeSegmenter]);

  useEffect(() => {
    if (videoRef.current && isWebcamEnabled) {
      videoRef.current.onloadedmetadata = () => {
        processFrame(isWebcamEnabled);
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isWebcamEnabled, processFrame]);

  return (
    <VideoContainer>
      {error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : (
        <VideoWrapper>
          <StyledVideo ref={videoRef} autoPlay playsInline />
          <StyledCanvas ref={canvasRef} />
          <TeamSelector
            selectedTeam={selectedTeam}
            onTeamSelect={handleTeamSelect}
            onTeamDeselect={handleTeamDeselect}
          />
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
  display: block;
`;

const StyledCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
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