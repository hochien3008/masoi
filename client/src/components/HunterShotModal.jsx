import React, { useState } from 'react';
import { Target, Skull, Flame } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function HunterShotModal({
  hunterData,
  hunterReport,
  myPlayerId,
  players,
  timer,
  onShoot
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [fired, setFired] = useState(false);

  const isMeHunter = hunterData && hunterData.hunterId === myPlayerId;
  const alivePlayers = players.filter(p => p.isAlive && p.id !== hunterData?.hunterId);

  const handleFire = () => {
    if (!selectedTarget || fired) return;
    sounds.playGunshot();
    setFired(true);
    onShoot(selectedTarget);
  };

  return (
    <div className="modal-backdrop" style={{
      background: 'radial-gradient(circle at center, rgba(127, 29, 29, 0.4) 0%, rgba(10, 13, 20, 0.95) 90%)',
      zIndex: 9999,
      backdropFilter: 'blur(8px)'
    }}>
      <div className="modal-content" style={{
        maxWidth: '460px',
        border: '2px solid #ef4444',
        boxShadow: '0 0 35px rgba(239, 68, 68, 0.5)',
        textAlign: 'center',
        padding: '24px'
      }}>
        {/* Header Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(239, 68, 68, 0.25)',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          borderRadius: '999px',
          padding: '4px 14px',
          fontSize: '0.8rem',
          fontWeight: 800,
          letterSpacing: '1px',
          marginBottom: '12px',
          textTransform: 'uppercase'
        }}>
          <Target size={14} /> PHÁT BẮN CUỐI CÙNG
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
          <RoleIcon roleId="HUNTER" size={68} />
        </div>

        {/* Hunter Report Result (if shot has resolved) */}
        {hunterReport ? (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fca5a5', marginBottom: '10px' }}>
              💥 TIẾNG NỎ VANG LÊN!
            </h2>
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              fontSize: '1.05rem',
              color: '#f8fafc',
              lineHeight: '1.6'
            }}>
              {hunterReport.message}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '14px' }}>
              Đang tiếp tục diễn biến trận đấu...
            </p>
          </div>
        ) : isMeHunter ? (
          /* Current player is Hunter and needs to shoot */
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '6px' }}>
              BẠN ĐÃ BỊ HẠ SÁT!
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Trước khi nhắm mắt, hãy nâng chiếc nỏ bạc lên và chọn kẻ bạn muốn kéo xuống mồ cùng mình!
            </p>

            <div className="timer-box timer-warning" style={{ margin: '0 auto 16px' }}>
              ⏱️ {timer}s
            </div>

            {/* Target selection list */}
            <div className="player-list" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {alivePlayers.map(p => {
                const isSelected = selectedTarget === p.id;
                return (
                  <div
                    key={p.id}
                    className={`player-card selectable ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (!fired) {
                        sounds.playCardFlip();
                        setSelectedTarget(p.id);
                      }
                    }}
                    style={{
                      borderColor: isSelected ? '#ef4444' : undefined,
                      boxShadow: isSelected ? '0 0 15px rgba(239, 68, 68, 0.4)' : undefined
                    }}
                  >
                    <div className="player-info">
                      <div className="player-avatar">{p.avatar}</div>
                      <div className="player-name">{p.name}</div>
                    </div>
                    {isSelected && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Target size={12} /> MỤC TIÊU
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={!selectedTarget || fired}
              onClick={handleFire}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                borderColor: '#f87171',
                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.5)'
              }}
            >
              <Flame size={18} />
              {fired ? 'ĐANG BẮN...' : 'BÓP CÒ BẮN NGAY!'}
            </button>
          </div>
        ) : (
          /* Other players are watching suspense */
          <div>
            <h2 style={{ fontSize: '1.4rem', color: '#fca5a5', marginBottom: '6px' }}>
              THỢ SĂN HẤP HỐI!
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <strong style={{ color: '#fff' }}>{hunterData?.hunterName}</strong> đang hấp hối và chuẩn bị bóp cò phát súng cuối cùng...
            </p>
            <div style={{
              margin: '20px 0',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed rgba(239, 68, 68, 0.3)',
              color: '#f8fafc',
              fontSize: '0.95rem'
            }}>
              🎯 Ai sẽ là kẻ xấu số bị kéo theo?
            </div>
            <div className="timer-box timer-warning" style={{ margin: '0 auto' }}>
              ⏱️ {timer}s
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
