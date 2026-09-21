import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Volume2, VolumeX, LogOut, Copy, Check } from 'lucide-react';
import { sounds } from './utils/soundEffects';

import Home from './components/Home';
import Lobby from './components/Lobby';
import RoleReveal from './components/RoleReveal';
import NightPhase from './components/NightPhase';
import MorningPhase from './components/MorningPhase';
import DiscussionPhase from './components/DiscussionPhase';
import VotingPhase from './components/VotingPhase';
import GameOverModal from './components/GameOverModal';
import HunterShotModal from './components/HunterShotModal';
import VoiceBar from './components/VoiceBar';
import PhaseTransition from './components/PhaseTransition';
import GameEventOverlay from './components/GameEventOverlay';
import RoomSettingsModal from './components/RoomSettingsModal';
import Logo from './components/Logo';
import { webrtcManager } from './utils/webrtcManager';

// Determine socket server URL
const getSocketUrl = () => {
  const localOverride = localStorage.getItem('nightfall_server_url');
  if (localOverride) return localOverride;
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;
  if (typeof window !== 'undefined' && window.location.hostname.includes('github.io')) {
    return 'https://masoi-d6ku.onrender.com';
  }
  return '/';
};

// Initialize socket connection
const socket = io(getSocketUrl(), {
  autoConnect: true,
  reconnection: true,
  transports: ['websocket', 'polling']
});

