import React, { useEffect, useState, useRef } from 'react';
import { sounds } from '../utils/soundEffects';

export default function PhaseTransition({ targetPhase, onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const isDay = targetPhase === 'DAY';
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    try {
      if (isDay) {
        sounds.playMorningChime();
      } else {
        sounds.playWolfHowl();
      }
    } catch (e) {
      console.warn('Transition audio error:', e);
    }

    // Elegant timing: 1600ms hold, 450ms smooth fade out (2050ms total)
    const holdTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1600);

    const completeTimer = setTimeout(() => {
      sounds.stopAll();
      if (onCompleteRef.current) onCompleteRef.current();
    }, 2050);

    return () => {
      sounds.stopAll();
      clearTimeout(holdTimer);
      clearTimeout(completeTimer);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: isDay 
          ? 'radial-gradient(circle at center, rgba(254, 243, 199, 0.96) 0%, rgba(251, 191, 36, 0.88) 45%, rgba(180, 83, 9, 0.92) 100%)' 
          : 'radial-gradient(circle at center, rgba(30, 27, 75, 0.96) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(3, 4, 7, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.45s ease',
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Soft Cinematic Edge Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        boxShadow: isDay
          ? 'inset 0 0 100px rgba(180, 83, 9, 0.6), inset 0 0 180px rgba(120, 53, 15, 0.4)'
          : 'inset 0 0 100px rgba(88, 28, 135, 0.7), inset 0 0 200px rgba(0, 0, 0, 0.9)',
        pointerEvents: 'none'
      }} />

      {/* Main Elegant Emblem */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        padding: '24px',
        textAlign: 'center'
      }}>
        {isDay ? (
          /* ================= DAY / DAWN MINIMALIST SUN ================= */
          <div style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Soft Warm Radial Bloom */}
            <div style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(254, 240, 138, 0.9) 0%, rgba(245, 158, 11, 0.4) 65%, transparent 80%)',
              filter: 'blur(15px)',
              animation: 'solarFlarePulse 2.2s ease-in-out infinite'
            }} />

            {/* Clean Golden Sun Emblem */}
            <div style={{
              animation: 'sunDiscRise 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              zIndex: 2,
              filter: 'drop-shadow(0 0 25px #f59e0b) drop-shadow(0 0 50px #d97706)'
            }}>
              <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
                <defs>
                  <radialGradient id="cleanSunGrad" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="35%" stopColor="#fef08a" />
                    <stop offset="70%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#d97706" />
                  </radialGradient>
                </defs>
                {/* Sun Body */}
                <circle cx="65" cy="65" r="46" fill="url(#cleanSunGrad)" stroke="#ffffff" strokeWidth="2.5" />
                {/* Inner Solar Ring */}
                <circle cx="65" cy="65" r="34" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="6 5" opacity="0.85" />
                {/* Clean 4-pointed radiant flare */}
                <polygon points="65,26 69,61 104,65 69,69 65,104 61,69 26,65 61,61" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
              </svg>
            </div>
          </div>
        ) : (
          /* ================= NIGHT / MOON MINIMALIST CRESCENT ================= */
          <div style={{
            position: 'relative',
            width: '180px',
            height: '180px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Soft Lunar Misty Bloom */}
            <div style={{
              position: 'absolute',
              width: '160px',
              height: '160px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192, 132, 252, 0.5) 0%, rgba(126, 34, 206, 0.2) 65%, transparent 80%)',
              filter: 'blur(15px)',
              animation: 'solarFlarePulse 2.4s ease-in-out infinite'
            }} />

            {/* Clean Luminous Crescent Moon */}
            <div style={{
              animation: 'moonRiseAndGlow 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
              zIndex: 2,
              filter: 'drop-shadow(0 0 25px #a855f7) drop-shadow(0 0 50px #7e22ce)'
            }}>
              <svg width="130" height="130" viewBox="0 0 130 130" fill="none">
                <defs>
                  <linearGradient id="cleanMoonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="30%" stopColor="#f3e8ff" />
                    <stop offset="70%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#7e22ce" />
                  </linearGradient>
                </defs>
                {/* Elegant Crescent Moon */}
                <path
                  d="M90 22 C60 27 38 52 38 82 C38 112 64 134 98 130 C64 125 47 95 56 65 C62 43 78 28 90 22 Z"
                  fill="url(#cleanMoonGrad)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  filter="drop-shadow(0 0 10px #e9d5ff)"
                />
                {/* North Star Accent */}
                <polygon points="100,48 103,56 111,59 103,62 100,70 97,62 89,59 97,56" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />
              </svg>
            </div>
          </div>
        )}

        {/* Clean, Elegant Typography */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '92vw'
        }}>
          <h2 style={{
            fontFamily: 'var(--font-title, serif)',
            fontSize: '1.9rem',
            fontWeight: 900,
            letterSpacing: '2px',
            textTransform: 'uppercase',
            margin: '0 0 8px 0',
            color: isDay ? '#78350f' : '#ffffff',
            textShadow: isDay 
              ? '0 2px 10px rgba(254, 240, 138, 0.9), 0 0 30px rgba(245, 158, 11, 0.8)'
              : '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 30px rgba(168, 85, 247, 0.9)'
          }}>
            {isDay ? 'BÌNH MINH LÓ RẠNG' : 'MÀN ĐÊM BUÔNG XUỐNG'}
          </h2>

          <p style={{
            fontFamily: 'var(--font-body, sans-serif)',
            fontSize: '0.92rem',
            fontWeight: 600,
            letterSpacing: '0.8px',
            margin: 0,
            color: isDay ? '#92400e' : '#e9d5ff',
            opacity: 0.95,
            textShadow: isDay ? '0 1px 2px rgba(254, 240, 138, 0.6)' : '0 0 12px rgba(168, 85, 247, 0.7)'
          }}>
            {isDay 
              ? 'Màn đêm tan biến • Dân làng thức giấc' 
              : 'Bóng tối bao trùm • Ma Sói thức tỉnh'}
          </p>
        </div>
      </div>
    </div>
  );
}

