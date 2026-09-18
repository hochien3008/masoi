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
        border: `1px solid ${survived ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
        boxShadow: survived ? '0 0 20px rgba(16, 185, 129, 0.2)' : '0 0 30px rgba(239, 68, 68, 0.3)',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        <div style={{ 
          fontSize: '5rem', 
          marginBottom: '16px',
          animation: survived ? 'floatSlow 3s ease-in-out infinite' : 'pulse 1.5s ease-in-out infinite',
          filter: survived ? 'drop-shadow(0 0 15px rgba(16, 185, 129, 0.5))' : 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8))'
        }}>
          {survived ? '🛡️' : '💀'}
        </div>

        <h3 style={{
          fontSize: '1.4rem',
          color: survived ? '#10b981' : '#ef4444',
          marginBottom: '8px',
          fontWeight: 800
        }}>
          {survived ? 'MỘT ĐÊM BÌNH YÊN' : 'TANG TÓC TRONG ĐÊM'}
        </h3>

        <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)', fontWeight: 500 }}>
          {nightReport?.message || 'Mọi người thức giấc sau một đêm dài...'}
        </p>
      </div>

      {/* Ghost Whisper / Haunt Alert */}
      {haunted && (
        <div className="ghost-haunt-banner">
          <span style={{ fontSize: '2rem' }}>🕯️</span>
          <div>
            <div className="ghost-haunt-title">
              Ảo Giác Ám Ảnh (Ghost Haunt)
            </div>
            <div className="ghost-haunt-text">
              {whisperReceived || 'Một linh hồn ma quái đã ám bạn đêm qua! Đầu óc bạn quay cuồng giữa những ảo ảnh...'}
            </div>
          </div>
        </div>
      )}

      {!haunted && whisperReceived && (
        <div className="ghost-whisper-banner">
          <RoleIcon roleId="GHOST" size={42} />
          <div>
            <div className="ghost-whisper-title">
              Điềm Báo Từ Cõi Chết (Ghost Whisper)
            </div>
            <div className="ghost-whisper-text">
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
