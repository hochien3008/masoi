import React, { useState } from 'react';
import { CheckCircle, Eye, Sparkles } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function RoleReveal({ myRoleDetails, myPlayer, players, timer, onReady }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = () => {
    sounds.playCardFlip();
    setFlipped(!flipped);
  };

  const isReady = myPlayer?.isReady;
  const readyCount = players.filter(p => p.isReady).length;

  // Fellow wolves if werewolf
  const fellowWolves = myRoleDetails?.id === 'WEREWOLF'
    ? players.filter(p => p.role === 'WEREWOLF' && p.id !== myPlayer?.id)
    : [];

  const cardImgSrc = myRoleDetails?.id ? `/cards/${myRoleDetails.id}.jpg` : null;

  return (
    <div style={{ textAlign: 'center', width: '100%' }}>
      <div className="phase-header">
        <span className="phase-tag tag-night">
          BÍ MẬT THÂN PHẬN
        </span>
        <h2 style={{ fontSize: '1.5rem', marginTop: '4px' }}>VAI TRÒ CỦA BẠN</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Tuyệt đối giữ bí mật màn hình với những người chơi xung quanh!
        </p>
        <div className="timer-box">
          ⏱️ {timer}s
        </div>
      </div>

      <div className="role-card-container" onClick={handleFlip}>
        <div className={`role-card-inner ${flipped ? 'flipped' : ''}`}>
          {/* FRONT: Ornate Velvet Tarot Back */}
          <div className="role-card-front">
            <div className="card-shimmer-glare" />
            <div className="role-card-front-content">
              <div className="card-top-tag">
                NIGHTFALL TAROT
              </div>

              {/* Center is completely unobstructed - Wolf Mandala artwork shines 100% */}
              <div style={{ flex: 1 }} />

              <div className="card-tap-pill">
                <Eye size={14} /> CHẠM ĐỂ LẬT BÀI
              </div>
            </div>
          </div>

          {/* BACK: High-Res Role Tarot Card */}
          <div className="role-card-back" style={{ borderColor: myRoleDetails?.color || 'var(--border-subtle)' }}>
            <div className="card-shimmer-glare" />
            {cardImgSrc && (
              <div className="card-illustration-wrapper">
                <img
                  src={cardImgSrc}
                  alt={myRoleDetails?.name}
                  className="card-illustration-img"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="card-illustration-overlay" />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: myRoleDetails?.team === 'WEREWOLF'
                    ? 'rgba(239, 68, 68, 0.85)'
                    : (myRoleDetails?.team === 'NEUTRAL' ? 'rgba(139, 92, 246, 0.85)' : 'rgba(16, 185, 129, 0.85)'),
                  backdropFilter: 'blur(8px)',
                  color: '#fff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  letterSpacing: '1px'
                }}>
                  {myRoleDetails?.team === 'WEREWOLF'
                    ? 'PHE MA SÓI'
                    : (myRoleDetails?.team === 'NEUTRAL' ? 'PHE ĐỘC LẬP' : 'PHE DÂN LÀNG')}
                </div>
              </div>
            )}

            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <h2 style={{
                  fontSize: '1.4rem',
                  color: myRoleDetails?.color || '#fff',
                  fontWeight: 900,
                  marginTop: '-12px',
                  position: 'relative',
                  zIndex: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}>
                  <RoleIcon roleId={myRoleDetails?.id} size={28} />
                  <span>{myRoleDetails?.name}</span>
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{myRoleDetails?.tagline}"
                </div>
              </div>

              <p style={{
                fontSize: '0.8rem',
                lineHeight: '1.4',
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px 12px',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                {myRoleDetails?.description}
              </p>

              {fellowWolves.length > 0 && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: '#fca5a5',
                  textAlign: 'left'
                }}>
                  <strong>🐺 Đồng đội Sói:</strong> {fellowWolves.map(w => w.name).join(', ')}
                </div>
              )}

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Chạm lại để úp thẻ bài
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready Button */}
      <div style={{ maxWidth: '320px', margin: '14px auto 0' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={isReady}
          onClick={() => {
            sounds.playCardFlip();
            onReady();
          }}
          style={{
            background: isReady ? 'rgba(16, 185, 129, 0.2)' : undefined,
            border: isReady ? '1px solid #10b981' : undefined,
            boxShadow: isReady ? 'none' : undefined,
            color: isReady ? '#6ee7b7' : '#fff'
          }}
        >
          {isReady ? (
            <>
              <CheckCircle size={18} color="#10b981" />
              Đã Sẵn Sàng! ({readyCount}/{players.length})
            </>
          ) : (
            'TÔI ĐÃ SẴN SÀNG'
          )}
        </button>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>
          Đã có {readyCount}/{players.length} người chơi sẵn sàng
        </p>
      </div>
    </div>
  );
}
