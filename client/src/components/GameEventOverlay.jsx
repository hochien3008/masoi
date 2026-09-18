import React, { useEffect, useState, useRef } from 'react';
import { sounds } from '../utils/soundEffects';

export default function GameEventOverlay({ event, onComplete }) {
  const [isVisible, setIsVisible] = useState(true);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    // Ensure sound and vibration trigger strictly ONCE per event mount
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const isSelfWolf = event?.type === 'WOLF_KILL' && event?.isSelf;
    const isHunter = event?.type === 'HUNTER_SHOT';
    const isVote = event?.type === 'VOTE_ELIMINATED';
    const needsShake = isSelfWolf || isHunter || isVote;

    const duration = 2600;
    const fadeOutDelay = 2100;

    // Trigger authentic sound effect ONCE
    try {
      if (isSelfWolf) {
        sounds.playWolfHowl();
      } else if (event?.type === 'WOLF_KILL') {
        sounds.playBite();
      } else if (event?.type === 'POISON') {
        sounds.playPotion();
        setTimeout(() => sounds.playHaunt(), 250);
      } else if (event?.type === 'HEAL') {
        sounds.playShield();
      } else if (event?.type === 'WITCH_SAVE') {
        sounds.playPotion();
        setTimeout(() => sounds.playMorningChime(), 250);
      } else if (isVote) {
        sounds.playGavel();
      } else if (isHunter) {
        sounds.playGunshot();
      }
    } catch (e) {
      console.warn('Sound play error:', e);
    }

    let shakeTimer = null;
    if (needsShake) {
      document.body.classList.add('wolf-slashed-screen');
      shakeTimer = setTimeout(() => {
        document.body.classList.remove('wolf-slashed-screen');
      }, 850);
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, fadeOutDelay);

    const completeTimer = setTimeout(() => {
      document.body.classList.remove('wolf-slashed-screen');
      sounds.stopAll();
      if (onCompleteRef.current) onCompleteRef.current();
    }, duration);

    return () => {
      document.body.classList.remove('wolf-slashed-screen');
      sounds.stopAll();
      if (shakeTimer) clearTimeout(shakeTimer);
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, []); // Strictly empty dependency array so parent re-renders never restart sound/shake!

  const renderEffect = () => {
    switch (event.type) {
      case 'WOLF_KILL':
        if (event.isSelf) {
          return (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div className="blood-vignette-overlay" />
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                zIndex: 25, padding: '20px'
              }}>
                {/* 3 descending jagged razor claw marks matching the logo */}
                <div style={{
                  animation: 'clawSlashDown 1.15s cubic-bezier(0.22, 1, 0.36, 1) forwards',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  filter: 'drop-shadow(0 0 25px rgba(255, 0, 60, 0.9)) drop-shadow(0 0 60px rgba(220, 38, 38, 0.85))'
                }}>
                  <svg
                    width="360"
                    height="380"
                    viewBox="0 0 480 500"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ maxWidth: '92vw', maxHeight: '52vh', overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id="serratedClawGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ff4d6d" />
                        <stop offset="30%" stopColor="#ff003c" />
                        <stop offset="70%" stopColor="#c70039" />
                        <stop offset="100%" stopColor="#7a001e" />
                      </linearGradient>

                      <linearGradient id="neonSpineGrad" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="25%" stopColor="#ffffff" />
                        <stop offset="60%" stopColor="#fecdd3" />
                        <stop offset="100%" stopColor="#ff1744" />
                      </linearGradient>

                      <filter id="wolfNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2.5" result="blur1" />
                        <feGaussianBlur stdDeviation="7" result="blur2" />
                        <feMerge>
                          <feMergeNode in="blur2" />
                          <feMergeNode in="blur1" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Claw 1 - Left Slash */}
                    <path
                      d="M 240,140 L 230,149 L 221,157 L 213,167 L 203,175 L 195,186 L 184,193 L 177,204 L 165,211 L 160,222 L 147,228 L 142,241 L 129,247 L 125,260 L 111,265 L 109,279 L 93,283 L 92,299 L 76,302 L 77,319 L 59,321 L 61,339 L 42,340 L 46,359 L 26,360 L 31,380 L 17,385 L 23,406 L 20,420 L 37,417 L 42,405 L 62,405 L 58,385 L 77,384 L 71,363 L 89,361 L 85,341 L 101,338 L 99,320 L 114,316 L 113,299 L 127,294 L 127,278 L 141,272 L 142,257 L 155,251 L 158,237 L 169,230 L 174,217 L 184,209 L 190,198 L 200,189 L 206,178 L 216,169 L 223,159 L 233,151 Z"
                      fill="url(#serratedClawGrad)"
                      stroke="#ff0044"
                      strokeWidth="1.2"
                      filter="url(#wolfNeonGlow)"
                    />
                    <path
                      d="M 240,140 L 20,420"
                      stroke="url(#neonSpineGrad)"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ff003c)"
                    />

                    {/* Claw 2 - Center Deep Lethal Slash */}
                    <path
                      d="M 360,40 L 351,52 L 341,63 L 334,76 L 323,87 L 316,100 L 305,110 L 299,124 L 286,133 L 281,148 L 267,156 L 264,172 L 248,180 L 247,196 L 230,203 L 230,220 L 212,227 L 213,245 L 194,250 L 197,269 L 176,274 L 180,294 L 158,298 L 165,319 L 141,322 L 149,344 L 123,346 L 133,369 L 106,370 L 118,395 L 91,396 L 106,422 L 90,429 L 101,453 L 100,470 L 120,465 L 124,450 L 152,450 L 144,427 L 171,427 L 157,401 L 182,399 L 170,374 L 193,371 L 183,347 L 204,343 L 196,321 L 216,316 L 209,294 L 228,288 L 223,268 L 240,261 L 237,242 L 253,234 L 251,216 L 266,208 L 266,190 L 280,181 L 281,165 L 293,155 L 296,140 L 308,129 L 312,115 L 322,103 L 328,90 L 337,78 L 344,65 L 353,53 Z"
                      fill="url(#serratedClawGrad)"
                      stroke="#ff0044"
                      strokeWidth="1.4"
                      filter="url(#wolfNeonGlow)"
                    />
                    <path
                      d="M 360,40 L 100,470"
                      stroke="url(#neonSpineGrad)"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 5px #ffffff) drop-shadow(0 0 10px #ff003c)"
                    />

                    {/* Claw 3 - Right Slash */}
                    <path
                      d="M 460,20 L 450,33 L 440,47 L 432,61 L 421,74 L 414,88 L 402,100 L 395,116 L 382,127 L 377,143 L 363,154 L 359,171 L 344,181 L 341,198 L 325,208 L 324,226 L 306,235 L 307,254 L 288,262 L 290,283 L 270,290 L 274,311 L 252,317 L 258,340 L 234,345 L 242,368 L 217,373 L 228,398 L 212,408 L 222,432 L 220,450 L 240,442 L 244,426 L 270,422 L 262,399 L 286,393 L 276,368 L 297,362 L 289,338 L 309,331 L 303,308 L 321,300 L 317,278 L 334,269 L 331,249 L 347,239 L 346,219 L 361,209 L 361,190 L 375,179 L 377,162 L 389,150 L 393,133 L 404,121 L 409,104 L 420,91 L 426,76 L 435,63 L 443,48 L 453,35 Z"
                      fill="url(#serratedClawGrad)"
                      stroke="#ff0044"
                      strokeWidth="1.2"
                      filter="url(#wolfNeonGlow)"
                    />
                    <path
                      d="M 460,20 L 220,450"
                      stroke="url(#neonSpineGrad)"
                      strokeWidth="3.0"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 4px #ffffff) drop-shadow(0 0 8px #ff003c)"
                    />
                  </svg>
                </div>

                <div style={{
                  marginTop: '16px',
                  textAlign: 'center',
                  animation: 'fadeIn 0.6s ease 0.25s both'
                }}>
                  <div style={{
                    color: '#ef4444',
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '3px',
                    textTransform: 'uppercase',
                    textShadow: '0 0 25px #ef4444, 0 0 50px #991b1b'
                  }}>
                    BẠN ĐÃ BỊ MA SÓI SÁT HẠI!
                  </div>
                  <div style={{
                    color: '#fca5a5',
                    fontSize: '0.92rem',
                    marginTop: '6px',
                    letterSpacing: '1px',
                    fontWeight: 600,
                    opacity: 0.95
                  }}>
                    Móng vuốt khát máu đã cướp đi sinh mệnh của bạn trong đêm
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Standard wolf kill for someone else - Fierce Werewolf Maw & Blood Claws
        return (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div className="blood-vignette-overlay" />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 25, padding: '20px'
            }}>
              <div style={{
                animation: 'wolfMawSnap 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                filter: 'drop-shadow(0 0 35px #ef4444) drop-shadow(0 0 70px rgba(220, 38, 38, 0.9))'
              }}>
                <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Blood Claw Cross Behind Head */}
                  <path d="M30 40 L210 200 M210 40 L30 200" stroke="#b91c1c" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                  <path d="M30 40 L210 200 M210 40 L30 200" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.9" />

                  {/* Werewolf Head Silhouette with Razor Fangs */}
                  <path
                    d="M120 25 C140 40 180 50 200 90 C180 100 175 125 185 150 C160 145 140 160 135 185 C125 210 115 210 105 185 C100 160 80 145 55 150 C65 125 60 100 40 90 C60 50 100 40 120 25 Z"
                    fill="#180404"
                    stroke="#ef4444"
                    strokeWidth="3.5"
                  />
                  {/* Blazing Red Eyes */}
                  <polygon points="90,95 105,90 100,105" fill="#ffffff" filter="drop-shadow(0 0 8px #ef4444)" />
                  <polygon points="150,95 135,90 140,105" fill="#ffffff" filter="drop-shadow(0 0 8px #ef4444)" />
                  <circle cx="98" cy="98" r="3" fill="#ff0000" />
                  <circle cx="142" cy="98" r="3" fill="#ff0000" />

                  {/* Upper & Lower Razor Fangs */}
                  <polygon points="95,140 100,165 105,140" fill="#ffffff" filter="drop-shadow(0 0 4px #ef4444)" />
                  <polygon points="135,140 140,165 145,140" fill="#ffffff" filter="drop-shadow(0 0 4px #ef4444)" />
                  <polygon points="110,140 115,155 120,140" fill="#ffffff" />
                  <polygon points="120,140 125,155 130,140" fill="#ffffff" />
                  <polygon points="102,185 107,165 112,185" fill="#ffffff" filter="drop-shadow(0 0 4px #ef4444)" />
                  <polygon points="128,185 133,165 138,185" fill="#ffffff" filter="drop-shadow(0 0 4px #ef4444)" />
                </svg>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                  color: '#ef4444', fontSize: '1.65rem', fontWeight: 900,
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textShadow: '0 0 25px #ef4444, 0 0 45px #991b1b'
                }}>
                  CÓ NGƯỜI BỊ MA SÓI SÁT HẠI!
                </div>
                <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '6px', fontWeight: 600, opacity: 0.9 }}>
                  Tiếng gầm xé toạc màn đêm - Nanh vuốt sói đã cướp đi một sinh mệnh
                </div>
              </div>
            </div>
          </div>
        );

      case 'POISON':
        return (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Deep Toxic Violet Vignette */}
            <div className="poison-vignette-overlay" />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 25, padding: '20px'
            }}>
              {/* Rotating Arcane Seal + Toxic Skull Flask */}
              <div style={{
                position: 'relative', width: '260px', height: '260px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {/* Arcane Magic Seal (Rotating) */}
                <svg
                  width="260"
                  height="260"
                  viewBox="0 0 260 260"
                  style={{
                    position: 'absolute', inset: 0,
                    animation: 'hexSpinSlow 16s linear infinite',
                    filter: 'drop-shadow(0 0 15px rgba(168, 85, 247, 0.7))'
                  }}
                >
                  <circle cx="130" cy="130" r="115" stroke="#a855f7" strokeWidth="2" strokeDasharray="8 6" opacity="0.6" />
                  <circle cx="130" cy="130" r="95" stroke="#c084fc" strokeWidth="1.5" opacity="0.8" />
                  <polygon points="130,35 212,177 48,177" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <polygon points="130,225 212,83 48,83" stroke="#a855f7" strokeWidth="1.5" fill="none" opacity="0.5" />
                  <circle cx="130" cy="130" r="45" stroke="#e9d5ff" strokeWidth="1" strokeDasharray="4 4" />
                </svg>

                {/* Bubbling Toxic Skull Flask */}
                <div style={{
                  animation: 'potionBrewShake 1.2s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 30px #a855f7) drop-shadow(0 0 60px rgba(168, 85, 247, 0.9))',
                  zIndex: 2
                }}>
                  <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
                    <defs>
                      <linearGradient id="toxicGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#d8b4fe" />
                        <stop offset="40%" stopColor="#a855f7" />
                        <stop offset="80%" stopColor="#7e22ce" />
                        <stop offset="100%" stopColor="#3b0764" />
                      </linearGradient>
                    </defs>
                    {/* Flask Cork & Neck */}
                    <rect x="62" y="10" width="26" height="12" rx="3" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
                    <path d="M66 22 L66 42 L84 42 L84 22 Z" fill="#3b0764" stroke="#a855f7" strokeWidth="1.5" />
                    {/* Flask Body */}
                    <path
                      d="M66 42 C66 42 30 75 30 110 C30 135 50 145 75 145 C100 145 120 135 120 110 C120 75 84 42 84 42 Z"
                      fill="url(#toxicGrad)"
                      stroke="#c084fc"
                      strokeWidth="2.5"
                    />
                    {/* Inner glowing skull emblem */}
                    <path
                      d="M65 92 C65 80 85 80 85 92 C85 100 80 102 80 108 L70 108 C70 102 65 100 65 92 Z"
                      fill="#ffffff"
                      opacity="0.85"
                    />
                    <circle cx="71" cy="92" r="2.5" fill="#3b0764" />
                    <circle cx="79" cy="92" r="2.5" fill="#3b0764" />
                    {/* Rising Fumes */}
                    <circle cx="58" cy="70" r="3" fill="#e9d5ff" opacity="0.8" />
                    <circle cx="88" cy="62" r="4" fill="#e9d5ff" opacity="0.9" />
                    <circle cx="74" cy="50" r="2.5" fill="#ffffff" />
                  </svg>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                  color: '#c084fc', fontSize: '1.65rem', fontWeight: 900,
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textShadow: '0 0 25px #a855f7, 0 0 50px #7e22ce'
                }}>
                  ĐỘC DƯỢC PHÙ THỦY PHÁT TÁC!
                </div>
                <div style={{ color: '#e9d5ff', fontSize: '0.9rem', marginTop: '6px', fontWeight: 600, opacity: 0.9 }}>
                  Làn khói độc tím đã phong ấn và tước đoạt sinh mệnh trong câm lặng
                </div>
              </div>
            </div>
          </div>
        );

      case 'HEAL':
        return (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Radiant Cyan Divine Aura */}
            <div className="heal-vignette-overlay" />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 25, padding: '20px'
            }}>
              {/* Divine Aegis Shield Materialization */}
              <div style={{
                position: 'relative', width: '260px', height: '260px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {/* Hexagonal Guardian Ring */}
                <svg
                  width="260"
                  height="260"
                  viewBox="0 0 260 260"
                  style={{
                    position: 'absolute', inset: 0,
                    animation: 'hexSpinSlow 20s linear infinite',
                    filter: 'drop-shadow(0 0 16px rgba(6, 182, 212, 0.8))'
                  }}
                >
                  <polygon
                    points="130,20 225,75 225,185 130,240 35,185 35,75"
                    stroke="#06b6d4"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="10 8"
                    opacity="0.8"
                  />
                  <circle cx="130" cy="130" r="85" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                </svg>

                {/* Holy Paladin Crystal Shield */}
                <div style={{
                  animation: 'divineShieldPop 0.85s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                  filter: 'drop-shadow(0 0 35px #06b6d4) drop-shadow(0 0 70px #0891b2)',
                  zIndex: 2
                }}>
                  <svg width="170" height="190" viewBox="0 0 170 190" fill="none">
                    <defs>
                      <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="30%" stopColor="#67e8f9" />
                        <stop offset="70%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0e7490" />
                      </linearGradient>
                    </defs>
                    {/* Shield Crest Contour */}
                    <path
                      d="M85 10 L150 35 C150 115 125 155 85 180 C45 155 20 115 20 35 Z"
                      fill="url(#shieldGrad)"
                      stroke="#ffffff"
                      strokeWidth="3.5"
                    />
                    {/* Inner Divine Inscription Cross */}
                    <path
                      d="M85 40 L85 150 M45 85 L125 85"
                      stroke="#ffffff"
                      strokeWidth="5"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 8px #ffffff)"
                    />
                    {/* Angelic Shield Wings Accents */}
                    <path d="M40 50 C55 65 65 95 65 125" stroke="#cffafe" strokeWidth="2" strokeLinecap="round" />
                    <path d="M130 50 C115 65 105 95 105 125" stroke="#cffafe" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                  color: '#22d3ee', fontSize: '1.65rem', fontWeight: 900,
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textShadow: '0 0 25px #06b6d4, 0 0 50px #0891b2'
                }}>
                  BÁC SĨ BẢO VỆ THÀNH CÔNG!
                </div>
                <div style={{ color: '#cffafe', fontSize: '0.9rem', marginTop: '6px', fontWeight: 600, opacity: 0.9 }}>
                  Khiên thánh hộ mệnh đã chặn đứng hoàn toàn nanh vuốt của ma sói
                </div>
              </div>
            </div>
          </div>
        );

      case 'WITCH_SAVE':
        return (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Luminous Pink Cosmic Aura */}
            <div className="witch-vignette-overlay" />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 25, padding: '20px'
            }}>
              {/* Celestial Flask of Life & Phoenix Sparkles */}
              <div style={{
                position: 'relative', width: '260px', height: '260px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {/* Expanding Stardust Halo */}
                <svg
                  width="260"
                  height="260"
                  viewBox="0 0 260 260"
                  style={{
                    position: 'absolute', inset: 0,
                    animation: 'hexSpinSlow 18s linear infinite reverse',
                    filter: 'drop-shadow(0 0 16px rgba(236, 72, 153, 0.8))'
                  }}
                >
                  <circle cx="130" cy="130" r="110" stroke="#ec4899" strokeWidth="2" strokeDasharray="12 8" opacity="0.7" />
                  <circle cx="130" cy="130" r="90" stroke="#f472b6" strokeWidth="1" opacity="0.6" />
                  <polygon points="130,25 220,130 130,235 40,130" stroke="#fbcfe8" strokeWidth="1.5" fill="none" opacity="0.5" />
                </svg>

                {/* Golden & Pink Elixir Flask */}
                <div style={{
                  animation: 'potionBrewShake 1.4s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 35px #ec4899) drop-shadow(0 0 70px #db2777)',
                  zIndex: 2
                }}>
                  <svg width="150" height="150" viewBox="0 0 150 150" fill="none">
                    <defs>
                      <linearGradient id="elixirGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="35%" stopColor="#f472b6" />
                        <stop offset="75%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#9d174d" />
                      </linearGradient>
                    </defs>
                    <rect x="62" y="10" width="26" height="12" rx="3" fill="#fcd34d" stroke="#ffffff" strokeWidth="2" />
                    <path d="M66 22 L66 42 L84 42 L84 22 Z" fill="#f59e0b" stroke="#fde68a" strokeWidth="1.5" />
                    <path
                      d="M66 42 C66 42 25 75 25 110 C25 135 48 145 75 145 C102 145 125 135 125 110 C125 75 84 42 84 42 Z"
                      fill="url(#elixirGrad)"
                      stroke="#ffffff"
                      strokeWidth="3"
                    />
                    {/* Glowing Heart of Life */}
                    <path
                      d="M75 85 C70 75 55 75 55 90 C55 105 75 120 75 120 C75 120 95 105 95 90 C95 75 80 75 75 85 Z"
                      fill="#ffffff"
                      filter="drop-shadow(0 0 8px #ffffff)"
                    />
                  </svg>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                  color: '#f472b6', fontSize: '1.65rem', fontWeight: 900,
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textShadow: '0 0 25px #ec4899, 0 0 50px #db2777'
                }}>
                  PHÙ THỦY DÙNG BÌNH CỨU SỐNG!
                </div>
                <div style={{ color: '#fce7f3', fontSize: '0.9rem', marginTop: '6px', fontWeight: 600, opacity: 0.9 }}>
                  Nước thần hồi sinh đã kịp thời kéo linh hồn trở về từ cõi chết
                </div>
              </div>
            </div>
          </div>
        );

      case 'VOTE_ELIMINATED':
        return (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Ominous Gallows Execution Vignette */}
            <div className="execution-vignette-overlay" />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 25, padding: '20px'
            }}>
              {/* Swinging Gallows Noose & Gavel of Judgment */}
              <div style={{
                position: 'relative', width: '260px', height: '260px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <div style={{
                  transformOrigin: 'top center',
                  animation: 'nooseSwing 3s ease-in-out infinite',
                  filter: 'drop-shadow(0 0 30px #ef4444) drop-shadow(0 0 60px rgba(185, 28, 28, 0.9))'
                }}>
                  <svg width="200" height="230" viewBox="0 0 200 230" fill="none">
                    {/* Gallows Beam */}
                    <line x1="20" y1="15" x2="180" y2="15" stroke="#78350f" strokeWidth="12" strokeLinecap="round" />
                    <line x1="140" y1="15" x2="100" y2="55" stroke="#78350f" strokeWidth="8" />
                    {/* Hanging Rope */}
                    <line x1="100" y1="15" x2="100" y2="85" stroke="#d97706" strokeWidth="4.5" strokeDasharray="6 3" />
                    {/* Heavy Woven Hangman Noose Knot */}
                    <rect x="94" y="85" width="12" height="18" rx="2" fill="#b45309" stroke="#f59e0b" strokeWidth="1.5" />
                    {/* Noose Loop */}
                    <path
                      d="M94 103 C80 120 75 160 100 175 C125 160 120 120 106 103 Z"
                      stroke="#ef4444"
                      strokeWidth="5"
                      fill="rgba(239, 68, 68, 0.15)"
                      filter="drop-shadow(0 0 10px #ef4444)"
                    />
                    {/* Scale of Justice Cross Silhouette */}
                    <circle cx="100" cy="138" r="14" fill="#ffffff" opacity="0.9" filter="drop-shadow(0 0 6px #ffffff)" />
                    <path d="M96 138 L104 138 M100 134 L100 142" stroke="#b91c1c" strokeWidth="3" />
                  </svg>
                </div>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                  color: '#ef4444', fontSize: '1.65rem', fontWeight: 900,
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textShadow: '0 0 25px #ef4444, 0 0 50px #991b1b'
                }}>
                  BẢN ÁN TREO CỔ ĐÃ THỰC THI!
                </div>
                <div style={{ color: '#fca5a5', fontSize: '0.9rem', marginTop: '6px', fontWeight: 600, opacity: 0.9 }}>
                  Ý chí và công lý của dân làng đã chọn kẻ phải đền tội
                </div>
              </div>
            </div>
          </div>
        );

      case 'HUNTER_SHOT':
        return (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* Blazing Gold & Amber Hunter Flame Vignette */}
            <div className="hunter-vignette-overlay" />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 25, padding: '20px'
            }}>
              {/* Sniper Reticle + Fiery Bullet Streak */}
              <div style={{
                position: 'relative', width: '260px', height: '260px',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {/* Locking Sniper Reticle */}
                <svg
                  width="260"
                  height="260"
                  viewBox="0 0 260 260"
                  style={{
                    position: 'absolute', inset: 0,
                    animation: 'crosshairLockAnim 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                    filter: 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.95)) drop-shadow(0 0 50px #b45309)'
                  }}
                >
                  {/* Concentric Aim Rings */}
                  <circle cx="130" cy="130" r="105" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="14 10" />
                  <circle cx="130" cy="130" r="75" stroke="#fbbf24" strokeWidth="2" opacity="0.85" />
                  <circle cx="130" cy="130" r="30" stroke="#fef08a" strokeWidth="2.5" />
                  <circle cx="130" cy="130" r="4" fill="#ffffff" filter="drop-shadow(0 0 6px #ffffff)" />

                  {/* Crosshairs & Precision Ticks */}
                  <line x1="130" y1="10" x2="130" y2="250" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                  <line x1="10" y1="130" x2="250" y2="130" stroke="#fbbf24" strokeWidth="2" opacity="0.8" />
                  <line x1="115" y1="100" x2="145" y2="100" stroke="#fef08a" strokeWidth="2" />
                  <line x1="115" y1="160" x2="145" y2="160" stroke="#fef08a" strokeWidth="2" />
                  <line x1="100" y1="115" x2="100" y2="145" stroke="#fef08a" strokeWidth="2" />
                  <line x1="160" y1="115" x2="160" y2="145" stroke="#fef08a" strokeWidth="2" />

                  {/* Bullet Hole Shockwaves */}
                  <line x1="130" y1="130" x2="90" y2="70" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 6" />
                  <line x1="130" y1="130" x2="180" y2="80" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 6" />
                  <line x1="130" y1="130" x2="80" y2="190" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 6" />
                  <line x1="130" y1="130" x2="190" y2="180" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 6" />
                </svg>
              </div>

              <div style={{ marginTop: '20px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
                <div style={{
                  color: '#fbbf24', fontSize: '1.65rem', fontWeight: 900,
                  letterSpacing: '2.5px', textTransform: 'uppercase',
                  textShadow: '0 0 25px #f59e0b, 0 0 50px #b45309'
                }}>
                  PHÁT BẮN CUỐI CÙNG CỦA THỢ SĂN!
                </div>
                <div style={{ color: '#fef08a', fontSize: '0.9rem', marginTop: '6px', fontWeight: 600, opacity: 0.9 }}>
                  Người gác rừng ngã xuống nhưng viên đạn định mệnh đã kịp hạ gục kẻ thù
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9998,
      pointerEvents: 'none',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>
      {renderEffect()}
    </div>
  );
}
