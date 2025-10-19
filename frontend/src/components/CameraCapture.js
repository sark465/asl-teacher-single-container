import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const CameraCapture = ({ onCapture, expectedLetter }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const handsRef = useRef(null);
  const cameraRef = useRef(null);

  useEffect(() => {
    const initializeCamera = async () => {
      const hands = new Hands({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      hands.onResults((results) => {
        if (canvasRef.current) {
          const canvasCtx = canvasRef.current.getContext('2d');
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            setHandDetected(true);
            for (const landmarks of results.multiHandLandmarks) {
              drawConnectors(canvasCtx, landmarks, Hands.HAND_CONNECTIONS, {
                color: '#00FF00',
                lineWidth: 5
              });
              drawLandmarks(canvasCtx, landmarks, {
                color: '#FF0000',
                lineWidth: 2
              });
            }
          } else {
            setHandDetected(false);
          }
          canvasCtx.restore();
        }
      });

      if (videoRef.current) {
        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current) {
              await hands.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        handsRef.current = hands;
        cameraRef.current = camera;
        
        await camera.start();
        setIsReady(true);
      }
    };

    initializeCamera();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  const captureImage = () => {
    if (canvasRef.current) {
      const imageData = canvasRef.current.toDataURL('image/jpeg', 0.8);
      onCapture(imageData);
    }
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          autoPlay
          playsInline
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={{
            border: '2px solid #333',
            borderRadius: '8px',
            maxWidth: '100%',
            height: 'auto'
          }}
        />
        {expectedLetter && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            fontSize: '24px',
            fontWeight: 'bold'
          }}>
            Show sign for: {expectedLetter}
          </div>
        )}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: handDetected ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          {handDetected ? '✓ Hand Detected' : '✗ No Hand'}
        </div>
      </div>
      <div style={{ marginTop: '20px' }}>
        <button
          onClick={captureImage}
          disabled={!isReady || !handDetected}
          style={{
            padding: '12px 30px',
            fontSize: '16px',
            backgroundColor: isReady && handDetected ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isReady && handDetected ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          {!isReady ? 'Initializing Camera...' : 'Capture Sign'}
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