export default function App() {
  const [gameState, setGameState] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(false);
  const [initialRoomCode, setInitialRoomCode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room') || '';
  });
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [peerVoiceStatuses, setPeerVoiceStatuses] = useState({});

  // Theme & Animation States
  const [activeEvent, setActiveEvent] = useState(null);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [transitioningPhase, setTransitioningPhase] = useState(null);
  const [prevPhase, setPrevPhase] = useState(null);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Nightfall socket server:', socket.id);
      // Attempt reconnect if session stored
      const savedCode = sessionStorage.getItem('nightfall_room_code');
      const savedPlayerId = sessionStorage.getItem('nightfall_player_id');
      if (savedCode && savedPlayerId) {
        socket.emit('reconnect_room', { roomCode: savedCode, playerId: savedPlayerId });
      }
    });

    socket.on('room_created', ({ roomCode, playerId }) => {
      sessionStorage.setItem('nightfall_room_code', roomCode);
      sessionStorage.setItem('nightfall_player_id', playerId);
      window.history.replaceState({}, '', `?room=${roomCode}`);
    });

    socket.on('room_joined', ({ roomCode, playerId }) => {
      sessionStorage.setItem('nightfall_room_code', roomCode);
      sessionStorage.setItem('nightfall_player_id', playerId);
      window.history.replaceState({}, '', `?room=${roomCode}`);
    });

    socket.on('game_state', (state) => {
      setGameState((prevState) => {
        let isPrevNight = false;
        let isNextNight = false;
        let isPrevDay = false;
        let isNextDay = false;

        if (prevState && prevState.phase !== state.phase) {
          // Detect Day/Night transitions
          isPrevNight = ['NIGHT', 'ROLE_REVEAL'].includes(prevState.phase);
          isNextNight = ['NIGHT', 'ROLE_REVEAL'].includes(state.phase);
          isPrevDay = ['MORNING', 'DISCUSSION', 'VOTING', 'VOTE_RESULT'].includes(prevState.phase);
          isNextDay = ['MORNING', 'DISCUSSION', 'VOTING', 'VOTE_RESULT'].includes(state.phase);
          
          if (isPrevNight && isNextDay) {
            setTransitioningPhase('DAY');
          } else if (isPrevDay && isNextNight) {
            setTransitioningPhase('NIGHT');
          }
        }
        
        // Detect Game Events
        if (prevState) {
          // Vote Eliminated
          if (state.phase === 'VOTE_RESULT' && state.voteResults?.eliminatedId && 
              prevState.phase !== 'VOTE_RESULT') {
            const isSelf = state.voteResults.eliminatedId === state.myPlayerId;
            setActiveEvent({ type: 'VOTE_ELIMINATED', isSelf });
          }
          // Night Report Events
          if (state.phase === 'MORNING' && prevState.phase !== 'MORNING' && state.nightReport) {
            let evt = null;
            if (!state.nightReport.survived) {
              const isSelf = state.nightReport.victims?.some(v => v.id === state.myPlayerId);
              evt = { type: 'WOLF_KILL', isSelf };
            } else if (state.nightReport.healed) {
              evt = { type: 'HEAL' };
            } else if (state.nightReport.witchSaved) {
              evt = { type: 'WITCH_SAVE' };
            }

            if (evt) {
              if (isPrevNight && isNextDay) {
                // Queue event until Day/Dawn transition completes so it displays fully!
                setPendingEvent(evt);
              } else {
                setActiveEvent(evt);
              }
            }
          }
          // Hunter Shot
          if (state.phase === 'HUNTER_SHOT' && state.hunterReport && !prevState.hunterReport) {
             setActiveEvent({ type: 'HUNTER_SHOT' });
          }
        }

        return state;
      });
    });

    socket.on('timer_tick', ({ timer }) => {
      setGameState((prev) => (prev ? { ...prev, timer } : null));
    });

    socket.on('chat_message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on('wolf_pack_update', ({ wolfPackData, wolfChatMessages }) => {
      setGameState((prev) => (prev ? { ...prev, wolfPackData, wolfChatMessages } : null));
    });

    socket.on('wolf_chat_message', (msg) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const exists = prev.wolfChatMessages?.some((m) => m.id === msg.id);
        if (exists) return prev;
        return {
          ...prev,
          wolfChatMessages: [...(prev.wolfChatMessages || []), msg]
        };
      });
      sounds.playCardFlip();
    });

    socket.on('error_message', ({ message }) => {
      setErrorMessage(message);
      setTimeout(() => setErrorMessage(''), 4000);
    });

    return () => {
      socket.off('connect');
      socket.off('room_created');
      socket.off('room_joined');
      socket.off('game_state');
      socket.off('timer_tick');
      socket.off('chat_message');
      socket.off('wolf_pack_update');
      socket.off('wolf_chat_message');
      socket.off('error_message');
    };
  }, []);

  // Initialize WebRTC Voice when entering a room
  useEffect(() => {
    if (gameState?.code && gameState?.myPlayerId) {
      webrtcManager.init(
        socket,
        gameState.code,
        gameState.myPlayerId,
        null,
        (playerId, status) => {
          setPeerVoiceStatuses(prev => ({
            ...prev,
            [playerId]: status
          }));
        }
      );
    }
  }, [gameState?.code, gameState?.myPlayerId]);

  const handleToggleSound = () => {
    const isMuted = sounds.toggleMute();
    setMuted(isMuted);
  };

  const handleCreateRoom = (playerName) => {
    socket.emit('create_room', { playerName });
  };

  const handleJoinRoom = (roomCode, playerName) => {
    socket.emit('join_room', { roomCode, playerName });
  };

  const handleAddBot = () => {
    if (!gameState) return;
    socket.emit('add_bot', { roomCode: gameState.code });
  };

  const handleRemoveBot = (botId) => {
    if (!gameState) return;
    socket.emit('remove_bot', { roomCode: gameState.code, botId });
  };

  const handleStartGame = () => {
    if (!gameState) return;
    socket.emit('start_game', { roomCode: gameState.code });
  };

  const handleUpdateRoles = (selectedRoles) => {
    if (!gameState) return;
    socket.emit('update_roles', { roomCode: gameState.code, selectedRoles });
  };

  const handleUpdateSettings = (settings) => {
    if (!gameState) return;
    socket.emit('update_settings', { roomCode: gameState.code, settings });
  };

  const handlePlayerReady = () => {
    if (!gameState) return;
    socket.emit('player_ready', { roomCode: gameState.code, playerId: gameState.myPlayerId });
  };

  const handleSubmitNightAction = (actionData) => {
    if (!gameState) return;
    socket.emit('night_action', {
      roomCode: gameState.code,
      playerId: gameState.myPlayerId,
      targetId: typeof actionData === 'string' ? actionData : (actionData?.targetId || null),
      actionData
    });
  };

  const handleHunterShot = (targetId) => {
    if (!gameState) return;
    socket.emit('hunter_shot', {
      roomCode: gameState.code,
      hunterId: gameState.myPlayerId,
      targetId
    });
  };

  const handleSkipDiscussion = () => {
    if (!gameState) return;
    socket.emit('skip_discussion', { roomCode: gameState.code });
  };

  const handleSubmitVote = (targetId) => {
    if (!gameState) return;
    socket.emit('submit_vote', {
      roomCode: gameState.code,
      voterId: gameState.myPlayerId,
      targetId
    });
  };

  const handleSendMessage = (text, isGhost) => {
    if (!gameState) return;
    socket.emit('send_chat', {
      roomCode: gameState.code,
      playerId: gameState.myPlayerId,
      text,
      isGhost
    });
  };

  const handlePlayAgain = () => {
    if (!gameState) return;
    socket.emit('play_again', { roomCode: gameState.code });
  };

  const handleLeaveRoom = () => {
    webrtcManager.destroy();
    sessionStorage.removeItem('nightfall_room_code');
    sessionStorage.removeItem('nightfall_player_id');
    window.history.replaceState({}, '', window.location.pathname);
    window.location.reload();
  };

  const copyRoomCode = () => {
    if (!gameState?.code) return;
    navigator.clipboard.writeText(gameState.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const enrichedPlayers = (gameState?.players || []).map(p => ({
    ...p,
    isSpeaking: p.id === gameState?.myPlayerId
      ? webrtcManager.isSpeaking
      : Boolean(peerVoiceStatuses[p.id]?.isSpeaking)
  }));

  const myPlayer = enrichedPlayers.find((p) => p.id === gameState?.myPlayerId);

  // Determine theme class
  let themeClass = 'theme-twilight';
  if (gameState) {
    if (['NIGHT', 'ROLE_REVEAL'].includes(gameState.phase)) {
      themeClass = 'theme-night';
    } else if (['MORNING', 'DISCUSSION', 'VOTING', 'VOTE_RESULT', 'HUNTER_SHOT'].includes(gameState.phase)) {
      themeClass = 'theme-day';
    }
  }

  // Synchronize theme class to body for global CSS variables and cascade
  useEffect(() => {
    document.body.className = themeClass;
  }, [themeClass]);

  const isDayTheme = themeClass === 'theme-day';

  return (
    <>
      {/* Fullscreen Atmospheric Dual-Layer Backdrop */}
      <div className="atmospheric-backdrop">
        <div className={`backdrop-layer night-layer ${!isDayTheme ? 'active' : ''}`} />
        <div className={`backdrop-layer day-layer ${isDayTheme ? 'active' : ''}`} />
      </div>

      <div className={`nightfall-app ${themeClass}`}>
        {/* Overlays */}
        {transitioningPhase && (
          <PhaseTransition 
            targetPhase={transitioningPhase} 
            onComplete={() => {
              setTransitioningPhase(null);
              if (pendingEvent) {
                setActiveEvent(pendingEvent);
                setPendingEvent(null);
              }
            }} 
          />
        )}
      
      {activeEvent && (
        <GameEventOverlay 
          event={activeEvent} 
          onComplete={() => setActiveEvent(null)} 
        />
      )}

      {/* Top App Bar */}
      <header className="top-bar">
        <Logo variant="compact" size={30} />

        <div className="top-bar-actions">
          {gameState && (
            <div
              className="room-badge"
              onClick={copyRoomCode}
              style={{ cursor: 'pointer' }}
              title="Chạm để sao chép mã phòng"
            >
              <span>{gameState.code}</span>
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            </div>
          )}

          {/* Compact Voice Controls in Top Bar */}
          {gameState && (
            <VoiceBar
              roomCode={gameState.code}
              playerId={gameState.myPlayerId}
              phase={gameState.phase}
              isAlive={gameState.isAlive}
              players={enrichedPlayers}
            />
          )}

          <button
            type="button"
            className="btn-icon"
            onClick={handleToggleSound}
            title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {gameState && (
            <button
              type="button"
              className="btn-icon"
              onClick={handleLeaveRoom}
              title="Rời phòng"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Global Toast Error Message */}
      {errorMessage && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.25)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          fontSize: '0.9rem',
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Main Game Screen depending on phase */}
      {!gameState && (
        <Home
          onCreate={handleCreateRoom}
          onJoin={handleJoinRoom}
          initialRoomCode={initialRoomCode}
        />
      )}

      {gameState && gameState.phase === 'LOBBY' && (
        <Lobby
          roomCode={gameState.code}
          players={enrichedPlayers}
          isHost={gameState.isHost}
          myPlayerId={gameState.myPlayerId}
          settings={gameState.settings}
          selectedSpecialRoles={gameState.selectedSpecialRoles}
          onUpdateSettings={handleUpdateSettings}
          onUpdateRoles={handleUpdateRoles}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
          onStartGame={handleStartGame}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onTriggerEvent={(evt) => setActiveEvent(evt)}
          onTriggerTransition={(phase) => setTransitioningPhase(phase)}
        />
      )}

      {gameState && gameState.phase === 'ROLE_REVEAL' && (
        <RoleReveal
          myRoleDetails={gameState.myRoleDetails}
          myPlayer={myPlayer}
          players={gameState.players}
          timer={gameState.timer}
          onReady={handlePlayerReady}
        />
      )}

      {gameState && gameState.phase === 'NIGHT' && (
        <NightPhase
          dayNumber={gameState.dayNumber}
          timer={gameState.timer}
          myRole={gameState.myRole}
          myRoleDetails={gameState.myRoleDetails}
          isAlive={gameState.isAlive}
          players={gameState.players}
          myPlayerId={gameState.myPlayerId}
          seerInspectionResult={gameState.seerInspectionResult}
          witchInfo={gameState.witchInfo}
          wolfPackData={gameState.wolfPackData}
          wolfChatMessages={gameState.wolfChatMessages}
          onWolfSelectTarget={(targetId) => {
            socket.emit('wolf_select_target', {
              roomCode: gameState.code,
              wolfId: gameState.myPlayerId,
              targetId
            });
          }}
          onSendWolfChat={(text) => {
            socket.emit('send_wolf_chat', {
              roomCode: gameState.code,
              wolfId: gameState.myPlayerId,
              text
            });
          }}
          onSubmitNightAction={handleSubmitNightAction}
        />
      )}

      {gameState && gameState.phase === 'MORNING' && (
        <MorningPhase
          nightReport={gameState.nightReport}
          whisperReceived={gameState.whisperReceived}
          haunted={gameState.haunted}
          timer={gameState.timer}
        />
      )}

      {/* Hunter Shot Revenge Phase Modal */}
      {gameState && (gameState.phase === 'HUNTER_SHOT' || gameState.hunterReport) && (
        <HunterShotModal
          hunterData={gameState.hunterData}
          hunterReport={gameState.hunterReport}
          myPlayerId={gameState.myPlayerId}
          players={gameState.players}
          timer={gameState.timer}
          onShoot={handleHunterShot}
        />
      )}

      {gameState && gameState.phase === 'DISCUSSION' && (
        <DiscussionPhase
          dayNumber={gameState.dayNumber}
          timer={gameState.timer}
          players={enrichedPlayers}
          myPlayerId={gameState.myPlayerId}
          isHost={gameState.isHost}
          isAlive={gameState.isAlive}
          chatMessages={chatMessages}
          onSendMessage={handleSendMessage}
          onSkipDiscussion={handleSkipDiscussion}
        />
      )}

      {gameState && (gameState.phase === 'VOTING' || gameState.phase === 'VOTE_RESULT') && (
        <VotingPhase
          phase={gameState.phase}
          timer={gameState.timer}
          players={enrichedPlayers}
          myPlayerId={gameState.myPlayerId}
          isAlive={gameState.isAlive}
          voteResults={gameState.voteResults}
          onSubmitVote={handleSubmitVote}
        />
      )}

      {gameState && gameState.phase === 'GAME_OVER' && (
        <GameOverModal
          winner={gameState.winner}
          players={enrichedPlayers}
          isHost={gameState.isHost}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Global Room Settings & Visual Effects Tester Modal */}
      {gameState && (
        <RoomSettingsModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          isHost={gameState.isHost}
          playerCount={gameState.players?.length || 0}
          settings={gameState.settings}
          selectedSpecialRoles={gameState.selectedSpecialRoles}
          onSaveSettings={handleUpdateSettings}
          onTriggerEvent={(evt) => setActiveEvent(evt)}
          onTriggerTransition={(phase) => setTransitioningPhase(phase)}
        />
      )}
    </div>
    </>
  );
}
