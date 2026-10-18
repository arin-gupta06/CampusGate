import React, { useState } from 'react';
import { X, Camera, Plus, Video, Radio, ShieldCheck } from 'lucide-react';

export default function AddCameraModal({ isOpen, onClose, onAddCamera }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [cameraId, setCameraId] = useState('');
  const [rtspUrl, setRtspUrl] = useState('');
  const [role, setRole] = useState('ENTRY_GATE');
  const [resolution, setResolution] = useState('1920x1080');
  const [fps, setFps] = useState('30');
  const [lineCoords, setLineCoords] = useState('(0, 720) -> (1920, 720)');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCam = {
      id: cameraId.trim() || `cam-${Date.now()}`,
      name: name.trim(),
      role: role,
      rtsp_url: rtspUrl.trim() || `rtsp://192.168.1.${Math.floor(Math.random() * 200 + 10)}:554/stream`,
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
        width: '520px',
        maxWidth: '95vw',
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
                Register CCTV RTSP stream & geometric line boundary
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Camera Name
            </label>
            <input
              type="text"
              placeholder="e.g. Gate 1 - Main Ingress"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              RTSP Video Stream URL
            </label>
            <input
              type="text"
              placeholder="rtsp://admin:password@192.168.1.100:554/stream1"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
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

          <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
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
                fontWeight: 600
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
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700
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
