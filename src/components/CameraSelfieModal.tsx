import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

interface CameraSelfieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoBase64: string) => void;
  actionTitle: string;
  taskTitle: string;
}

export const CameraSelfieModal: React.FC<CameraSelfieModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  actionTitle,
  taskTitle
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      return;
    }

    startCamera();
    return () => stopCamera();
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStreamActive(true);
        }
      } else {
        setCameraError('Camera access not supported on this browser or iframe. Using simulated biometric selfie.');
      }
    } catch (err: any) {
      console.warn('Webcam permission denied or unavailable:', err);
      setCameraError('Webcam unavailable in this container. Interactive biometric selfie simulator will be used.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setStreamActive(false);
    }
  };

  const takeSnapshot = () => {
    if (streamActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedImage(base64);
        return;
      }
    }

    // Fallback biometric selfie snapshot generator
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 400, 400);
      grad.addColorStop(0, '#312e81');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 400, 400);

      // Face silhouette
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(200, 160, 70, 0, Math.PI * 2);
      ctx.fill();

      // Shoulders
      ctx.beginPath();
      ctx.arc(200, 380, 140, Math.PI, Math.PI * 2);
      ctx.fill();

      // Timestamp watermark
      ctx.fillStyle = '#ffffff';
      ctx.font = '14px monospace';
      ctx.fillText(`GEO-VERIFY: ${new Date().toISOString()}`, 20, 360);
      ctx.fillText(`TASK: ${taskTitle.slice(0, 24)}`, 20, 385);

      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(base64);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
              Selfie Verification
            </span>
            <h3 className="text-sm font-bold text-white leading-tight">{actionTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Attendance Selfie"
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
              />

              {!streamActive && (
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-24 h-24 rounded-full bg-indigo-500/10 border-2 border-dashed border-indigo-400/40 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-300 font-medium max-w-[200px]">
                    Position your face within the biometric attendance frame
                  </p>
                  {cameraError && (
                    <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-left">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-300 leading-tight">{cameraError}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Target Oval Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-52 h-64 rounded-[50%] border-2 border-dashed border-indigo-400/60 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
              </div>

              {/* Facing mode toggle */}
              {streamActive && (
                <button
                  onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Task context badge */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400">Target Task:</span>
          <span className="text-xs font-semibold text-slate-200 truncate">{taskTitle}</span>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <Check className="w-4 h-4" />
                Confirm & Submit
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center py-1">
              <button
                onClick={takeSnapshot}
                className="w-16 h-16 rounded-full border-4 border-white/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Camera className="w-6 h-6 text-slate-900" />
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
