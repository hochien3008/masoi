import React, { useState } from 'react';
import { MessageSquare, FastForward, Users, Send, Eye, MicOff } from 'lucide-react';
import { sounds } from '../utils/soundEffects';
import RoleIcon from './RoleIcon';

export default function DiscussionPhase({
  dayNumber,
  timer,
  players,
  myPlayerId,
  isHost,
  isAlive,
  chatMessages,
  onSendMessage,
  onSkipDiscussion
}) {
  const [inputText, setInputText] = useState('');

  const alivePlayers = players.filter(p => p.isAlive);
  const deadPlayers = players.filter(p => !p.isAlive);

  const quickPhrases = [
    'Tôi là dân làng chân chính!',
    'Đêm qua ai có biểu hiện gì lạ?',
    'Tiên tri đã soi ai chưa?',
    'Tôi nghi ngờ người ít nói nhất!',
    'Mọi người vote ai thì bảo tôi.'
  ];

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), !isAlive);
    setInputText('');
  };

  const handleQuickPhrase = (phrase) => {
    onSendMessage(phrase, !isAlive);
  };

  return (
    <div className="glass-panel">
      <div className="phase-header">
        <span className="phase-tag tag-day">
          <Users size={14} /> NGÀY THỨ {dayNumber}
        </span>
        <h2 style={{ fontSize: '1.4rem', marginTop: '4px' }}>HỘI ĐỒNG THẢO LUẬN</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Tranh luận ngoài đời / voice call hoặc gõ tin nhắn để tìm ra Ma Sói!
        </p>
        <div className={`timer-box ${timer <= 15 ? 'timer-warning' : ''}`}>
          ⏱️ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Alive Status Counter */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        marginBottom: '12px',
        fontSize: '0.85rem'
      }}>
        <div>
          Còn sống: <strong style={{ color: '#10b981' }}>{alivePlayers.length}</strong>
        </div>
        <div>
          Đã hy sinh: <strong style={{ color: '#ef4444' }}>{deadPlayers.length}</strong>
        </div>
      </div>

      {/* Living Players Voice Activity Roster */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🎙️ Hoạt động giọng nói
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', flexWrap: 'wrap' }}>
          {alivePlayers.map(p => (
            <div
              key={p.id}
              className={p.isSpeaking ? 'voice-roster-speaking' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '999px',
                background: p.isSpeaking
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: `1.5px solid ${p.isSpeaking ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                boxShadow: p.isSpeaking
                  ? '0 0 14px rgba(16, 185, 129, 0.5), inset 0 0 8px rgba(16, 185, 129, 0.1)'
                  : 'none',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative'
              }}
            >
              <span style={{ fontSize: '1rem' }}>{p.avatar}</span>
              <span style={{
                fontWeight: p.isSpeaking ? 700 : 500,
                color: p.isSpeaking ? '#6ee7b7' : '#e2e8f0'
              }}>
                {p.name}
              </span>
              {p.isSpeaking ? (
                <div className="voice-wave-container" style={{ marginLeft: '2px' }}>
                  <div className="wave-bar bar-1" />
                  <div className="wave-bar bar-2" />
                  <div className="wave-bar bar-3" />
                </div>
              ) : (
                <MicOff size={12} style={{ color: 'rgba(255,255,255,0.25)' }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="chat-drawer" style={{ height: '180px', marginBottom: '10px' }}>
        <div className="chat-messages">
          {chatMessages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto' }}>
              Chưa có tin nhắn nào. Hãy bắt đầu thảo luận!
            </div>
          ) : (
            chatMessages.map(msg => {
              const isMine = msg.senderId === myPlayerId;
              return (
                <div key={msg.id} className={`chat-bubble ${isMine ? 'mine' : 'other'} ${msg.isGhost ? 'ghost' : ''}`}>
                  <div className="chat-sender">
                    {msg.isGhost && '👻 '}
                    {msg.senderName}
                  </div>
                  <div>{msg.text}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Discussion Suggestions (Alive players only) */}
      {isAlive && (
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
          {quickPhrases.map((phrase, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPhrase(phrase)}
              style={{
                whiteSpace: 'nowrap',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 10px',
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
            >
              {phrase}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input or Ghost Spectator Notice */}
      {isAlive ? (
        <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <input
            type="text"
            className="chat-input"
            placeholder="Nhập suy luận của bạn..."
            value={inputText}
            maxLength={80}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="chat-send-btn">
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(148, 163, 184, 0.1)',
          border: '1px dashed rgba(148, 163, 184, 0.3)',
          borderRadius: 'var(--radius-md)',
          color: '#cbd5e1',
          fontSize: '0.85rem',
          marginBottom: '16px'
        }}>
          <RoleIcon roleId="GHOST" size={24} />
          <span>Bạn đã hy sinh. Linh hồn chỉ được quan sát và không thể nhắn tin trong phiên thảo luận.</span>
        </div>
      )}

      {/* Host Skip Button */}
      {isHost && (
        <button
          type="button"
          className="btn-secondary"
          onClick={() => {
            sounds.playCardFlip();
            onSkipDiscussion();
          }}
        >
          <FastForward size={16} />
          Bỏ Qua Thảo Luận • Bắt Đầu Bỏ Phiếu Ngay
        </button>
      )}
    </div>
  );
}
