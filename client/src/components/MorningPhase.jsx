import React, { useEffect } from 'react';
import { Sun, Skull, ShieldCheck, Ghost } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function MorningPhase({ nightReport, whisperReceived, haunted, timer }) {
  useEffect(() => {
    sounds.playMorningChime();
    if (haunted) {
      setTimeout(() => sounds.playHaunt(), 800);
    } else if (whisperReceived) {
      setTimeout(() => sounds.playGhostWhisper(), 1200);
    }
  }, [whisperReceived, haunted]);

  const survived = nightReport?.survived;

  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <div className="phase-header">
        <span className="phase-tag tag-day">
          <Sun size={14} /> BÌNH MINH LÓ RẠNG
        </span>
        <h2 style={{ fontSize: '1.6rem', marginTop: '4px' }}>BẢN TIN SÁNG CỦA QUẢN TRÒ</h2>
        <div className="timer-box">
          ⏱️ {timer}s
        </div>
      </div>

      <div style={{
        margin: '24px 0',
        padding: '24px',
        borderRadius: 'var(--radius-lg)',
        background: survived ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${survived ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`
      }}>
        <div style={{ fontSize: '4.5rem', marginBottom: '12px' }}>
          {survived ? '🛡️' : '💀'}
        </div>

        <h3 style={{
          fontSize: '1.4rem',
          color: survived ? '#6ee7b7' : '#fca5a5',
          marginBottom: '8px'
        }}>
          {survived ? 'MỘT ĐÊM BÌNH YÊN' : 'TANG TÓC TRONG ĐÊM'}
        </h3>

        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: '#f8fafc' }}>
          {nightReport?.message || 'Mọi người thức giấc sau một đêm dài...'}
        </p>
      </div>

      {/* Ghost Whisper / Haunt Alert */}
      {haunted && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginTop: '16px',
          animation: 'pulse 1s infinite alternate',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left'
        }}>
          <span style={{ fontSize: '2rem' }}>🕯️</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Ảo Giác Ám Ảnh (Ghost Haunt)
            </div>
            <div style={{ fontSize: '0.9rem', color: '#fecaca', fontStyle: 'italic', marginTop: '2px' }}>
              {whisperReceived || 'Một linh hồn ma quái đã ám bạn đêm qua! Đầu óc bạn quay cuồng giữa những ảo ảnh...'}
            </div>
          </div>
        </div>
      )}

      {!haunted && whisperReceived && (
        <div style={{
          background: 'rgba(148, 163, 184, 0.15)',
          border: '1px solid rgba(148, 163, 184, 0.4)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginTop: '16px',
          animation: 'fadeIn 0.5s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          textAlign: 'left'
        }}>
          <RoleIcon roleId="GHOST" size={42} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Điềm Báo Từ Cõi Chết (Ghost Whisper)
            </div>
            <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontStyle: 'italic', marginTop: '2px' }}>
              {whisperReceived}
            </div>
          </div>
        </div>
      )}

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '20px' }}>
        Chuẩn bị bước vào phiên thảo luận ban ngày...
      </p>
    </div>
  );
}
