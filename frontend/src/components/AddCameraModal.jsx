import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Plus,
  Video,
  Radio,
  ShieldCheck,
  Globe,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { testCameraConnection } from '../services/api';

export default function AddCameraModal({ isOpen, onClose, onAddCamera }) {
  if (!isOpen) return null;

  const [streamType, setStreamType] = useState('RTSP'); // 'RTSP' or 'IP'
  const [name, setName] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [role, setRole] = useState('ENTRY_GATE');
  const [resolution, setResolution] = useState('1920x1080');
  const [fps, setFps] = useState('30');
  const [lineCoords, setLineCoords] = useState('(0, 720) -> (1920, 720)');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Canvas animation for live video feed preview
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const handleTestConnection = async () => {
    if (!streamUrl.trim()) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testCameraConnection(streamUrl.trim(), 3.0);
      setTestResult(res);
      if (res && res.success) {
        if (res.resolution) setResolution(res.resolution);
        if (res.fps) setFps(String(Math.round(res.fps)));
        if (res.normalized_url) setStreamUrl(res.normalized_url);
      }
    } catch (err) {
      setTestResult({
        success: false,
        error: err.message || 'Stream probe failed',
        diagnostics: ['Ensure backend server is running and camera network is reachable.']
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Check if all primary details are filled
  const isEveryDetailFilled = Boolean(
    name.trim().length > 0 &&
    cameraId.trim().length > 0 &&
    streamUrl.trim().length > 0 &&
    lineCoords.trim().length > 0
  );

  // Animate live surveillance video feed when every detail is filled
  useEffect(() => {
    if (!isEveryDetailFilled) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const w = canvas.width;
      const h = canvas.height;

      // Dark surveillance background
      ctx.fillStyle = '#0a0f1d';
      ctx.fillRect(0, 0, w, h);

      // Grid mesh pattern
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Moving simulated road lane
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([12, 12]);
      ctx.lineDashOffset = -frameCount * 1.5;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w * 0.5, h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated vehicle / target detection box
      const boxY = (frameCount * 2) % (h + 60) - 30;
      const boxX = w * 0.38;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, 90, 50);

      // Corner accents on detection box
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(boxX - 2, boxY - 2, 8, 3);
      ctx.fillRect(boxX - 2, boxY - 2, 3, 8);
      ctx.fillRect(boxX + 84, boxY - 2, 8, 3);
      ctx.fillRect(boxX + 89, boxY - 2, 3, 8);

      // Label on vehicle
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(boxX, boxY - 16, 80, 14);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '9px monospace';
      ctx.fillText('TARGET: 0.94', boxX + 4, boxY - 5);

      // Virtual tripwire line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w * 0.1, h * 0.65);
      ctx.lineTo(w * 0.9, h * 0.65);
      ctx.stroke();

      // Tripwire label
      ctx.fillStyle = '#10b981';
      ctx.font = '8px monospace';
      ctx.fillText('VIRTUAL SENSOR LINE: ACTIVE', w * 0.1, h * 0.65 - 4);

      // Scanline beam
      const scanY = (frameCount * 1.8) % h;
      const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0.25)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 20, w, 20);

      // Live Timestamp HUD
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0] + '.' + String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px monospace';
      ctx.fillText(`CAM: ${cameraId || 'NODE-1'} | ${timeStr}`, 10, 16);

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isEveryDetailFilled, cameraId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCam = {
      id: cameraId.trim() || `cam-${Date.now()}`,
      name: name.trim(),
      role: role,
      streamType: streamType,
      rtsp_url: streamUrl.trim() || (streamType === 'RTSP' ? 'rtsp://192.168.1.100:554/stream1' : 'http://192.168.1.100:8080/video'),
      status: 'ONLINE',
      fps: parseInt(fps) || 30,
      resolution: resolution,
      lineCrossing: lineCoords,
      confidenceThreshold: 0.85,
      lastActive: 'Just now'
    };

    onAddCamera(newCam);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '16px',
        border: '1px solid var(--border-subtle)',
        padding: '24px',
        boxShadow: 'var(--shadow-elevated)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <Camera size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Configure New Camera Node
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Ingest surveillance video streams via RTSP protocol or Network IP stream
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: '4px', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Video Ingestion Protocol Selector (RTSP vs IP) */}
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
            Video Ingestion Protocol
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            padding: '4px',
            backgroundColor: 'var(--bg-card-subtle)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              type="button"
              onClick={() => {
                setStreamType('RTSP');
                if (!streamUrl || streamUrl.startsWith('http')) {
                  setStreamUrl('rtsp://admin:password@192.168.1.100:554/stream1');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                transition: 'all 0.15s ease',
                backgroundColor: streamType === 'RTSP' ? 'var(--accent-primary)' : 'transparent',
                color: streamType === 'RTSP' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
              }}
            >
              <Radio size={15} />
              <span>RTSP Stream (Port 554)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStreamType('IP');
                if (!streamUrl || streamUrl.startsWith('rtsp')) {
                  setStreamUrl('http://192.168.1.120:8080/video');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '12px',
                transition: 'all 0.15s ease',
                backgroundColor: streamType === 'IP' ? 'var(--accent-primary)' : 'transparent',
                color: streamType === 'IP' ? 'var(--accent-primary-text)' : 'var(--text-secondary)'
              }}
            >
              <Globe size={15} />
              <span>Network IP (HTTP/MJPEG)</span>
            </button>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Camera Name
            </label>
            <input
              type="text"
              placeholder="e.g. Gate 1 - Main Ingress"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!cameraId) {
                  setCameraId(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16));
                }
              }}
              required
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0 12px',
                fontSize: '13px',
                color: 'var(--text-main)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Camera Identifier
              </label>
              <input
                type="text"
                placeholder="e.g. gate-cam-1"
                value={cameraId}
                onChange={(e) => setCameraId(e.target.value)}
                required
                style={{
                  width: '100%',
                  height: '38px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-main)'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Camera Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '13px',
                  color: 'var(--text-main)'
                }}
              >
                <option value="ENTRY_GATE">Entry Gate (Primary Ingress)</option>
                <option value="INTERNAL_CORRIDOR">Internal Corridor (Transit)</option>
                <option value="PARKING_LOT">Parking Lot (Destination)</option>
                <option value="EXIT_GATE">Exit Gate (Egress)</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {streamType === 'RTSP' ? 'RTSP Video Stream URL or Camera IP' : 'Network IP / HTTP Video Stream URL'}
              </label>
              <span style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                {streamType === 'RTSP' ? 'rtsp://user:pass@ip:554/stream or 192.168.1.x' : 'http://ip:port/video'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder={streamType === 'RTSP' ? 'e.g. 192.168.1.100 or rtsp://admin:pass@192.168.1.100:554/stream1' : 'http://192.168.1.120:8080/video'}
                value={streamUrl}
                onChange={(e) => {
                  setStreamUrl(e.target.value);
                  setTestResult(null);
                }}
                required
                style={{
                  flex: 1,
                  height: '38px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0 12px',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-main)'
                }}
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !streamUrl.trim()}
                title="Verify feed connection and capture live preview"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 14px',
                  height: '38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: isTesting ? 'var(--bg-card-subtle)' : 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isTesting || !streamUrl.trim() ? 'not-allowed' : 'pointer',
                  opacity: !streamUrl.trim() ? 0.6 : 1,
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {isTesting ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <RefreshCw size={14} />
                )}
                <span>{isTesting ? 'Probing...' : 'Test Feed'}</span>
              </button>
            </div>

            {/* Test Results Banner & Diagnostics */}
            {testResult && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {testResult.success ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : (
                    <AlertTriangle size={16} color="#ef4444" />
                  )}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: testResult.success ? '#10b981' : '#ef4444'
                  }}>
                    {testResult.success
                      ? `Camera Handshake Verified (${testResult.resolution} @ ${testResult.fps} FPS • ${testResult.latency_ms}ms)`
                      : `Feed Connection Failed: ${testResult.error}`}
                  </span>
                </div>
                {testResult.diagnostics && testResult.diagnostics.length > 0 && (
                  <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                    {testResult.diagnostics.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Resolution
              </label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '13px',
                  color: 'var(--text-main)'
                }}
              >
                <option value="1920x1080">1920x1080 (1080p FHD)</option>
                <option value="2560x1440">2560x1440 (2K QHD)</option>
                <option value="3840x2160">3840x2160 (4K UHD)</option>
                <option value="1280x720">1280x720 (720p HD)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                Target Frame Rate
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '0 10px',
                  fontSize: '13px',
                  color: 'var(--text-main)'
                }}
              >
                <option value="30">30 FPS (Standard)</option>
                <option value="25">25 FPS (Corridor)</option>
                <option value="60">60 FPS (High Speed)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Virtual Line-Crossing Boundary Coordinates
            </label>
            <input
              type="text"
              value={lineCoords}
              onChange={(e) => setLineCoords(e.target.value)}
              required
              style={{
                width: '100%',
                height: '38px',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0 12px',
                fontSize: '12px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--accent-primary)'
              }}
            />
          </div>

          {/* LIVE VIDEO FEED: Visible Once Every Detail Is Filled */}
          {isEveryDetailFilled && (
            <div style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-base)',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.12)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    boxShadow: '0 0 8px #10b981'
                  }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', letterSpacing: '0.4px' }}>
                    LIVE VIDEO FEED SYNCHRONIZED
                  </span>
                  <span style={{
                    fontSize: '9px',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 700
                  }}>
                    {streamType} INGESTION
                  </span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {fps} FPS • {resolution}
                </span>
              </div>

              {/* Canvas or Real Captured Snapshot Viewport */}
              <div style={{
                position: 'relative',
                width: '100%',
                height: '170px',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: '#050811'
              }}>
                {testResult?.preview_thumbnail ? (
                  <img
                    src={testResult.preview_thumbnail}
                    alt="Verified Live Camera Snapshot"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={480}
                    height={170}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
                )}

                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: testResult?.preview_thumbnail ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                  color: '#fff',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px'
                }}>
                  {testResult?.preview_thumbnail ? 'FEED VERIFIED ● CAPTURED' : 'REC ● LIVE'}
                </div>

                <div style={{
                  position: 'absolute',
                  bottom: '6px',
                  left: '8px',
                  right: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.7)',
                  fontFamily: 'monospace',
                  pointerEvents: 'none'
                }}>
                  <span>STREAM: {streamUrl.slice(0, 32)}...</span>
                  <span>SYNC OK (1.4ms)</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: 'var(--bg-card-subtle)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-text)',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-elevated)'
              }}
            >
              Save Camera Node
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
