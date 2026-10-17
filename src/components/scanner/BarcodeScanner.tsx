import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { Camera, CameraOff, AlertCircle, RefreshCw, Barcode } from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading?: boolean;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onBarcodeDetected,
  isLoading = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasCameraSupport, setHasCameraSupport] = useState(true);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    // Check if mediaDevices API is available
    if (!navigator?.mediaDevices?.getUserMedia) {
      setHasCameraSupport(false);
    }

    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (e) {
        console.warn('Error stopping ZXing controls:', e);
      }
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const startCamera = async () => {
    setErrorMessage(null);
    setHasScanned(false);

    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage('Your browser does not support camera access or you are running in an insecure (non-HTTPS) context.');
      return;
    }

    try {
      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader();
      }

      setIsScanning(true);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      if (!videoRef.current) return;

      const controls = await readerRef.current.decodeFromConstraints(
        constraints,
        videoRef.current,
        (result, error) => {
          if (result && !hasScanned) {
            const rawText = result.getText();
            if (rawText && rawText.length >= 6) {
              setHasScanned(true);
              stopCamera();
              onBarcodeDetected(rawText);
            }
          }
          if (error && error.name !== 'NotFoundException') {
            // NotFoundException is standard during each frame check when no barcode is in frame
          }
        }
      );

      controlsRef.current = controls;
    } catch (err: unknown) {
      setIsScanning(false);
      const e = err as Error;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser address bar.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera was detected on this device.');
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        setErrorMessage('Camera is currently in use by another application.');
      } else {
        setErrorMessage(`Camera error: ${e.message || 'Could not start camera feed.'}`);
      }
    }
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* Scanner Viewport Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '300px',
            background: '#1A141C',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            border: isScanning ? '2px solid var(--primary-berry)' : '1px solid #3A2F3D',
          }}
        >
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isScanning ? 'block' : 'none',
            }}
          />

          {!isScanning && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#E0CDD2',
                padding: '1.5rem',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(176, 58, 103, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Barcode size={32} color="#FCEFF2" />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#D6C0C6' }}>
                Camera is idle. Click below to begin live barcode scanning.
              </p>
            </div>
          )}

          {/* Target Reticle / Scan Brackets overlay when camera is running */}
          {isScanning && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Target Aim Box */}
              <div
                style={{
                  width: '75%',
                  height: '55%',
                  border: '2px solid rgba(255, 255, 255, 0.85)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  position: 'relative',
                }}
              >
                {/* Center red laser guideline */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '5%',
                    right: '5%',
                    height: '2px',
                    background: 'var(--primary-berry)',
                    opacity: 0.8,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Error message banner */}
        {errorMessage && (
          <div className="alert-banner alert-banner-error" style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Scanner Warning</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {!isScanning ? (
            <button
              type="button"
              onClick={startCamera}
              disabled={isLoading || !hasCameraSupport}
              className="btn btn-primary"
            >
              <Camera size={18} />
              <span>Start Camera Scanner</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="btn btn-secondary"
            >
              <CameraOff size={18} />
              <span>Stop Camera</span>
            </button>
          )}

          {errorMessage && (
            <button
              type="button"
              onClick={startCamera}
              className="btn btn-ghost"
            >
              <RefreshCw size={16} />
              <span>Retry</span>
            </button>
          )}
        </div>

        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.875rem' }}>
          Point camera directly at any retail EAN-13, EAN-8, or UPC barcode.
        </p>
      </div>
    </div>
  );
};
