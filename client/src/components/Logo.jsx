import React from 'react';

export default function Logo({ size, variant = 'compact', showTagline = false }) {
  if (variant === 'hero') {
    return (
      <div className="wolfhunt-hero-brand">
        <div className="wolfhunt-icon-wrapper floating">
          <img
            src="/images/wolfhunt_logo.png"
            alt="WOLFHUNT"
            className="wolfhunt-hero-img"
            style={{
              width: size || 220,
              maxWidth: '92%',
              height: 'auto',
              filter: 'drop-shadow(0 0 25px rgba(56, 189, 248, 0.6)) drop-shadow(0 12px 25px rgba(0,0,0,0.8))',
              display: 'inline-block',
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
        <div className="wolfhunt-badge" style={{ marginTop: '6px' }}>
          <span className="badge-glow-dot" />
          DẠ THẦN MA SÓI ONLINE
        </div>
        {showTagline && (
          <p className="wolfhunt-tagline">
            Đấu Trí Trực Tuyến • Tự Động Quản Trò • Không Cần Tải App
          </p>
        )}
      </div>
    );
  }

  // Compact variant for Header / Top Bar
  return (
    <div className="brand wolfhunt-header-brand">
      <img
        src="/images/wolfhunt_logo.png"
        alt="WOLFHUNT"
        style={{
          width: size || 36,
          height: size || 36,
          objectFit: 'contain',
          filter: 'drop-shadow(0 0 8px rgba(56, 189, 248, 0.45))'
        }}
      />
      <div className="brand-text-wrap">
        <span className="part-wolf">WOLF</span>
        <span className="part-hunt">HUNT</span>
        <span className="brand-mini-badge">DẠ THẦN</span>
      </div>
    </div>
  );
}

