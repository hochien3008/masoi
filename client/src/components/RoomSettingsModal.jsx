import React, { useState } from 'react';
import { X, Sliders, Clock, Users, Sparkles, Check, Shield } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function RoomSettingsModal({
  isOpen,
  onClose,
  isHost,
  playerCount,
  settings = { discussionTime: 90, votingTime: 30 },
  selectedSpecialRoles = ['SEER', 'DOCTOR'],
  onSaveSettings,
  onTriggerEvent,
  onTriggerTransition
}) {
  const [discussionTime, setDiscussionTime] = useState(settings?.discussionTime || 90);
  const [votingTime, setVotingTime] = useState(settings?.votingTime || 30);
  const [currentRoles, setCurrentRoles] = useState(selectedSpecialRoles || ['SEER', 'DOCTOR']);

  if (!isOpen) return null;

  const totalCount = Math.max(4, playerCount);
  const wolfCount = totalCount >= 13 ? 4 : (totalCount >= 10 ? 3 : (totalCount >= 7 ? 2 : 1));
  const minVillagers = totalCount <= 4 ? 1 : 2;
  const maxSpecials = Math.max(1, totalCount - wolfCount - minVillagers);
  const currentSpecials = currentRoles.slice(0, maxSpecials);
  const villagerCount = Math.max(minVillagers, totalCount - wolfCount - currentSpecials.length);

  const availableSpecialRoles = [
    { id: 'SEER', name: 'Tiên Tri', color: '#a855f7', desc: 'Soi vai trò 1 người mỗi đêm' },
    { id: 'DOCTOR', name: 'Bác Sĩ', color: '#06b6d4', desc: 'Bảo vệ 1 người không bị cắn' },
    { id: 'HUNTER', name: 'Thợ Săn', color: '#f59e0b', desc: 'Bắn chết 1 người khi hy sinh' },
    { id: 'WITCH', name: 'Phù Thủy', color: '#ec4899', desc: '1 bình cứu mạng & 1 bình độc dược' },
    { id: 'FOOL', name: 'Kẻ Ngốc', color: '#8b5cf6', desc: 'Miễn chết lần đầu khi bị treo cổ' }
  ];

  const discussionOptions = [
    { label: '60s', desc: 'Nhanh', val: 60 },
    { label: '90s', desc: 'Chuẩn', val: 90 },
    { label: '120s', desc: 'Thong thả', val: 120 },
    { label: '180s', desc: 'Sâu sắc', val: 180 }
  ];

  const votingOptions = [
    { label: '20s', val: 20 },
    { label: '30s', val: 30 },
    { label: '45s', val: 45 },
    { label: '60s', val: 60 }
  ];

  const handleToggleRole = (roleId) => {
    if (!isHost) return;
    sounds.playCardFlip();
    let nextRoles;
    if (currentRoles.includes(roleId)) {
      nextRoles = currentRoles.filter(r => r !== roleId);
    } else {
      if (currentRoles.length >= maxSpecials) {
        nextRoles = [...currentRoles.slice(1), roleId];
      } else {
        nextRoles = [...currentRoles, roleId];
      }
    }
    setCurrentRoles(nextRoles);
  };

  const handleApplyPreset = (roles) => {
    if (!isHost) return;
    sounds.playCardFlip();
    setCurrentRoles(roles.slice(0, maxSpecials));
  };

  const handleSave = () => {
    if (onSaveSettings) {
      onSaveSettings({
        discussionTime,
        votingTime,
        selectedSpecialRoles: currentRoles.slice(0, maxSpecials)
      });
    }
    sounds.playCardFlip();
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          maxWidth: '520px',
          width: '95%',
          margin: 'auto',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚙️ CẤU HÌNH PHÒNG CHƠI
            </h3>
            <span style={{ fontSize: '0.8rem', color: isHost ? '#38bdf8' : 'var(--text-muted)' }}>
              {isHost ? 'Chủ phòng có toàn quyền điều chỉnh' : 'Chỉ Chủ phòng mới có quyền lưu'}
            </span>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Discussion Timer */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px' }}>
            <Clock size={16} color="#f59e0b" /> Thời gian Thảo luận ban ngày
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {discussionOptions.map(opt => {
              const isSelected = discussionTime === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  disabled={!isHost}
                  onClick={() => {
                    sounds.playCardFlip();
                    setDiscussionTime(opt.val);
                  }}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${isSelected ? '#f59e0b' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#f59e0b' : 'var(--text-primary)',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: isHost ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '1rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{opt.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Voting Timer */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', fontWeight: 700, marginBottom: '8px' }}>
            ⏱️ Thời gian Bỏ phiếu treo cổ
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {votingOptions.map(opt => {
              const isSelected = votingTime === opt.val;
              return (
                <button
                  key={opt.val}
                  type="button"
                  disabled={!isHost}
                  onClick={() => {
                    sounds.playCardFlip();
                    setVotingTime(opt.val);
                  }}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--radius-sm)',
                    border: `1.5px solid ${isSelected ? '#ef4444' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(239, 68, 68, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#ef4444' : 'var(--text-primary)',
                    fontWeight: isSelected ? 800 : 500,
                    cursor: isHost ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.95rem' }}>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Deck Breakdown & Special Roles */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} color="#a855f7" /> Cấu hình vai trò ({totalCount} người)
            </span>
          </div>

          {/* Ratio Summary */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '12px',
            fontSize: '0.85rem'
          }}>
            <div style={{ color: '#ef4444', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RoleIcon roleId="WEREWOLF" size={16} /> {wolfCount} Sói
            </div>
            <div style={{ color: '#a855f7', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> {currentSpecials.length}/{maxSpecials} Chức năng
            </div>
            <div style={{ color: '#10b981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={14} /> {villagerCount} Dân làng
            </div>
          </div>

          {/* Quick Presets for Host */}
          {isHost && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '10px' }}>
              <button
                type="button"
                className="quick-chip"
                onClick={() => handleApplyPreset(['SEER', 'DOCTOR'])}
              >
                🌟 Cơ bản
              </button>
              <button
                type="button"
                className="quick-chip"
                onClick={() => handleApplyPreset(['SEER', 'DOCTOR', 'HUNTER', 'WITCH'])}
              >
                ⚔️ Kịch tính
              </button>
              <button
                type="button"
                className="quick-chip"
                onClick={() => handleApplyPreset(['SEER', 'DOCTOR', 'HUNTER', 'WITCH', 'FOOL'])}
              >
                🃏 Hỗn loạn
              </button>
            </div>
          )}

          {/* Special Role Selection Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {availableSpecialRoles.map(role => {
              const active = currentRoles.includes(role.id);
              return (
                <div
                  key={role.id}
                  onClick={() => isHost && handleToggleRole(role.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: active ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${active ? role.color : 'var(--border-subtle)'}`,
                    cursor: isHost ? 'pointer' : 'default',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <RoleIcon roleId={role.id} size={28} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: role.color }}>
                        {role.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        {role.desc}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: `1.5px solid ${active ? role.color : 'var(--border-subtle)'}`,
                    background: active ? role.color : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {active && <Check size={12} color="#fff" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Visual Effect & Phase Transition Testing */}
        <div style={{
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171' }}>
              <Sparkles size={16} color="#ef4444" /> Thử nghiệm hiệu ứng hình ảnh
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Chạm để kích hoạt ngay</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(239, 68, 68, 0.18)',
                borderColor: '#ef4444',
                color: '#fca5a5',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
              onClick={() => {
                if (onTriggerEvent) {
                  onTriggerEvent({ type: 'WOLF_KILL', isSelf: true });
                }
              }}
            >
              🩸 Sói cào BẢN THÂN (3 vuốt)
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerEvent) {
                  onTriggerEvent({ type: 'WOLF_KILL', isSelf: false });
                }
              }}
            >
              🐺 Sói cắn người khác
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                borderColor: '#a855f7',
                color: '#d8b4fe',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerEvent) {
                  onTriggerEvent({ type: 'POISON' });
                }
              }}
            >
              🧪 Trúng độc Phù thủy
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(6, 182, 212, 0.12)',
                borderColor: '#06b6d4',
                color: '#67e8f9',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerEvent) {
                  onTriggerEvent({ type: 'HEAL' });
                }
              }}
            >
              🛡️ Bác sĩ cứu sống
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(236, 72, 153, 0.12)',
                borderColor: '#ec4899',
                color: '#f472b6',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerEvent) {
                  onTriggerEvent({ type: 'WITCH_SAVE' });
                }
              }}
            >
              ✨ Phù thủy cứu sống
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                borderColor: '#ef4444',
                color: '#f87171',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerEvent) {
                  onTriggerEvent({ type: 'VOTE_ELIMINATED' });
                }
              }}
            >
              ⚖️ Biểu quyết Treo cổ
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                borderColor: '#f59e0b',
                color: '#fcd34d',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerTransition) {
                  onTriggerTransition('DAY');
                }
              }}
            >
              🌅 Chuyển ngày (Bình minh)
            </button>

            <button
              type="button"
              className="quick-chip"
              style={{
                background: 'rgba(99, 102, 241, 0.12)',
                borderColor: '#6366f1',
                color: '#a5b4fc',
                padding: '8px 10px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8rem'
              }}
              onClick={() => {
                if (onTriggerTransition) {
                  onTriggerTransition('NIGHT');
                }
              }}
            >
              🌌 Chuyển đêm (Đêm tối)
            </button>
          </div>
        </div>

        {/* Action Button */}
        {isHost ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleSave}
            style={{ width: '100%' }}
          >
            Lưu & Áp Dụng Cài Đặt
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ width: '100%' }}
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
}
