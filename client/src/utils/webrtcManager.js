// WebRTC Mesh Manager for Nightfall Voice Chat
// Supports P2P Audio, VAD (Voice Activity Detection), and Phase-based Audio Gating

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

class WebRTCManager {
  constructor() {
    this.socket = null;
    this.roomCode = null;
    this.playerId = null;
    this.localStream = null;
    this.peers = new Map(); // socketId -> { peerConnection, audioElem, playerId, isAlive }
    this.audioContext = null;
    this.analyser = null;
    this.vadInterval = null;

    // Local State
    this.isMuted = false;
    this.isDeafened = false;
    this.isSpeaking = false;
    this.micAllowed = false;
    this.isNightSilence = false;
    this.currentPhase = 'LOBBY';
    this.isAlive = true;
    this.channelName = 'VILLAGE'; // 'VILLAGE', 'NIGHT_SILENCE', 'GHOST_REALM'

    // Callbacks
    this.onStatusChange = null;
    this.onPeerStatusChange = null;
    this.statusListeners = new Set();
  }

  getStatus() {
    return {
      micAllowed: this.micAllowed,
      isMuted: this.isMuted,
      isDeafened: this.isDeafened,
      isSpeaking: this.isSpeaking,
      isNightSilence: this.isNightSilence,
      channelName: this.channelName,
      currentPhase: this.currentPhase
    };
  }

  subscribeStatus(fn) {
    this.statusListeners.add(fn);
    fn(this.getStatus());
    return () => this.statusListeners.delete(fn);
  }

  init(socket, roomCode, playerId, onStatusChange, onPeerStatusChange) {
    this.socket = socket;
    this.roomCode = roomCode;
    this.playerId = playerId;
    if (onStatusChange) this.onStatusChange = onStatusChange;
    if (onPeerStatusChange) this.onPeerStatusChange = onPeerStatusChange;

    this.setupSocketListeners();
  }

  setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('voice_all_peers', async ({ peers }) => {
      // Connect to each existing peer by creating an offer
      for (const peer of peers) {
        if (peer.socketId === this.socket.id) continue;
        await this.createPeerConnection(peer.socketId, peer.playerId, true);
      }
    });

    this.socket.on('voice_peer_joined', async ({ socketId, playerId }) => {
      // Incoming new peer, prepare connection without initiating offer (other peer will initiate)
      if (socketId === this.socket.id) return;
      await this.createPeerConnection(socketId, playerId, false);
    });

    this.socket.on('voice_signal', async ({ fromSocketId, signal }) => {
      const peerData = this.peers.get(fromSocketId);
      if (!peerData) return;
      const pc = peerData.peerConnection;

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          this.socket.emit('voice_signal', {
            toSocketId: fromSocketId,
            signal: answer
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.warn('WebRTC signal error:', err);
      }
    });

    this.socket.on('voice_player_status', ({ socketId, playerId, isMuted, isDeafened, isSpeaking }) => {
      if (this.onPeerStatusChange) {
        this.onPeerStatusChange(playerId, { isMuted, isDeafened, isSpeaking });
      }
    });

    this.socket.on('voice_peer_left', ({ socketId, playerId }) => {
      this.removePeer(socketId);
      if (this.onPeerStatusChange) {
        this.onPeerStatusChange(playerId, { isMuted: true, isDeafened: false, isSpeaking: false });
      }
    });
  }

