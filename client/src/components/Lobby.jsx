import React, { useState, useEffect } from 'react';
import { Copy, QrCode, UserPlus, Play, Check, Crown, Bot, Trash2, Sparkles, Sliders, Shield, Users } from 'lucide-react';
import QRCode from 'qrcode';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function Lobby({
  roomCode,
  players,
  isHost,
  myPlayerId,
  selectedSpecialRoles = ['SEER', 'DOCTOR'],
  onUpdateRoles,
  onAddBot,
  onRemoveBot,
  onStartGame
}) {
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  const shareUrl = `${window.location.origin}?room=${roomCode}`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 260, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
      .then(url => setQrUrl(url))
      .catch(err => console.error(err));
  }, [shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    sounds.playCardFlip();
    setTimeout(() => setCopied(false), 2000);
  };

  const canStart = players.length >= 4;

  // Deck breakdown calculations
  const totalCount = Math.max(4, players.length);
  const wolfCount = totalCount >= 13 ? 4 : (totalCount >= 10 ? 3 : (totalCount >= 7 ? 2 : 1));
  const minVillagers = totalCount <= 4 ? 1 : 2;
  const maxSpecials = Math.max(1, totalCount - wolfCount - minVillagers);
  const currentSpecials = (selectedSpecialRoles || []).slice(0, maxSpecials);
  const villagerCount = Math.max(minVillagers, totalCount - wolfCount - currentSpecials.length);

  const availableSpecialRoles = [
    { id: 'SEER', name: 'Tiên Tri', color: '#a855f7' },
    { id: 'DOCTOR', name: 'Bác Sĩ', color: '#06b6d4' },
    { id: 'HUNTER', name: 'Thợ Săn', color: '#f59e0b' },
    { id: 'WITCH', name: 'Phù Thủy', color: '#ec4899' },
    { id: 'FOOL', name: 'Kẻ Ngốc', color: '#8b5cf6' }
  ];

  const handleToggleRole = (roleId) => {
    if (!isHost) return;
    sounds.playCardFlip();
    let nextRoles;
    if (selectedSpecialRoles.includes(roleId)) {
      nextRoles = selectedSpecialRoles.filter(r => r !== roleId);
    } else {
      if (selectedSpecialRoles.length >= maxSpecials) {
        // Swap out the first one to make room and preserve Villagers
        nextRoles = [...selectedSpecialRoles.slice(1), roleId];
      } else {
        nextRoles = [...selectedSpecialRoles, roleId];
      }
    }
    if (onUpdateRoles) {
      onUpdateRoles(nextRoles);
    }
  };

  const applyPreset = (roles) => {
    if (!isHost) return;
    sounds.playCardFlip();
    if (onUpdateRoles) {
      onUpdateRoles(roles.slice(0, maxSpecials));
    }
  };

  return (
    <div className="glass-panel">
      {/* Header Room Info */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
          MÃ PHÒNG CỦA BẠN
        </span>
        <h2 style={{
          fontSize: '2.8rem',
          fontWeight: 900,
          letterSpacing: '6px',
          color: '#fff',
          textShadow: '0 0 20px rgba(168, 85, 247, 0.5)',
          margin: '4px 0 12px'
        }}>
          {roomCode}
        </h2>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? 'Đã sao chép!' : 'Sao chép link'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}
            onClick={() => setQrModalOpen(true)}
          >
            <QrCode size={16} />
            Mã QR
          </button>
        </div>
      </div>

      {/* Player Count Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Danh sách người chơi ({players.length}/16)
        </span>
        {!canStart && (
          <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
            Cần thêm {4 - players.length} người nữa
          </span>
        )}
      </div>

      {/* Players List */}
      <div className="player-list">
        {players.map((p) => {
          const isMe = p.id === myPlayerId;
          return (
            <div key={p.id} className="player-card">
              <div className="player-info">
                <div className="player-avatar">
                  {p.avatar}
                  {p.isHost && (
                    <span className="host-crown" title="Chủ phòng">👑</span>
                  )}
                </div>
                <div>
                  <div className="player-name">
                    {p.name}
                    {isMe && <span className="you-badge">BẠN</span>}
                    {p.isBot && (
                      <span style={{
                        fontSize: '0.7rem',
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#93c5fd',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Bot size={10} /> BOT
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isHost && p.isBot && (
                <button
                  type="button"
                  onClick={() => onRemoveBot(p.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ef4444',
                    cursor: 'pointer',
                    padding: '6px',
                    opacity: 0.7
                  }}
                  title="Xóa Bot"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Role Configuration & Villager Balance Panel */}
      <div style={{
        marginTop: '16px',
        padding: '14px',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        textAlign: 'left'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sliders size={14} color="#d4af37" /> Cấu hình bộ bài ({totalCount} người)
          </span>
          <span style={{ fontSize: '0.75rem', color: isHost ? '#d4af37' : 'var(--text-muted)' }}>
            {isHost ? 'Chủ phòng có thể bấm chọn vai trò' : 'Do Chủ phòng thiết lập'}
          </span>
        </div>

        {/* Live Role Ratio Summary */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(10, 13, 20, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: 700 }}>
            <RoleIcon roleId="WEREWOLF" size={20} />
            <span>{wolfCount} Sói</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontWeight: 600 }}>
            <Sparkles size={14} />
            <span>{currentSpecials.length} Chức năng</span>
          </div>

          {/* Villager count highlighted prominently */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#10b981',
            fontWeight: 800,
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '3px 10px',
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <RoleIcon roleId="VILLAGER" size={20} />
            <span>{villagerCount} DÂN LÀNG</span>
          </div>
        </div>

        {/* Clickable Special Roles Grid */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Các vai trò đặc biệt tham gia:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
          {availableSpecialRoles.map(r => {
            const isActive = selectedSpecialRoles.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                disabled={!isHost}
                onClick={() => handleToggleRole(r.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: isHost ? 'pointer' : 'default',
                  border: `1px solid ${isActive ? r.color : 'rgba(255, 255, 255, 0.15)'}`,
                  background: isActive ? `${r.color}25` : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  opacity: isActive ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                <RoleIcon roleId={r.id} size={18} />
                <span>{r.name}</span>
                {isActive && <Check size={12} color={r.color} />}
              </button>
            );
          })}
        </div>

        {/* Quick Presets for Host */}
        {isHost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px dashed rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mẫu nhanh:</span>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => applyPreset(['SEER', 'DOCTOR'])}
            >
              🏡 Nhiều Dân Làng (Cơ bản)
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => applyPreset(['SEER', 'DOCTOR', 'HUNTER'])}
            >
              🏹 Thêm Thợ Săn
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ width: 'auto', padding: '3px 8px', fontSize: '0.75rem' }}
              onClick={() => applyPreset(['SEER', 'DOCTOR', 'HUNTER', 'WITCH', 'FOOL'])}
            >
              🎭 Kịch tính (Đủ vai)
            </button>
          </div>
        )}
      </div>

      {/* Controls for Host */}
      {isHost ? (
        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {players.length < 16 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onAddBot}
            >
              <UserPlus size={18} />
              + Thêm Bot (Thử nghiệm nhanh: {players.length}/16)
            </button>
          )}

          <button
            type="button"
            className="btn-primary"
            disabled={!canStart}
            onClick={() => {
              sounds.playWolfHowl();
              onStartGame();
            }}
          >
            <Play size={18} />
            Bắt Đầu Ván Đấu {canStart ? `(${players.length} người)` : '(Cần tối thiểu 4 người)'}
          </button>
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 'var(--radius-md)',
          marginTop: '20px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          ⏳ Đang chờ Chủ phòng bắt đầu ván đấu...
        </div>
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="modal-backdrop" onClick={() => setQrModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Quét Mã QR Tham Gia</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Mở camera điện thoại quét để vào phòng trực tiếp:
            </p>

            {qrUrl && (
              <img
                src={qrUrl}
                alt="Room QR Code"
                style={{
                  width: '220px',
                  height: '220px',
                  borderRadius: '12px',
                  border: '4px solid #fff',
                  margin: '0 auto 16px',
                  display: 'block'
                }}
              />
            )}

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '2px', marginBottom: '16px' }}>
              {roomCode}
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setQrModalOpen(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
