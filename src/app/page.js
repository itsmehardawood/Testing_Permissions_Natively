'use client';

import { useState, useRef, useEffect } from 'react';

export default function MediaPermissionTester() {
  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const trackRef = useRef(null);

  // Microphone state
  const [micActive, setMicActive] = useState(false);
  const [micError, setMicError] = useState(null);
  const [micRecording, setMicRecording] = useState(false);
  const micStreamRef = useRef(null);
  const micTrackRef = useRef(null);

  // Logging state
  const [logs, setLogs] = useState([]);

  // Helper function to log messages
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(`%c${logEntry}`, `color: ${type === 'error' ? 'red' : type === 'success' ? 'green' : 'blue'}`);
    setLogs(prev => [...prev, { message: logEntry, type }]);
  };

  // Start camera
  const startCamera = async () => {
    try {
      addLog('Camera: Requesting permission...', 'info');
      setCameraError(null);

      // Request camera permission
      const constraints = { video: { facingMode: 'environment' } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addLog('Camera: Permission granted, stream obtained', 'success');

      streamRef.current = stream;
      trackRef.current = stream.getVideoTracks()[0];

      // Check for torch support
      if (trackRef.current && trackRef.current.getCapabilities) {
        const capabilities = trackRef.current.getCapabilities();
        if (capabilities && capabilities.torch !== undefined) {
          setTorchSupported(true);
          addLog('Camera: Torch is supported', 'success');
        } else {
          addLog('Camera: Torch is not supported on this device', 'info');
        }
      }

      // Set video element source
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        addLog('Camera: Video element source set', 'success');
      }

      setCameraActive(true);
    } catch (error) {
      const errorMsg = `Camera: Permission denied or error occurred - ${error.message || error.name}`;
      addLog(errorMsg, 'error');
      setCameraError(errorMsg);
      setCameraActive(false);
    }
  };

  // Stop camera
  const stopCamera = async () => {
    try {
      addLog('Camera: Stopping camera...', 'info');

      // Stop all video tracks
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => {
          track.stop();
          addLog(`Camera: Video track stopped (${track.label})`, 'success');
        });
        streamRef.current = null;
      }

      // Stop specific track reference
      if (trackRef.current) {
        trackRef.current.stop();
        addLog('Camera: Track reference stopped', 'success');
        trackRef.current = null;
      }

      // Clear video element source
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        addLog('Camera: Video element source cleared', 'success');
      }

      // Reset flash state
      setTorchEnabled(false);
      setTorchSupported(false);

      setCameraActive(false);
      setCameraError(null);
      addLog('Camera: Fully released', 'success');
    } catch (error) {
      const errorMsg = `Camera: Error stopping - ${error.message || error.name}`;
      addLog(errorMsg, 'error');
    }
  };

  // Toggle torch/flash
  const toggleTorch = async () => {
    try {
      if (!trackRef.current || !torchSupported) {
        addLog('Camera: Torch not available', 'error');
        return;
      }

      const newTorchState = !torchEnabled;
      await trackRef.current.applyConstraints({
        advanced: [{ torch: newTorchState }],
      });

      setTorchEnabled(newTorchState);
      addLog(`Camera: Torch ${newTorchState ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      const errorMsg = `Camera: Torch toggle error - ${error.message || error.name}`;
      addLog(errorMsg, 'error');
    }
  };

  // Start microphone (request permission and begin recording)
  const startMicrophone = async () => {
    try {
      addLog('Microphone: Requesting permission...', 'info');
      setMicError(null);

      // Verify camera is stopped before requesting microphone
      if (cameraActive || streamRef.current) {
        const msg =
          'Microphone: WARNING - Camera is still active. Ensure camera is fully stopped before requesting microphone.';
        addLog(msg, 'error');
        setMicError('Camera must be stopped first');
        return;
      }

      addLog('Microphone: Camera is not active - proceeding with permission request', 'success');

      const constraints = { audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      addLog('Microphone: Permission granted, stream obtained', 'success');

      micStreamRef.current = stream;
      micTrackRef.current = stream.getAudioTracks()[0];

      setMicActive(true);
      setMicRecording(true);
      addLog(`Microphone: Recording started (${micTrackRef.current.label})`, 'success');
    } catch (error) {
      const errorMsg = `Microphone: Permission denied or error - ${error.message || error.name}`;
      addLog(errorMsg, 'error');
      setMicError(errorMsg);
      setMicActive(false);
      setMicRecording(false);
    }
  };

  // Stop microphone (stop recording and release resources)
  const stopMicrophone = async () => {
    try {
      addLog('Microphone: Stopping recording...', 'info');

      // Stop all audio tracks
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach(track => {
          track.stop();
          addLog(`Microphone: Audio track stopped (${track.label})`, 'success');
        });
        micStreamRef.current = null;
      }

      // Stop specific track reference
      if (micTrackRef.current) {
        micTrackRef.current.stop();
        addLog('Microphone: Track reference stopped', 'success');
        micTrackRef.current = null;
      }

      setMicRecording(false);
      setMicActive(false);
      setMicError(null);
      addLog('Microphone: Fully released', 'success');
    } catch (error) {
      const errorMsg = `Microphone: Error stopping - ${error.message || error.name}`;
      addLog(errorMsg, 'error');
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getVideoTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (trackRef.current) {
        trackRef.current.stop();
        trackRef.current = null
      }
      if (micStreamRef.current) {
        micStreamRef.current.getAudioTracks().forEach(track => track.stop());
        micStreamRef.current = null;
      }
      if (micTrackRef.current) {
        micTrackRef.current.stop();
        micTrackRef.current = null;
      }
    };
  }, []);

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pt-4 flex justify-center flex-col items-center">
          <h1 className="text-4xl font-bold mb-2"> Android WebView Permission Tester</h1>
          <p className="text-gray-400">
            Test camera and microphone permission conflicts and resource management
          </p>
        </div>

        {/* Camera Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
             Camera Test
          </h2>

          {/* Video Preview */}
          <div className="mb-4 bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover  aspect-video bg-gray-950"
            />
          </div>

          {/* Status */}
          <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
            <p>
              Status:{' '}
              <span className={cameraActive ? 'text-green-400 font-bold' : 'text-gray-400'}>
                {cameraActive ? '🟢 Active' : '⚫ Inactive'}
              </span>
            </p>
            {cameraError && <p className="text-red-400 mt-2">Error: {cameraError}</p>}
          </div>

          {/* Camera Buttons */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={startCamera}
              disabled={cameraActive}
              className={`px-6 py-3 rounded font-semibold transition ${
                cameraActive
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
               Camera ON
            </button>

            <button
              onClick={stopCamera}
              disabled={!cameraActive}
              className={`px-6 py-3 rounded font-semibold transition ${
                !cameraActive
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
               Camera OFF
            </button>

            <button
              onClick={toggleTorch}
              disabled={!cameraActive || !torchSupported}
              className={`px-6 py-3 rounded font-semibold transition ${
                !cameraActive || !torchSupported
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : torchEnabled
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              {torchEnabled ? ' Flash ON' : ' Flash OFF'}
            </button>
          </div>

          {!torchSupported && cameraActive && (
            <p className="text-yellow-400 text-sm">⚠️ Torch not supported on this device</p>
          )}
        </div>

        {/* Microphone Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
             Microphone Test
          </h2>

          {/* Status */}
          <div className="mb-4 p-3 bg-gray-700 rounded text-sm">
            <p>
              Status:{' '}
              <span
                className={
                  micRecording ? 'text-green-400 font-bold' : micError ? 'text-red-400' : 'text-gray-400'
                }
              >
                {micRecording ? '🟢 Recording' : micError ? '🔴 Permission Denied' : '⚫ Not Active'}
              </span>
            </p>
            {micError && <p className="text-red-400 mt-2">Error: {micError}</p>}
          </div>

          {/* Microphone Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={startMicrophone}
              disabled={micRecording || cameraActive}
              className={`px-6 py-3 rounded font-semibold transition ${
                micRecording || cameraActive
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
               Microphone ON
            </button>

            <button
              onClick={stopMicrophone}
              disabled={!micRecording}
              className={`px-6 py-3 rounded font-semibold transition ${
                !micRecording
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
               Microphone OFF
            </button>
          </div>

          {cameraActive && (
            <p className="text-yellow-400 text-sm mt-3">
              ⚠️ Camera is active. Stop camera before testing microphone.
            </p>
          )}
        </div>

        {/* Console Logs */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
               Console Log
            </h2>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-semibold transition"
            >
              Clear
            </button>
          </div>

          <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Start by clicking buttons above.</p>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={
                    log.type === 'error'
                      ? 'text-red-400'
                      : log.type === 'success'
                        ? 'text-green-400'
                        : 'text-blue-400'
                  }
                >
                  {log.message}
                </div>
              ))
            )}
          </div>
        </div>

  
      </div>
    </div>
  );
}
         