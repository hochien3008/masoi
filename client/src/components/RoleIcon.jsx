import React from 'react';
import { assetUrl } from '../utils/assetHelper';

export default function RoleIcon({ roleId, role, size = 28, style = {}, className = '' }) {
  const id = roleId || role?.id;
  if (!id) return null;

  const iconSrc = assetUrl(`/icons/${id}.jpg`);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        overflow: 'hidden',
        border: '1px solid rgba(212, 175, 55, 0.6)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 8px rgba(212, 175, 55, 0.25)',
        flexShrink: 0,
        background: '#0a0d14',
        ...style
      }}
    >
      <img
        src={iconSrc}
        alt={role?.name || id}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </span>
  );
}
