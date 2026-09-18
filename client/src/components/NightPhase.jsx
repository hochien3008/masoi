import React, { useState, useEffect } from 'react';
import { Moon, Shield, Skull, Eye, Ghost, Check, Sparkles, Heart, Flame, HelpCircle } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function NightPhase({
  dayNumber,
  timer,
  myRole,
  myRoleDetails,
  isAlive,
  players,
  myPlayerId,
  seerInspectionResult,
  witchInfo,
  wolfPackData,
  wolfChatMessages = [],
  onWolfSelectTarget,
  onSendWolfChat,
  onSubmitNightAction
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [wolfChatInput, setWolfChatInput] = useState('');
  const [wolfChatOpen, setWolfChatOpen] = useState(true);

  // Witch specific states
  const [witchSave, setWitchSave] = useState(false);
  const [witchPoisonTarget, setWitchPoisonTarget] = useState(null);

  // Ghost specific state
  const [ghostActionType, setGhostActionType] = useState('WHISPER');

  useEffect(() => {
    if (myRole === 'WEREWOLF') {
      sounds.playWolfHowl();
    } else if (myRole === 'WITCH') {
      sounds.playPotion();
    } else if (!isAlive) {
      sounds.playGhostWhisper();
    }
  }, [myRole, isAlive]);

  const alivePlayers = players.filter(p => p.isAlive);

  // Filter selectable targets based on role
  let selectablePlayers = [];
  let roleTitle = '';
  let roleRoleId = '';
  let roleInstructions = '';
  let actionIcon = null;

  const isWitch = isAlive && myRole === 'WITCH';
  const isSleepingRole = isAlive && (myRole === 'VILLAGER' || myRole === 'HUNTER' || myRole === 'FOOL');

  if (isAlive) {
    if (myRole === 'WEREWOLF') {
      roleTitle = 'SĂN MỒI TRONG ĐÊM';
      roleRoleId = 'WEREWOLF';
      roleInstructions = 'Chọn một nạn nhân để cắn xé đêm nay:';
      actionIcon = <Skull size={18} color="#ef4444" />;
      selectablePlayers = alivePlayers.filter(p => p.role !== 'WEREWOLF');
    } else if (myRole === 'DOCTOR') {
      roleTitle = 'BẢO VỆ SINH MỆNH';
      roleRoleId = 'DOCTOR';
      roleInstructions = 'Chọn một người để che chở khỏi nanh vuốt loài sói (có thể chọn chính mình):';
      actionIcon = <Shield size={18} color="#06b6d4" />;
      selectablePlayers = alivePlayers;
    } else if (myRole === 'SEER') {
      roleTitle = 'SOI SÁNG BÓNG TỐI';
      roleRoleId = 'SEER';
      roleInstructions = 'Chọn một người để vạch trần thân phận thực sự:';
      actionIcon = <Eye size={18} color="#a855f7" />;
      selectablePlayers = alivePlayers.filter(p => p.id !== myPlayerId);
    } else if (myRole === 'WITCH') {
      roleTitle = 'DƯỢC THẢO HUYỀN BÍ';
      roleRoleId = 'WITCH';
      roleInstructions = 'Sử dụng bình cứu để bảo vệ nạn nhân hoặc bình độc để tiêu diệt kẻ khả nghi:';
      actionIcon = <Sparkles size={18} color="#ec4899" />;
      selectablePlayers = alivePlayers;
    }
  } else {
    // Ghost
    roleTitle = 'LINH HỒN HUYỀN BÍ';
    roleRoleId = 'GHOST';
    roleInstructions = 'Bạn là linh hồn. Chọn loại tác động và người sống mà bạn muốn nhắm tới:';
    actionIcon = <Ghost size={18} color="#94a3b8" />;
    selectablePlayers = alivePlayers;
  }

  const handleConfirmAction = () => {
    if (isWitch) {
      sounds.playPotion();
      onSubmitNightAction({
        save: witchSave,
        poisonTargetId: witchPoisonTarget
      });
      setSubmitted(true);
    } else if (!isAlive) {
      if (!selectedTarget) return;
      sounds.playGhostWhisper();
      onSubmitNightAction({
        targetId: selectedTarget,
        actionType: ghostActionType
      });
      setSubmitted(true);
    } else {
      if (!selectedTarget) return;
      sounds.playCardFlip();
      onSubmitNightAction(selectedTarget);
      setSubmitted(true);
    }
  };

  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <div className="phase-header">
        <span className="phase-tag tag-night">
          <Moon size={14} /> ĐÊM THỨ {dayNumber}
        </span>
        <h2 style={{
          fontSize: '1.4rem',
          marginTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          {roleRoleId && <RoleIcon roleId={roleRoleId} size={28} />}
          <span>{roleTitle}</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {roleInstructions}
        </p>
        <div className={`timer-box ${timer <= 5 ? 'timer-warning' : ''}`}>
          ⏱️ {timer}s
        </div>
      </div>

      {/* Seer Inspection Live Result */}
      {myRole === 'SEER' && seerInspectionResult && (
        <div style={{
          background: seerInspectionResult.isWolf ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
          border: `1px solid ${seerInspectionResult.isWolf ? '#ef4444' : '#10b981'}`,
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          margin: '16px 0',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
            <RoleIcon roleId={seerInspectionResult.isWolf ? 'WEREWOLF' : 'VILLAGER'} size={56} />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: seerInspectionResult.isWolf ? '#fca5a5' : '#6ee7b7' }}>
            {seerInspectionResult.message}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Thông tin tuyệt mật chỉ riêng bạn nhìn thấy!
          </div>
        </div>
      )}

      {/* Sleeping Roles Screen (Villager, Hunter, Fool) */}
      {isSleepingRole && (
        <div style={{ padding: '24px 10px' }}>
          <div className="floating" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <RoleIcon roleId={myRole} size={72} />
          </div>
          <h3 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '8px' }}>
            {myRole === 'HUNTER' && '🏹 Nỏ Bạc Trong Đêm'}
            {myRole === 'FOOL' && '🃏 Trò Hề Đang Chờ Bình Minh'}
            {myRole === 'VILLAGER' && '😴 Giấc Ngủ Làng Quê'}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.5' }}>
            {myRole === 'HUNTER' && 'Bạn là Thợ Săn. Nỏ bạc đã nạp sẵn tên! Hãy giữ bình tĩnh, nếu ngã xuống bạn sẽ được bắn phát súng kéo theo một kẻ khác.'}
            {myRole === 'FOOL' && 'Bạn là Kẻ Ngốc. Hãy ngủ thật say và chuẩn bị những chiêu trò kỳ quặc vào ban ngày để dụ dân làng treo cổ bạn!'}
            {myRole === 'VILLAGER' && 'Bạn không có kỹ năng ban đêm. Hãy giữ bình tĩnh và chờ đợi quản trò gọi dậy vào buổi sáng!'}
          </p>
        </div>
      )}

      {/* Witch Interactive Panel */}
      {isWitch && (
        <div style={{ margin: '16px 0', textAlign: 'left' }}>
          {/* Potion 1: Healing Potion */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🧪</span>
                <div>
                  <strong style={{ color: '#6ee7b7', fontSize: '0.95rem' }}>Bình Cứu Sinh</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {witchInfo?.canSave ? '✨ Còn 1 lần dùng' : '❌ Đã hết bình cứu'}
                  </div>
                </div>
              </div>

              {witchInfo?.canSave && (
                <button
                  type="button"
                  className={witchSave ? 'btn-primary' : 'btn-secondary'}
                  style={{
                    width: 'auto',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    background: witchSave ? '#10b981' : undefined
                  }}
                  disabled={submitted || !witchInfo?.wolfVictim}
                  onClick={() => {
                    sounds.playCardFlip();
                    setWitchSave(!witchSave);
                  }}
                >
                  {witchSave ? '✓ Sẽ Cứu' : 'Dùng Bình Cứu'}
                </button>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', marginTop: '8px', color: '#e2e8f0' }}>
              {witchInfo?.wolfVictim ? (
                <span>🐺 Bầy sói đang nhắm vào: <strong style={{ color: '#fca5a5' }}>{witchInfo.wolfVictim.name}</strong></span>
              ) : (
                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa phát hiện vết tích tấn công của bầy sói...</span>
              )}
            </div>
          </div>

          {/* Potion 2: Poison Potion */}
          <div style={{
            background: 'rgba(236, 72, 153, 0.1)',
            border: '1px solid rgba(236, 72, 153, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>☠️</span>
              <div>
                <strong style={{ color: '#f472b6', fontSize: '0.95rem' }}>Bình Độc Dược</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {witchInfo?.canPoison ? '✨ Còn 1 lần dùng' : '❌ Đã hết bình độc'}
                </div>
              </div>
            </div>

            {witchInfo?.canPoison && (
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Chọn một người bạn muốn đầu độc đêm nay (tùy chọn):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {alivePlayers.filter(p => p.id !== myPlayerId).map(p => {
                    const isPoisoned = witchPoisonTarget === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          if (submitted) return;
                          sounds.playCardFlip();
                          setWitchPoisonTarget(isPoisoned ? null : p.id);
                        }}
                        style={{
                          background: isPoisoned ? '#ec4899' : 'rgba(255, 255, 255, 0.06)',
                          color: isPoisoned ? '#fff' : 'var(--text-secondary)',
                          border: `1px solid ${isPoisoned ? '#ec4899' : 'rgba(255, 255, 255, 0.15)'}`,
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {p.avatar} {p.name}
                        {isPoisoned && <Skull size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={submitted}
            onClick={handleConfirmAction}
            style={{
              background: submitted ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
              borderColor: submitted ? '#10b981' : '#f472b6'
            }}
          >
            {submitted ? '✓ Đã Xác Nhận Hành Động Phù Thủy' : 'Xác Nhận Độc & Dược Liệu'}
          </button>
        </div>
      )}

      {/* Ghost Enhanced Action Panel */}
      {!isAlive && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setGhostActionType('WHISPER')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                border: '1px solid',
                borderColor: ghostActionType === 'WHISPER' ? '#94a3b8' : 'rgba(255,255,255,0.1)',
                background: ghostActionType === 'WHISPER' ? 'rgba(148,163,184,0.3)' : 'transparent',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              👻 Thì Thầm
            </button>
            <button
              type="button"
              onClick={() => setGhostActionType('HAUNT')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                border: '1px solid',
                borderColor: ghostActionType === 'HAUNT' ? '#ef4444' : 'rgba(255,255,255,0.1)',
                background: ghostActionType === 'HAUNT' ? 'rgba(239,68,68,0.3)' : 'transparent',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              🕯️ Ám Ảnh
            </button>
            <button
              type="button"
              onClick={() => setGhostActionType('BLESS')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.8rem',
                border: '1px solid',
                borderColor: ghostActionType === 'BLESS' ? '#10b981' : 'rgba(255,255,255,0.1)',
                background: ghostActionType === 'BLESS' ? 'rgba(16,185,129,0.3)' : 'transparent',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              ✨ Ban Phước
            </button>
          </div>

          <div style={{
            fontSize: '0.8rem',
            padding: '8px 12px',
            borderRadius: '8px',
            background: ghostActionType === 'HAUNT' ? 'rgba(239, 68, 68, 0.15)' : (ghostActionType === 'BLESS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)'),
            border: `1px solid ${ghostActionType === 'HAUNT' ? 'rgba(239, 68, 68, 0.3)' : (ghostActionType === 'BLESS' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)')}`,
            color: ghostActionType === 'HAUNT' ? '#fca5a5' : (ghostActionType === 'BLESS' ? '#6ee7b7' : '#cbd5e1'),
            marginBottom: '12px',
            textAlign: 'center'
          }}>
            {ghostActionType === 'HAUNT' && '🕯️ Ám Ảnh: Mục tiêu nhận sẵn +1 PHIẾU NGHI NGỜ khi làng bỏ phiếu chiều nay!'}
            {ghostActionType === 'BLESS' && '✨ Ban Phước: Tạo khiên hộ mệnh GIẢM 1 PHIẾU BẦU PHẠT khi mục tiêu bị dồn phiếu chiều nay!'}
            {ghostActionType === 'WHISPER' && '👻 Thì Thầm: Gửi điềm báo và manh mối huyền bí từ cõi chết tới người được chọn vào sáng mai.'}
          </div>
        </div>
      )}

      {/* Target Selection for Living Action Roles & Ghost */}
      {!isSleepingRole && !isWitch && (
        <>
          {/* Werewolf Pack Coordination Banner */}
          {myRole === 'WEREWOLF' && wolfPackData && (
            <div style={{
              background: wolfPackData.pendingVictim?.isUnanimous
                ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.25), rgba(185, 28, 28, 0.35))'
                : (wolfPackData.pendingVictim?.isTied
                  ? 'rgba(245, 158, 11, 0.18)'
                  : 'rgba(239, 68, 68, 0.12)'),
              border: `1px solid ${wolfPackData.pendingVictim?.isUnanimous ? '#ef4444' : (wolfPackData.pendingVictim?.isTied ? '#f59e0b' : 'rgba(239, 68, 68, 0.35)')}`,
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              marginBottom: '14px',
              textAlign: 'left',
              boxShadow: wolfPackData.pendingVictim?.isUnanimous ? '0 0 20px rgba(239, 68, 68, 0.25)' : 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>
                    {wolfPackData.pendingVictim?.isUnanimous ? '🔥' : (wolfPackData.pendingVictim?.isTied ? '⚠️' : '🐺')}
                  </span>
                  <div>
                    <div style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: wolfPackData.pendingVictim?.isUnanimous ? '#fca5a5' : (wolfPackData.pendingVictim?.isTied ? '#fcd34d' : '#f87171')
                    }}>
                      {wolfPackData.pendingVictim?.isUnanimous
                        ? `ĐỒNG THUẬN HOÀN HẢO (${wolfPackData.pendingVictim.votes}/${wolfPackData.totalWolves} SÓI)`
                        : (wolfPackData.pendingVictim?.isTied
                          ? `BẦY SÓI ĐANG CHIA RẼ (${wolfPackData.totalWolves} SÓI)`
                          : `MỤC TIÊU SĂN MỒI (${wolfPackData.pendingVictim ? `${wolfPackData.pendingVictim.votes}/${wolfPackData.totalWolves} phiếu` : 'Đang chọn'})`)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {wolfPackData.pendingVictim
                        ? (wolfPackData.pendingVictim.isTied
                            ? 'Mỗi con sói đang chọn 1 người khác nhau! Hãy thống nhất cắn cùng 1 người.'
                            : `Nạn nhân dự kiến: ${wolfPackData.pendingVictim.name}`)
                        : 'Chạm vào người chơi để chỉ điểm cho đồng đội cùng thấy!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="player-list">
            {selectablePlayers.map(p => {
              const isSelected = selectedTarget === p.id;
              const fellowWolvesTargeting = (myRole === 'WEREWOLF' && wolfPackData?.wolves)
                ? Object.values(wolfPackData.wolves).filter(w => w.wolfId !== myPlayerId && w.targetId === p.id)
                : [];

              return (
                <div
                  key={p.id}
                  className={`player-card selectable ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (!submitted) {
                      sounds.playCardFlip();
                      setSelectedTarget(p.id);
                      if (myRole === 'WEREWOLF' && onWolfSelectTarget) {
                        onWolfSelectTarget(p.id);
                      }
                    }
                  }}
                  style={{
                    borderColor: isSelected
                      ? (myRole === 'WEREWOLF' ? '#ef4444' : 'var(--color-seer)')
                      : (fellowWolvesTargeting.length > 0 ? 'rgba(239, 68, 68, 0.7)' : undefined),
                    boxShadow: fellowWolvesTargeting.length > 0
                      ? '0 0 15px rgba(239, 68, 68, 0.35)'
                      : (isSelected && myRole === 'WEREWOLF' ? '0 0 15px rgba(239, 68, 68, 0.25)' : undefined)
                  }}
                >
                  <div className="player-info">
                    <div className="player-avatar">
                      {p.avatar}
                    </div>
                    <div className="player-name">
                      {p.name}
                      {p.id === myPlayerId && <span className="you-badge">BẠN</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {fellowWolvesTargeting.length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(239, 68, 68, 0.22)',
                        border: '1px solid rgba(239, 68, 68, 0.55)',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        color: '#fca5a5',
                        fontWeight: 700,
                        animation: 'pulse 1.8s infinite'
                      }}>
                        <span>🐺</span>
                        <span>{fellowWolvesTargeting.map(w => w.wolfName).join(', ')}</span>
                      </div>
                    )}

                    {isSelected && (
                      <span style={{
                        background: myRole === 'WEREWOLF' ? '#ef4444' : 'var(--color-seer)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} /> ĐÃ CHỌN
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn-primary"
              disabled={!selectedTarget || submitted}
              onClick={handleConfirmAction}
              style={{
                background: submitted ? 'rgba(16, 185, 129, 0.2)' : (myRole === 'WEREWOLF' ? '#ef4444' : undefined),
                border: submitted ? '1px solid #10b981' : (myRole === 'WEREWOLF' ? '1px solid #dc2626' : undefined),
                boxShadow: submitted ? 'none' : (myRole === 'WEREWOLF' ? '0 0 20px rgba(239, 68, 68, 0.4)' : undefined),
                color: submitted ? '#6ee7b7' : '#fff'
              }}
            >
              {submitted ? (
                <>
                  <Check size={18} color="#10b981" />
                  Đã Xác Nhận Hành Động
                </>
              ) : (
                <>
                  {actionIcon}
                  Xác Nhận Lựa Chọn
                </>
              )}
            </button>

            {submitted && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Đang chờ tất cả người chơi hoàn tất hành động...
              </p>
            )}
          </div>

          {/* Werewolf Pack Secret Chat Drawer */}
          {myRole === 'WEREWOLF' && (
            <div style={{
              marginTop: '20px',
              background: 'rgba(15, 12, 19, 0.85)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(239, 68, 68, 0.05)'
            }}>
              {/* Wolf Chat Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
                  cursor: 'pointer'
                }}
                onClick={() => setWolfChatOpen(!wolfChatOpen)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>🐺</span>
                  <strong style={{ fontSize: '0.85rem', color: '#fca5a5', letterSpacing: '0.5px' }}>
                    KÊNH MẬT BẦY SÓI ({wolfPackData?.totalWolves || 1} Sói)
                  </strong>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {wolfChatOpen ? 'Thu gọn ▲' : 'Mở rộng ▼'}
                </span>
              </div>

              {wolfChatOpen && (
                <div style={{ padding: '12px' }}>
                  {/* Quick Tactical Chips */}
                  <div style={{
                    display: 'flex',
                    gap: '6px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    marginBottom: '8px'
                  }}>
                    {[
                      '🩸 Cắn người này đi!',
                      '🤫 Cẩn thận Bác Sĩ cứu!',
                      '🔮 Mai tôi giả Tiên Tri!',
                      '🤝 Cùng dồn phiếu nào!'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        style={{
                          whiteSpace: 'nowrap',
                          padding: '4px 10px',
                          fontSize: '0.72rem',
                          borderRadius: '999px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#fecaca',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (onSendWolfChat) onSendWolfChat(chip);
                        }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Message List */}
                  <div style={{
                    height: '110px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '6px',
                    background: 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '8px',
                    textAlign: 'left'
                  }}>
                    {(!wolfChatMessages || wolfChatMessages.length === 0) ? (
                      <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                        Chưa có tin nhắn nào. Bàn kế hoạch cùng bầy đàn tại đây...
                      </div>
                    ) : (
                      wolfChatMessages.map(msg => {
                        const isMine = msg.senderId === myPlayerId;
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '6px',
                              alignSelf: isMine ? 'flex-end' : 'flex-start',
                              maxWidth: '85%'
                            }}
                          >
                            {!isMine && (
                              <span style={{ fontSize: '1rem' }}>{msg.avatar || '🐺'}</span>
                            )}
                            <div style={{
                              background: isMine ? 'rgba(239, 68, 68, 0.35)' : 'rgba(255, 255, 255, 0.08)',
                              border: `1px solid ${isMine ? '#ef4444' : 'rgba(255, 255, 255, 0.15)'}`,
                              padding: '5px 9px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              color: '#f8fafc'
                            }}>
                              {!isMine && (
                                <div style={{ fontSize: '0.68rem', color: '#fca5a5', fontWeight: 700, marginBottom: '2px' }}>
                                  {msg.senderName}
                                </div>
                              )}
                              <div>{msg.text}</div>
                              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.4)', textAlign: 'right', marginTop: '2px' }}>
                                {msg.time}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Chat Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (wolfChatInput.trim() && onSendWolfChat) {
                        onSendWolfChat(wolfChatInput.trim());
                        setWolfChatInput('');
                      }
                    }}
                    style={{ display: 'flex', gap: '6px' }}
                  >
                    <input
                      type="text"
                      placeholder="Gửi tin nhắn bí mật cho bầy sói..."
                      value={wolfChatInput}
                      onChange={(e) => setWolfChatInput(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(0, 0, 0, 0.4)',
                        color: '#fff',
                        fontSize: '0.82rem',
                        outline: 'none'
                      }}
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        background: '#ef4444',
                        border: 'none',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      Gửi
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
