import React, { useState } from 'react';
import { Shield, Sparkles, Moon, Users, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function Home({ onJoin, onCreate, initialRoomCode }) {
  const [name, setName] = useState(() => localStorage.getItem('nightfall_player_name') || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [showRules, setShowRules] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    localStorage.setItem('nightfall_player_name', val);
    setError('');
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên hiển thị của bạn!');
      return;
    }
    sounds.init();
    sounds.playCardFlip();
    onCreate(name.trim());
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên hiển thị của bạn!');
      return;
    }
    if (!roomCode.trim()) {
      setError('Vui lòng nhập mã phòng (4 ký tự)!');
      return;
    }
    sounds.init();
    sounds.playCardFlip();
    onJoin(roomCode.trim().toUpperCase(), name.trim());
  };

  return (
    <div className="glass-panel" style={{ textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
      <div className="floating" style={{ fontSize: '4.5rem', marginBottom: '12px' }}>
        🐺
      </div>

      <h1 style={{ fontSize: '2.4rem', fontWeight: 900, marginBottom: '4px', letterSpacing: '3px' }}>
        NIGHTFALL
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
        Ma Sói Trực Tuyến • Tự Động Quản Trò • Không Cần Tải App
      </p>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          color: '#fca5a5',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', textAlign: 'left', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Tên Của Bạn:
        </label>
        <input
          type="text"
          className="input-gothic"
          placeholder="Ví dụ: Nam Phong, Hoàng Long..."
          value={name}
          maxLength={15}
          onChange={handleNameChange}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleCreate}
        >
          <Sparkles size={18} />
          Tạo Phòng Mới
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Hoặc</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="input-gothic"
            placeholder="MÃ PHÒNG (VD: X7KD)"
            value={roomCode}
            maxLength={6}
            style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, textAlign: 'center' }}
            onChange={(e) => {
              setRoomCode(e.target.value.toUpperCase());
              setError('');
            }}
          />
          <button
            type="button"
            className="btn-secondary"
            style={{ width: 'auto', padding: '0 24px' }}
            onClick={handleJoin}
          >
            Vào
          </button>
        </div>
      </div>

      <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => setShowRules(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem'
          }}
        >
          <HelpCircle size={16} />
          Xem luật chơi & các vai trò
        </button>
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="modal-backdrop" onClick={() => setShowRules(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '16px', color: '#fff', fontSize: '1.4rem' }}>
              LUẬT CHƠI & CÁC VAI TRÒ
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {/* Werewolf */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #ef4444' }}>
                <img src="/cards/WEREWOLF.jpg" alt="Ma Sói" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.4)' }} />
                <div>
                  <strong style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="WEREWOLF" size={20} /> Ma Sói (Werewolf)
                  </strong>
                  Mỗi đêm bàn luận cùng bầy cắn xé 1 người dân. Thắng khi số Sói &ge; số Dân làng.
                </div>
              </div>

              {/* Seer */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(168, 85, 247, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #a855f7' }}>
                <img src="/cards/SEER.jpg" alt="Tiên Tri" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(168, 85, 247, 0.4)' }} />
                <div>
                  <strong style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="SEER" size={20} /> Tiên Tri (Seer)
                  </strong>
                  Mỗi đêm soi 1 người để biết thân phận người đó là Ma Sói hay Dân Làng.
                </div>
              </div>

              {/* Doctor */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #06b6d4' }}>
                <img src="/cards/DOCTOR.jpg" alt="Bác Sĩ" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.4)' }} />
                <div>
                  <strong style={{ color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="DOCTOR" size={20} /> Bác Sĩ (Doctor)
                  </strong>
                  Mỗi đêm chọn bảo vệ 1 người. Nếu trùng mục tiêu Sói cắn sẽ cứu sống!
                </div>
              </div>

              {/* Hunter */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(245, 158, 11, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>
                <img src="/cards/HUNTER.jpg" alt="Thợ Săn" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.4)' }} />
                <div>
                  <strong style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="HUNTER" size={20} /> Thợ Săn (Hunter)
                  </strong>
                  Khi bị giết (bị cắn, bị độc hoặc bị treo cổ), được bắn phát súng cuối cùng kéo theo 1 người khác!
                </div>
              </div>

              {/* Witch */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(236, 72, 153, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #ec4899' }}>
                <img src="/cards/WITCH.jpg" alt="Phù Thủy" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(236, 72, 153, 0.4)' }} />
                <div>
                  <strong style={{ color: '#ec4899', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="WITCH" size={20} /> Phù Thủy (Witch)
                  </strong>
                  Có 2 bình thần dược: 1 Bình Cứu (cứu người bị sói cắn) và 1 Bình Độc (giết 1 người bất kỳ).
                </div>
              </div>

              {/* Fool */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(139, 92, 246, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #8b5cf6' }}>
                <img src="/cards/FOOL.jpg" alt="Kẻ Ngốc" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(139, 92, 246, 0.4)' }} />
                <div>
                  <strong style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="FOOL" size={20} /> Kẻ Ngốc (Fool - Neutral)
                  </strong>
                  Phe độc lập! Mục tiêu là dụ làng treo cổ mình. Nếu bị dân làng vote chết, Kẻ Ngốc THẮNG NGAY!
                </div>
              </div>

              {/* Villager */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #10b981' }}>
                <img src="/cards/VILLAGER.jpg" alt="Dân Làng" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.4)' }} />
                <div>
                  <strong style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="VILLAGER" size={20} /> Dân Làng (Villager)
                  </strong>
                  Không có skill đêm. Dùng suy luận sắc bén và biểu quyết ban ngày để tìm ra Ma Sói.
                </div>
              </div>

              {/* Ghost */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(148, 163, 184, 0.1)', padding: '10px', borderRadius: '10px', borderLeft: '3px solid #94a3b8' }}>
                <img src="/cards/GHOST.jpg" alt="Linh Hồn" style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(148, 163, 184, 0.4)' }} />
                <div>
                  <strong style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                    <RoleIcon roleId="GHOST" size={20} /> Linh Hồn (Ghost)
                  </strong>
                  Người chơi bị loại hóa thành Linh Hồn. Ban ngày không được chat hay vote. Ban đêm có quyền năng thực tế: <strong>🕯️ Ám Ảnh</strong> (+1 phiếu nghi ngờ cho mục tiêu vào buổi chiều), <strong>✨ Ban Phước</strong> (khiên giảm 1 phiếu bầu phạt cho mục tiêu), hoặc <strong>👻 Thì Thầm</strong> (gửi điềm báo từ cõi chết).
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: '20px' }}
              onClick={() => setShowRules(false)}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
