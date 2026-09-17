import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Shield } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function GameOverModal({ winner, players, isHost, onPlayAgain }) {
  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn(e);
    }

    if (winner === 'WEREWOLF') {
      sounds.playWolfHowl();
    } else {
      sounds.playMorningChime();
    }
  }, [winner]);

  const isWolfWin = winner === 'WEREWOLF';
  const isFoolWin = winner === 'FOOL';

  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
        <RoleIcon roleId={isFoolWin ? 'FOOL' : (isWolfWin ? 'WEREWOLF' : 'VILLAGER')} size={80} />
      </div>

      <div style={{
        display: 'inline-block',
        padding: '6px 16px',
        borderRadius: 'var(--radius-full)',
        fontWeight: 800,
        letterSpacing: '2px',
        textTransform: 'uppercase',
        fontSize: '0.85rem',
        background: isFoolWin ? 'rgba(139, 92, 246, 0.25)' : (isWolfWin ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
        color: isFoolWin ? '#c4b5fd' : (isWolfWin ? '#fca5a5' : '#6ee7b7'),
        border: `1px solid ${isFoolWin ? '#8b5cf6' : (isWolfWin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)')}`,
        marginBottom: '12px'
      }}>
        KẾT THÚC TRẬN ĐẤU
      </div>

      <h1 style={{
        fontSize: '2.2rem',
        fontWeight: 900,
        color: isFoolWin ? '#a78bfa' : (isWolfWin ? '#ef4444' : '#10b981'),
        letterSpacing: '3px',
        textShadow: `0 0 20px ${isFoolWin ? 'rgba(139, 92, 246, 0.5)' : (isWolfWin ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)')}`
      }}>
        {isFoolWin ? '🃏 KẺ NGỐC ĐÃ THẮNG!' : (isWolfWin ? 'PHE MA SÓI THẮNG!' : 'PHE DÂN LÀNG THẮNG!')}
      </h1>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: '8px 0 24px' }}>
        {isFoolWin
          ? 'Kẻ Ngốc đã lừa cả làng và bầy sói để bị treo cổ thành công! Thao túng tuyệt đỉnh!'
          : (isWolfWin
            ? 'Bóng tối đã bao trùm toàn bộ ngôi làng...'
            : 'Ánh sáng công lý đã tiêu diệt tất cả loài sói ác độc!')}
      </p>

      {/* Full Roster Reveal */}
      <div style={{ textAlign: 'left', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '10px' }}>
          DANH TÍNH TOÀN BỘ NGƯỜI CHƠI:
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {players.map(p => {
            const roleInfo = p.roleDetails || { name: p.role, icon: '❓', color: '#fff' };
            return (
              <div key={p.id} className="player-card" style={{ padding: '10px 14px' }}>
                <div className="player-info">
                  <div className="player-avatar" style={{ width: '38px', height: '38px', fontSize: '1.2rem' }}>
                    {p.avatar}
                  </div>
                  <div>
                    <div className="player-name" style={{ fontSize: '0.95rem' }}>
                      {p.name}
                      {!p.isAlive && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>(Hy sinh)</span>}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: roleInfo.color
                }}>
                  <RoleIcon roleId={p.role} size={24} />
                  <span>{roleInfo.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Play Again Control */}
      {isHost ? (
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            sounds.playCardFlip();
            onPlayAgain();
          }}
        >
          <RotateCcw size={18} />
          Chơi Tiếp Ván Mới (Play Again)
        </button>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '14px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          ⏳ Đang chờ Chủ phòng bắt đầu ván mới...
        </div>
      )}
    </div>
  );
}
