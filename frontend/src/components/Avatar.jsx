import React, { useState } from 'react';

// Generates a deterministic pleasant background hue from a string
function getAvatarGradient(name = '') {
  const gradients = [
    'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', // Blue
    'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
    'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)', // Purple
    'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)', // Amber
    'linear-gradient(135deg, #ec4899 0%, #be185d 100%)', // Pink
    'linear-gradient(135deg, #06b6d4 0%, #0e7490 100%)', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// Extracts clean 1-2 letter initials, skipping student ID prefixes if present
function getInitials(name = '', email = '') {
  if (!name && !email) return 'CG';
  const cleanName = name.replace(/^(BTCD|GID|ROLL|STU)\w*\s+/i, '').trim() || name.trim() || email.split('@')[0];
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return cleanName.slice(0, 2).toUpperCase();
}

export default function Avatar({
  user,
  name: propName,
  avatar: propAvatar,
  email: propEmail,
  size = 36,
  borderRadius = 10,
  style = {}
}) {
  const [imgError, setImgError] = useState(false);

  const name = propName || user?.name || '';
  const email = propEmail || user?.email || '';
  const avatarUrl = (!imgError && (propAvatar || user?.avatar)) ? (propAvatar || user?.avatar) : null;
  const initials = getInitials(name, email);
  const bgGradient = getAvatarGradient(name || email);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'User Avatar'}
        onError={() => setImgError(true)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
          objectFit: 'cover',
          flexShrink: 0,
          border: '1px solid var(--border-subtle)',
          display: 'block',
          ...style
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        background: bgGradient,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
        fontSize: `${Math.max(10, Math.round(size * 0.38))}px`,
        letterSpacing: '0.5px',
        flexShrink: 0,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
        userSelect: 'none',
        ...style
      }}
      title={name || email || 'Campus Member'}
    >
      {initials}
    </div>
  );
}