  async startMicrophone() {
    if (this.localStream) return true;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch (err) {
      console.warn('Microphone permission denied or unavailable, attempting synthetic audio stream fallback:', err);
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const dst = ctx.createMediaStreamDestination();
          this.localStream = dst.stream;
        }
      } catch (fallbackErr) {
        console.warn('Synthetic audio stream fallback failed:', fallbackErr);
      }
    }

    if (this.localStream) {
      this.micAllowed = true;
      this.isMuted = false;

      // Setup VAD (Voice Activity Detection)
      this.setupVAD(this.localStream);

      // Join Voice Room via Signaling
      if (this.socket && this.roomCode) {
        this.socket.emit('voice_join', {
          roomCode: this.roomCode,
          playerId: this.playerId
        });
      }

      this.emitStatus();
      return true;
    } else {
      this.micAllowed = false;
      this.emitStatus();
      return false;
    }
  }

  setupVAD(stream) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let speakingCounter = 0;

      this.vadInterval = setInterval(() => {
        if (!this.analyser || this.isMuted || this.isNightSilence) {
          if (this.isSpeaking) {
            this.setSpeaking(false);
          }
          return;
        }

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for speaking
        if (average > 18) {
          speakingCounter = Math.min(speakingCounter + 1, 5);
        } else {
          speakingCounter = Math.max(speakingCounter - 1, 0);
        }

        const currentlySpeaking = speakingCounter >= 2;
        if (currentlySpeaking !== this.isSpeaking) {
          this.setSpeaking(currentlySpeaking);
        }
      }, 100);
    } catch (e) {
      console.warn('VAD setup warning:', e);
    }
  }

  setSpeaking(speaking) {
    this.isSpeaking = speaking;
    if (this.socket && this.roomCode) {
      this.socket.emit('voice_status_update', {
        roomCode: this.roomCode,
        playerId: this.playerId,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
        isSpeaking: this.isSpeaking
      });
    }
    this.emitStatus();
  }

  async createPeerConnection(remoteSocketId, remotePlayerId, isInitiator) {
    if (this.peers.has(remoteSocketId)) {
      return this.peers.get(remoteSocketId).peerConnection;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    const audioElem = new Audio();
    audioElem.autoplay = true;

    this.peers.set(remoteSocketId, {
      peerConnection: pc,
      audioElem,
      playerId: remotePlayerId,
      isAlive: true
    });

    // Add local tracks if available
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle incoming remote audio track
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        audioElem.srcObject = event.streams[0];
        this.applyAudioGating();
      }
    };

    // Send ICE candidates to remote peer via signaling
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('voice_signal', {
          toSocketId: remoteSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket.emit('voice_signal', {
          toSocketId: remoteSocketId,
          signal: offer
        });
      } catch (err) {
        console.warn('Error creating offer for peer:', remoteSocketId, err);
      }
    }

    return pc;
  }

  removePeer(socketId) {
    const peerData = this.peers.get(socketId);
    if (peerData) {
      try {
        peerData.peerConnection.close();
        if (peerData.audioElem) {
          peerData.audioElem.srcObject = null;
        }
      } catch (e) {
        // ignore
      }
      this.peers.delete(socketId);
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
  }

  setMute(muted) {
    this.isMuted = muted;
    this.updateTrackState();
    this.emitStatus();

    if (this.socket && this.roomCode) {
      this.socket.emit('voice_status_update', {
        roomCode: this.roomCode,
        playerId: this.playerId,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
        isSpeaking: false
      });
    }
  }

  toggleDeafen() {
    this.setDeafen(!this.isDeafened);
  }

  setDeafen(deafened) {
    this.isDeafened = deafened;
    // If deafened, also mute microphone
    if (this.isDeafened) {
      this.setMute(true);
    }

    this.applyAudioGating();
    this.emitStatus();

    if (this.socket && this.roomCode) {
      this.socket.emit('voice_status_update', {
        roomCode: this.roomCode,
        playerId: this.playerId,
        isMuted: this.isMuted,
        isDeafened: this.isDeafened,
        isSpeaking: false
      });
    }
  }

  // Gating based on Werewolf game phases
  updatePhase(phase, isAlive, playersList = []) {
    this.currentPhase = phase;
    this.isAlive = isAlive;

    // Update peer living state
    if (Array.isArray(playersList)) {
      this.peers.forEach(peerData => {
        const playerInfo = playersList.find(p => p.id === peerData.playerId);
        if (playerInfo) {
          peerData.isAlive = playerInfo.isAlive;
        }
      });
    }

    // 1. NIGHT Phase: Complete silence
    if (phase === 'NIGHT' || phase === 'ROLE_REVEAL') {
      this.isNightSilence = true;
      this.channelName = 'NIGHT_SILENCE';
    } else {
      this.isNightSilence = false;
      this.channelName = isAlive ? 'VILLAGE' : 'GHOST_REALM';
    }

    this.updateTrackState();
    this.applyAudioGating();
    this.emitStatus();
  }

  updateTrackState() {
    if (!this.localStream) return;
    const shouldTransmit = !this.isMuted && !this.isNightSilence;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = shouldTransmit;
    });
  }

  applyAudioGating() {
    // If user is deafened, mute all incoming audio
    this.peers.forEach(peerData => {
      if (!peerData.audioElem) return;

      if (this.isDeafened) {
        peerData.audioElem.muted = true;
        return;
      }

      // During NIGHT silence, mute everything
      if (this.isNightSilence) {
        peerData.audioElem.muted = true;
        return;
      }

      // If current user is alive: can only hear other alive players (ghosts are muted)
      if (this.isAlive) {
        peerData.audioElem.muted = !peerData.isAlive;
      } else {
        // Ghost: can hear EVERYONE (both living and dead players)
        // Ghosts listen to village discussions + ghost realm conversations
        peerData.audioElem.muted = false;
      }
    });
  }

  emitStatus() {
    const status = this.getStatus();
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (err) {
        console.error('Error in statusListener:', err);
      }
    });
  }

  destroy() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    this.peers.forEach(peerData => {
      try {
        peerData.peerConnection.close();
        if (peerData.audioElem) peerData.audioElem.srcObject = null;
      } catch (e) {}
    });
    this.peers.clear();

    if (this.socket && this.roomCode) {
      this.socket.emit('voice_leave', {
        roomCode: this.roomCode,
        playerId: this.playerId
      });
    }
  }
}

export const webrtcManager = new WebRTCManager();
