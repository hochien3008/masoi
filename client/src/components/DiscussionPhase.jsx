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
      <div className="discussion-status-banner">
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
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          🎙️ Hoạt động giọng nói
        </div>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', flexWrap: 'wrap' }}>
          {alivePlayers.map(p => (
            <div
              key={p.id}
              className={`roster-player-chip ${p.isSpeaking ? 'is-speaking voice-roster-speaking' : ''}`}
            >
              <span style={{ fontSize: '1rem' }}>{p.avatar}</span>
              <span style={{ fontWeight: p.isSpeaking ? 700 : 600 }}>
                {p.name}
              </span>
              {p.isSpeaking ? (
                <div className="voice-wave-container" style={{ marginLeft: '2px' }}>
                  <div className="wave-bar bar-1" />
                  <div className="wave-bar bar-2" />
                  <div className="wave-bar bar-3" />
                </div>
              ) : (
                <MicOff size={12} style={{ opacity: 0.4 }} />
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
              className="quick-chip"
              onClick={() => handleQuickPhrase(phrase)}
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
        <div className="ghost-spectator-notice">
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
