import React, { useState, useEffect } from 'react';
import { Flame, Check, AlertTriangle, ShieldCheck } from 'lucide-react';
import { sounds } from '../utils/soundEffects';

export default function VotingPhase({
  phase, // 'VOTING' or 'VOTE_RESULT'
  timer,
  players,
  myPlayerId,
  isAlive,
  voteResults,
  onSubmitVote
}) {
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (phase === 'VOTING') {
      sounds.playHeartbeat();
      setSelectedTarget(null);
      setVoted(false);
    } else if (phase === 'VOTE_RESULT') {
      sounds.playGavel();
    }
  }, [phase]);

  const alivePlayers = players.filter(p => p.isAlive);
  const votedCount = alivePlayers.filter(p => p.hasVoted).length;

  // Candidates for VOTE_RESULT screen: must include the player who was eliminated in this vote!
  const resultCandidates = players
    .filter(p => p.isAlive || p.id === voteResults?.eliminatedId)
    .sort((a, b) => {
      const votesB = voteResults?.voteCounts?.[b.id] || 0;
      const votesA = voteResults?.voteCounts?.[a.id] || 0;
      return votesB - votesA;
    });
  const maxVoteTally = Math.max(1, ...resultCandidates.map(p => voteResults?.voteCounts?.[p.id] || 0), voteResults?.skipCount || 0);

  const handleConfirmVote = (targetId) => {
    setSelectedTarget(targetId);
    setVoted(true);
    sounds.playCardFlip();
    onSubmitVote(targetId);
  };

  // If in VOTE_RESULT mode
  if (phase === 'VOTE_RESULT') {
    return (
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <div className="phase-header">
          <span className="phase-tag tag-vote">
            KẾT QUẢ BIỂU QUYẾT
          </span>
          <h2 style={{ fontSize: '1.5rem', marginTop: '4px' }}>PHÁN QUYẾT CỦA DÂN LÀNG</h2>
          <div className="timer-box">
            ⏱️ {timer}s
          </div>
        </div>

        {/* Tally Bars */}
        <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {resultCandidates.map(p => {
            const votes = voteResults?.voteCounts?.[p.id] || 0;
            const percentage = (votes / maxVoteTally) * 100;
            const isEliminated = p.id === voteResults?.eliminatedId;

            return (
              <div key={p.id} style={{
                background: isEliminated ? 'rgba(239, 68, 68, 0.16)' : 'rgba(0, 0, 0, 0.03)',
                border: isEliminated ? '1.5px solid rgba(239, 68, 68, 0.5)' : '1px solid var(--border-subtle)',
                boxShadow: isEliminated ? '0 0 16px rgba(239, 68, 68, 0.25)' : 'none',
                borderRadius: '8px',
                padding: '10px 12px',
                textAlign: 'left',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{p.avatar}</span>
                    <span style={{ fontWeight: isEliminated ? 800 : 600, color: isEliminated ? '#ef4444' : 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                    {isEliminated && (
                      <span style={{
                        fontSize: '0.7rem',
                        background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
                        color: '#fff',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                      }}>
                        ⚖️ BỊ TREO CỔ ({p.roleDetails?.name || p.role || 'Đã chết'})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {voteResults?.ghostModifiers?.[p.id]?.haunt > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.18)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        🕯️ +{voteResults.ghostModifiers[p.id].haunt} Ám
                      </span>
                    )}
                    {voteResults?.ghostModifiers?.[p.id]?.shield > 0 && (
                      <span style={{ fontSize: '0.75rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.18)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        ✨ -{voteResults.ghostModifiers[p.id].shield} Khiên
                      </span>
                    )}
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isEliminated ? '#ef4444' : 'var(--text-primary)' }}>
                      {votes} phiếu
                    </span>
                  </div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.08)', height: '7px', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: isEliminated
                      ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
                      : (votes > 0 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'transparent'),
                    transition: 'width 0.6s ease'
                  }} />
                </div>
              </div>
            );
          })}

          {/* Skip vote tally */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '8px 12px',
            textAlign: 'left',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>⚪ Bỏ phiếu trắng (Không treo cổ)</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{voteResults?.skipCount || 0} phiếu</span>
            </div>
          </div>
        </div>

        {/* Result Announcement */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: voteResults?.eliminatedId ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1.5px solid ${voteResults?.eliminatedId ? '#ef4444' : '#10b981'}`,
          marginTop: '16px'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>
            {voteResults?.eliminatedId ? '⚖️' : '🕊️'}
          </div>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: voteResults?.eliminatedId ? '#dc2626' : '#059669'
          }}>
            {voteResults?.message}
          </div>
        </div>
      </div>
    );
  }

  // Active VOTING mode
  return (
    <div className="glass-panel" style={{ textAlign: 'center' }}>
      <div className="phase-header">
        <span className="phase-tag tag-vote">
          <Flame size={14} /> BỎ PHIẾU TREO CỔ
        </span>
        <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>AI LÀ MA SÓI?</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isAlive
            ? 'Hãy cân nhắc kỹ lưỡng và chọn người bạn nghi ngờ nhất:'
            : 'Bạn đã chết (Linh Hồn) và không thể tham gia bỏ phiếu.'}
        </p>
        <div className={`timer-box ${timer <= 8 ? 'timer-warning' : ''}`}>
          ⏱️ {timer}s
        </div>
      </div>

      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Tiến độ: {votedCount}/{alivePlayers.length} người đã bỏ phiếu
      </div>

      {isAlive && (
        <>
          <div className="player-list">
            {alivePlayers.map(p => {
              const isSelected = selectedTarget === p.id;
              return (
                <div
                  key={p.id}
                  className={`player-card selectable ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    if (!voted) handleConfirmVote(p.id);
                  }}
                  style={{
                    borderColor: isSelected ? 'var(--color-wolf)' : undefined
                  }}
                >
                  <div className="player-info">
                    <div className={`player-avatar ${p.isSpeaking ? 'speaking-avatar' : ''}`}>
                      {p.avatar}
                      {p.isSpeaking && <span className="speaking-badge" title="Đang nói">🎙️</span>}
                    </div>
                    <div className="player-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{p.name}</span>
                      {p.id === myPlayerId && <span className="you-badge">BẠN</span>}
                      {p.hauntVotes > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'rgba(239, 68, 68, 0.25)',
                          color: '#f87171',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          fontWeight: 700
                        }}>
                          🕯️ Bị Ám (+{p.hauntVotes})
                        </span>
                      )}
                      {p.blessShield > 0 && (
                        <span style={{
                          fontSize: '0.7rem',
                          background: 'rgba(16, 185, 129, 0.25)',
                          color: '#34d399',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          fontWeight: 700
                        }}>
                          ✨ Khiên Hộ Mệnh (-{p.blessShield})
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <span style={{
                      background: 'var(--color-wolf)',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Check size={12} /> ĐÃ BỎ PHIẾU
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Skip Vote Button */}
          <button
            type="button"
            className="btn-secondary"
            style={{
              marginTop: '12px',
              background: selectedTarget === 'SKIP' ? 'rgba(255, 255, 255, 0.2)' : undefined,
              borderColor: selectedTarget === 'SKIP' ? '#fff' : undefined
            }}
            disabled={voted}
            onClick={() => handleConfirmVote('SKIP')}
          >
            ⚪ Bỏ Phiếu Trắng (Không nghi ngờ ai)
          </button>
        </>
      )}

      {/* Dead Player Spectator Roster */}
      {!isAlive && (
        <div className="player-list">
          {alivePlayers.map(p => (
            <div key={p.id} className="player-card" style={{ opacity: 0.85 }}>
              <div className="player-info">
                <div className={`player-avatar ${p.isSpeaking ? 'speaking-avatar' : ''}`}>
                  {p.avatar}
                  {p.isSpeaking && <span className="speaking-badge" title="Đang nói">🎙️</span>}
                </div>
                <div className="player-name" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>{p.name}</span>
                  {p.hauntVotes > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(239, 68, 68, 0.25)',
                      color: '#f87171',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      fontWeight: 700
                    }}>
                      🕯️ Bị Ám (+{p.hauntVotes})
                    </span>
                  )}
                  {p.blessShield > 0 && (
                    <span style={{
                      fontSize: '0.7rem',
                      background: 'rgba(16, 185, 129, 0.25)',
                      color: '#34d399',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      fontWeight: 700
                    }}>
                      ✨ Khiên Hộ Mệnh (-{p.blessShield})
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {voted && (
        <div style={{
          marginTop: '16px',
          color: '#10b981',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <Check size={16} /> Phiếu bầu của bạn đã được ghi nhận.
        </div>
      )}
    </div>
  );
}
