import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, Headphones, VolumeX, Moon, Ghost } from 'lucide-react';
import { webrtcManager } from '../utils/webrtcManager';
import { sounds } from '../utils/soundEffects';

export default function VoiceBar({
  roomCode,
  playerId,
  phase,
  isAlive,
  players = []
}) {
  const [voiceStatus, setVoiceStatus] = useState({
    micAllowed: false,
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    isNightSilence: false,
    channelName: 'VILLAGE'
  });
  const [isConnecting, setIsConnecting] = useState(false);

  // Subscribe to WebRTC voice status changes
  useEffect(() => {
    const unsubscribe = webrtcManager.subscribeStatus((status) => {
      setVoiceStatus(status);
    });
    return unsubscribe;
  }, []);

  // Sync phase and living state with webrtcManager
  useEffect(() => {
    webrtcManager.updatePhase(phase, isAlive, players);
  }, [phase, isAlive, players]);

  // Handle keyboard shortcut [M] to toggle mute
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.key === 'm' || e.key === 'M') {
        if (voiceStatus.micAllowed) {
          handleToggleMute();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voiceStatus.micAllowed, voiceStatus.isMuted]);

  const handleStartVoice = async () => {
    setIsConnecting(true);
    sounds.playCardFlip();
    const success = await webrtcManager.startMicrophone();
    setIsConnecting(false);
  };

  const handleToggleMute = () => {
    sounds.playCardFlip();
    webrtcManager.toggleMute();
  };

  const handleToggleDeafen = () => {
    sounds.playCardFlip();
    webrtcManager.toggleDeafen();
  };

  // If mic not yet started
  if (!voiceStatus.micAllowed) {
    return (
      <button
        type="button"
        className="btn-icon voice-compact-connect-btn"
        disabled={isConnecting}
        onClick={handleStartVoice}
        title={isConnecting ? 'Đang kết nối mic...' : 'Bật Mic (Trò chuyện bằng giọng nói)'}
      >
        <MicOff size={16} className={isConnecting ? 'spin-icon' : ''} />
      </button>
    );
  }

  // Compact Voice Controls Group
  return (
    <div className="voice-compact-group">
      {/* Mic Button */}
      <button
        type="button"
        className={`btn-icon voice-icon-btn ${
          voiceStatus.isNightSilence
            ? 'voice-night'
            : voiceStatus.isMuted
            ? 'voice-muted'
            : voiceStatus.isSpeaking
            ? 'voice-speaking'
            : 'voice-active'
        }`}
        disabled={voiceStatus.isNightSilence}
        onClick={handleToggleMute}
        title={
          voiceStatus.isNightSilence
            ? 'Đêm tĩnh lặng - Mic tạm khóa theo luật game'
            : voiceStatus.isMuted
            ? 'Bật Mic (Phím M)'
            : 'Tắt Mic (Phím M)'
        }
      >
        {voiceStatus.isMuted || voiceStatus.isNightSilence ? (
          <MicOff size={16} />
        ) : (
          <Mic size={16} />
        )}
      </button>

      {/* Deafen / Speaker Button */}
      <button
        type="button"
        className={`btn-icon voice-icon-btn ${
          voiceStatus.isDeafened ? 'voice-muted' : 'voice-active'
        }`}
        onClick={handleToggleDeafen}
        title={voiceStatus.isDeafened ? 'Bật lại tiếng loa' : 'Tắt tiếng loa (Deafen)'}
      >
        {voiceStatus.isDeafened ? <VolumeX size={16} /> : <Headphones size={16} />}
      </button>

      {/* Compact Channel / Phase Indicator */}
      <div
        className="voice-channel-pill"
        title={
          voiceStatus.isNightSilence
            ? 'Kênh thoại: Đêm Tĩnh Lặng (Tự động khóa mic)'
            : voiceStatus.channelName === 'GHOST_REALM'
            ? 'Kênh thoại: Cõi Âm (Thoại riêng người chết)'
            : 'Kênh thoại: Làng (Trực tiếp)'
        }
      >
        {voiceStatus.isNightSilence ? (
          <Moon size={12} color="#818cf8" />
        ) : voiceStatus.channelName === 'GHOST_REALM' ? (
          <Ghost size={12} color="#c084fc" />
        ) : (
          <span className="green-live-dot" />
        )}
      </div>
    </div>
  );
}
