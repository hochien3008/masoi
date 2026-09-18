import React, { useState, useEffect } from 'react';
import { Copy, QrCode, UserPlus, Play, Check, Crown, Bot, Trash2, Settings, Shield, Sparkles, Clock } from 'lucide-react';
import QRCode from 'qrcode';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';
import RoomSettingsModal from './RoomSettingsModal';

export default function Lobby({
  roomCode,
  players,
  isHost,
  myPlayerId,
  settings = { discussionTime: 90, votingTime: 30 },
  selectedSpecialRoles = ['SEER', 'DOCTOR'],
  onUpdateSettings,
  onUpdateRoles,
  onAddBot,
  onRemoveBot,
  onStartGame,
  onOpenSettings,
  onTriggerEvent,
  onTriggerTransition
}) {
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  const handleOpenConfig = () => {
    sounds.playCardFlip();
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      setSettingsModalOpen(true);
    }
  };

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

  // Deck calculations for quick summary
  const totalCount = Math.max(4, players.length);
  const wolfCount = totalCount >= 13 ? 4 : (totalCount >= 10 ? 3 : (totalCount >= 7 ? 2 : 1));
  const minVillagers = totalCount <= 4 ? 1 : 2;
  const maxSpecials = Math.max(1, totalCount - wolfCount - minVillagers);
  const currentSpecials = (selectedSpecialRoles || []).slice(0, maxSpecials);
  const villagerCount = Math.max(minVillagers, totalCount - wolfCount - currentSpecials.length);

  const handleSaveSettings = (newConfig) => {
    if (onUpdateSettings) {
      onUpdateSettings(newConfig);
    } else if (onUpdateRoles && newConfig.selectedSpecialRoles) {
      onUpdateRoles(newConfig.selectedSpecialRoles);
    }
  };

  return (
    <div className="glass-panel">
      {/* Header Room Info */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)' }}>
          MÃ PHÒNG CỦA BẠN
        </span>
        <h2 style={{
          fontSize: '2.8rem',
          fontWeight: 900,
          letterSpacing: '6px',
          color: 'var(--text-primary)',
          margin: '4px 0 12px'
        }}>
          {roomCode}
        </h2>

        {/* Action Buttons: Copy link, QR Code, and Settings */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={handleCopy}
          >
            {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
            {copied ? 'Đã sao chép' : 'Sao chép link'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '8px 14px', fontSize: '0.85rem' }}
            onClick={() => setQrModalOpen(true)}
          >
            <QrCode size={16} />
            Mã QR
          </button>
          <button
            type="button"
            className="btn-secondary"
            style={{
              width: 'auto',
              padding: '8px 14px',
              fontSize: '0.85rem',
              borderColor: 'rgba(56, 189, 248, 0.4)',
              background: 'rgba(56, 189, 248, 0.08)'
            }}
            onClick={handleOpenConfig}
            title="Cài đặt phòng chơi & vai trò"
          >
            <Settings size={16} color="#38bdf8" />
            Cài đặt
          </button>
        </div>
      </div>

      {/* Quick Config Summary Pill (Clickable to open settings) */}
      <div
        onClick={handleOpenConfig}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '14px',
          fontSize: '0.82rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: '#ef4444', fontWeight: 700 }}>🐺 {wolfCount} Sói</span>
          <span>•</span>
          <span style={{ color: '#a855f7', fontWeight: 600 }}>✨ {currentSpecials.length} Chức năng</span>
          <span>•</span>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏱️ {settings?.discussionTime || 90}s Thảo luận</span>
        </div>
        <span style={{
          fontSize: '0.75rem',
          color: isHost ? '#38bdf8' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontWeight: 600
        }}>
          ⚙️ {isHost ? 'Chỉnh sửa' : 'Chi tiết'}
        </span>
      </div>

      {/* Player Count Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Danh sách người chơi ({players.length}/16)
        </span>
        {!canStart && (
          <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
            Cần thêm {4 - players.length} người nữa
          </span>
        )}
      </div>

      {/* Players List */}
      <div className="player-list" style={{ maxHeight: '340px' }}>
        {players.map((p) => {
          const isMe = p.id === myPlayerId;
          return (
            <div key={p.id} className="player-card">
              <div className="player-info">
                <div className={`player-avatar ${p.isSpeaking ? 'speaking-avatar' : ''}`}>
                  {p.avatar}
                  {p.isHost && (
                    <span className="host-crown" title="Chủ phòng">👑</span>
                  )}
                  {p.isSpeaking && (
                    <span className="speaking-badge" title="Đang nói">🎙️</span>
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
                        gap: '2px',
                        marginLeft: '6px'
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

      {/* Controls for Host */}
      {isHost ? (
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {players.length < 16 && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onAddBot}
            >
              <UserPlus size={18} />
              + Thêm Bot ({players.length}/16)
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
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          marginTop: '16px',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem'
        }}>
          ⏳ Đang chờ Chủ phòng bắt đầu ván đấu...
        </div>
      )}

      {/* Room Settings Modal (fallback if not handled globally) */}
      {!onOpenSettings && (
        <RoomSettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          isHost={isHost}
          playerCount={players.length}
          settings={settings}
          selectedSpecialRoles={selectedSpecialRoles}
          onSaveSettings={handleSaveSettings}
          onTriggerEvent={onTriggerEvent}
          onTriggerTransition={onTriggerTransition}
        />
      )}

      {/* QR Code Modal */}
      {qrModalOpen && (
        <div className="modal-backdrop" onClick={() => setQrModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Quét Mã QR Để Tham Gia</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Mở camera điện thoại quét mã để vào ngay phòng <strong>{roomCode}</strong>
            </p>

            {qrUrl && (
              <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block', marginBottom: '16px' }}>
                <img src={qrUrl} alt="QR Code" style={{ display: 'block', maxWidth: '100%' }} />
              </div>
            )}

            <button
              type="button"
              className="btn-primary"
              onClick={() => setQrModalOpen(false)}
              style={{ width: '100%' }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
