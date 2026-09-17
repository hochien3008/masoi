import { ROLES, getRoleDeck } from './roles.js';

const MAX_PLAYERS = 16;

const BOT_NAMES = [
  'Thợ Săn Hắc Ám',
  'Cô Bé Quàng Khăn Đỏ',
  'Trưởng Làng Nam',
  'Bà Lão Tiên Tri',
  'Chàng Tiều Phu',
  'Hiệp Sĩ Ánh Trăng',
  'Gã Thợ Rèn',
  'Bác Nông Dân',
  'Phù Thủy Áo Tím',
  'Lãnh Chúa Rừng Sâu',
  'Tiểu Thư Đài Các',
  'Thương Gia Tinh Ranh',
  'Kẻ Du Mục',
  'Tu Sĩ Trầm Lặng',
  'Thợ Kim Hoàn',
  'Nữ Bá Tước',
  'Thợ Dệt Vải',
  'Thầy Thuốc Trẻ',
  'Chiêm Tinh Gia',
  'Kẻ Gác Đêm',
  'Người Đưa Đò',
  'Thầy Đồ Già'
];

const BOT_AVATARS = ['🧙‍♂️', '🧝‍♀️', '🧔', '👩‍🌾', '🥷', '🕵️‍♂️', '🧕', '🤴', '🧙‍♀️', '🧑‍🔬', '🧝‍♂️', '👸', '👳‍♂️', '👩‍🎤', '🧑‍🌾', '🧛‍♂️'];

export class Room {
  constructor(code, hostSocketId, hostName) {
    this.code = code;
    this.hostSocketId = hostSocketId;
    this.players = [];
    this.phase = 'LOBBY'; // LOBBY, ROLE_REVEAL, NIGHT, MORNING, DISCUSSION, VOTING, VOTE_RESULT, GAME_OVER
    this.dayNumber = 1;
    this.timer = 0;
    this.timerInterval = null;
    this.nightReport = null;
    this.voteResults = null;
    this.winner = null;
    this.chatMessages = [];
    this.io = null;
    this.selectedSpecialRoles = ['SEER', 'DOCTOR'];

    // Add host as first player
    this.addPlayer(hostSocketId, hostName, true);
  }

  updateSelectedRoles(roles) {
    if (this.phase !== 'LOBBY') return;
    if (Array.isArray(roles)) {
      this.selectedSpecialRoles = roles;
      this.broadcastState();
    }
  }

  setIO(io) {
    this.io = io;
  }

  addPlayer(socketId, name, isHost = false, isBot = false) {
    if (this.players.length >= MAX_PLAYERS) return null;
    if (!isBot && socketId) {
      const existing = this.players.find(p => p.socketId === socketId);
      if (existing) {
        existing.name = name;
        return existing;
      }
    }

    const avatarIndex = this.players.length % BOT_AVATARS.length;
    const botId = 'bot_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const player = {
      id: isBot ? botId : socketId,
      socketId: isBot ? null : socketId,
      name: name || `Người chơi ${this.players.length + 1}`,
      avatar: BOT_AVATARS[avatarIndex],
      isHost,
      isBot,
      role: null,
      isAlive: true,
      isReady: false,
      nightAction: null, // target player id
      vote: null, // target player id or 'SKIP'
      seerInspectionResult: null, // stored result of investigation
      whisperReceived: null, // ghost whisper text for morning
      hauntVotes: 0, // ghost haunt penalty
      blessShield: 0 // ghost bless protection
    };

    this.players.push(player);
    return player;
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      const removed = this.players.splice(index, 1)[0];
      if (removed.isHost && this.players.length > 0) {
        // Transfer host to first human player if available, else first player
        const newHost = this.players.find(p => !p.isBot) || this.players[0];
        newHost.isHost = true;
        this.hostSocketId = newHost.socketId;
      }
      return removed;
    }
    return null;
  }

  addBot() {
    if (this.players.length >= MAX_PLAYERS) return false;
    const usedNames = this.players.map(p => p.name);
    const availableNames = BOT_NAMES.filter(n => !usedNames.includes(n));
    const botName = availableNames[0] || `Bot ${this.players.length + 1}`;
    const bot = this.addPlayer(null, botName, false, true);
    return bot;
  }

  removeBot(botId) {
    const index = this.players.findIndex(p => p.id === botId && p.isBot);
    if (index !== -1) {
      this.players.splice(index, 1);
      return true;
    }
    return false;
  }

  // --- GAME FLOW METHODS ---

  startGame() {
    if (this.players.length < 4) return { success: false, message: 'Cần ít nhất 4 người chơi để bắt đầu!' };
    
    // Assign roles randomly with configured special roles and guaranteed Villagers
    const deck = getRoleDeck(this.players.length, this.selectedSpecialRoles);
    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.players.forEach((p, idx) => {
      p.role = deck[idx];
      p.isAlive = true;
      p.isReady = false;
      p.nightAction = null;
      p.vote = null;
      p.seerInspectionResult = null;
      p.whisperReceived = null;
      p.witchPotions = { save: true, poison: true };
      p.hunterShotUsed = false;
      p.haunted = false;
      p.hauntVotes = 0;
      p.blessShield = 0;
    });

    this.phase = 'ROLE_REVEAL';
    this.dayNumber = 1;
    this.nightReport = null;
    this.voteResults = null;
    this.winner = null;
    this.hunterData = null;
    this.hunterReport = null;

    this.startTimer(20, () => {
      // If timer runs out, automatically proceed to Night
      this.startNight();
    });

    this.broadcastState();
    this.handleBotRoleReveal();
    return { success: true };
  }

  handlePlayerReady(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    player.isReady = true;

    // Check if all players (humans and bots) are ready
    if (this.players.every(p => p.isReady)) {
      this.clearTimer();
      this.startNight();
    } else {
      this.broadcastState();
    }
  }

  handleBotRoleReveal() {
    // Bots ready up after 1.5s
    setTimeout(() => {
      this.players.filter(p => p.isBot).forEach(b => {
        b.isReady = true;
      });
      if (this.phase === 'ROLE_REVEAL' && this.players.every(p => p.isReady)) {
        this.clearTimer();
        this.startNight();
      } else {
        this.broadcastState();
      }
    }, 1500);
  }

  startNight() {
    this.phase = 'NIGHT';
    this.players.forEach(p => {
      p.nightAction = null;
      p.whisperReceived = null;
      p.haunted = false;
      p.hauntVotes = 0;
      p.blessShield = 0;
    });

    // 30 seconds for night actions
    this.startTimer(30, () => {
      this.resolveNight();
    });

    this.broadcastState();
    this.handleBotNightActions();
  }

  getPendingWolfTarget() {
    const wolves = this.players.filter(p => p.isAlive && p.role === 'WEREWOLF');
    const wolfVotes = {};
    wolves.forEach(w => {
      if (w.nightAction) {
        wolfVotes[w.nightAction] = (wolfVotes[w.nightAction] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let targetId = null;
    for (const [tId, count] of Object.entries(wolfVotes)) {
      if (count > maxVotes) {
        maxVotes = count;
        targetId = tId;
      }
    }

    if (targetId) {
      const target = this.players.find(p => p.id === targetId && p.isAlive);
      if (target) {
        return { id: target.id, name: target.name };
      }
    }
    return null;
  }

  submitNightAction(playerId, actionPayload) {
    if (this.phase !== 'NIGHT') return;
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;

    if (player.isAlive) {
      if (player.role === 'WEREWOLF' || player.role === 'DOCTOR' || player.role === 'SEER') {
        player.nightAction = typeof actionPayload === 'object' ? actionPayload?.targetId : actionPayload;

        if (player.role === 'SEER' && player.nightAction) {
          const target = this.players.find(p => p.id === player.nightAction);
          if (target) {
            const isWolf = target.role === 'WEREWOLF';
            player.seerInspectionResult = {
              targetId: target.id,
              targetName: target.name,
              targetRole: target.role,
              isWolf,
              message: isWolf ? `🐺 ${target.name} là MA SÓI!` : `👨 ${target.name} thuộc Phe Dân Làng.`
            };
          }
        }
      } else if (player.role === 'WITCH') {
        // Witch payload: { save: boolean, poisonTargetId: string | null }
        player.nightAction = actionPayload;
      }
    } else {
      // Ghost action: { targetId, actionType: 'WHISPER' | 'HAUNT' | 'BLESS' } or single targetId
      player.nightAction = actionPayload;
    }

    this.checkNightActionCompletion();
  }

  checkNightActionCompletion() {
    // Active living roles who must act
    const activeAliveRoles = this.players.filter(p => {
      if (!p.isAlive) return false;
      if (p.role === 'WEREWOLF' || p.role === 'DOCTOR' || p.role === 'SEER') return true;
      if (p.role === 'WITCH') {
        return (p.witchPotions?.save || p.witchPotions?.poison);
      }
      return false;
    });

    const allActiveDone = activeAliveRoles.every(p => p.nightAction !== null);

    if (allActiveDone) {
      // Small delay for natural suspense
      setTimeout(() => {
        if (this.phase === 'NIGHT') {
          this.clearTimer();
          this.resolveNight();
        }
      }, 1200);
    } else {
      this.broadcastState();
    }
  }

  handleBotNightActions() {
    setTimeout(() => {
      if (this.phase !== 'NIGHT') return;

      const alivePlayers = this.players.filter(p => p.isAlive);
      const aliveNonWolves = alivePlayers.filter(p => p.role !== 'WEREWOLF');

      this.players.filter(p => p.isBot).forEach(bot => {
        if (bot.isAlive) {
          if (bot.role === 'WEREWOLF') {
            const targets = aliveNonWolves.length > 0 ? aliveNonWolves : alivePlayers.filter(p => p.id !== bot.id);
            if (targets.length > 0) {
              const target = targets[Math.floor(Math.random() * targets.length)];
              bot.nightAction = target.id;
            }
          } else if (bot.role === 'DOCTOR') {
            const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            if (target) bot.nightAction = target.id;
          } else if (bot.role === 'SEER') {
            const targets = alivePlayers.filter(p => p.id !== bot.id);
            if (targets.length > 0) {
              const target = targets[Math.floor(Math.random() * targets.length)];
              bot.nightAction = target.id;
            }
          } else if (bot.role === 'WITCH') {
            const canSave = bot.witchPotions?.save;
            const canPoison = bot.witchPotions?.poison;
            const wolfTarget = this.getPendingWolfTarget();
            
            let useSave = false;
            let poisonTarget = null;

            if (canSave && wolfTarget && Math.random() < 0.65) {
              useSave = true;
            }

            if (canPoison && this.dayNumber >= 2 && Math.random() < 0.3) {
              const targets = alivePlayers.filter(p => p.id !== bot.id && p.id !== wolfTarget?.id);
              if (targets.length > 0) {
                poisonTarget = targets[Math.floor(Math.random() * targets.length)].id;
              }
            }

            bot.nightAction = { save: useSave, poisonTargetId: poisonTarget };
          }
        } else {
          // Bot Ghost
          if (alivePlayers.length > 0) {
            const target = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
            const types = ['WHISPER', 'HAUNT', 'BLESS'];
            const actionType = types[Math.floor(Math.random() * types.length)];
            bot.nightAction = { targetId: target.id, actionType };
          }
        }
      });

      this.checkNightActionCompletion();
    }, 2500);
  }

  resolveNight() {
    this.phase = 'MORNING';

    // 1. Resolve Wolf target
    const wolfTarget = this.getPendingWolfTarget();
    const wolfTargetId = wolfTarget ? wolfTarget.id : null;

    // 2. Resolve Doctor protection
    const doctors = this.players.filter(p => p.isAlive && p.role === 'DOCTOR');
    const doctorTargetId = doctors.length > 0 ? doctors[0].nightAction : null;

    // 3. Resolve Witch actions
    const witch = this.players.find(p => p.isAlive && p.role === 'WITCH');
    let witchSaved = false;
    let witchPoisonTargetId = null;

    if (witch && witch.nightAction) {
      const action = witch.nightAction;
      if (witch.witchPotions?.save && action.save) {
        witchSaved = true;
        witch.witchPotions.save = false;
      }
      if (witch.witchPotions?.poison && action.poisonTargetId) {
        witchPoisonTargetId = action.poisonTargetId;
        witch.witchPotions.poison = false;
      }
    }

    // 4. Resolve Ghost Whispers, Haunts, and Blessings (Concrete Gameplay Impact!)
    const ghosts = this.players.filter(p => !p.isAlive);
    ghosts.forEach(g => {
      if (g.nightAction) {
        const targetId = typeof g.nightAction === 'object' ? g.nightAction.targetId : g.nightAction;
        const actionType = typeof g.nightAction === 'object' ? g.nightAction.actionType : 'WHISPER';
        const target = this.players.find(p => p.id === targetId && p.isAlive);
        if (target) {
          if (actionType === 'HAUNT') {
            target.hauntVotes = (target.hauntVotes || 0) + 1;
            target.haunted = true;
            target.whisperReceived = '🕯️ Một Linh Hồn ma quái đã Ám Ảnh bạn đêm qua! Tinh thần hoảng loạn, bạn sẽ nhận sẵn +1 PHIẾU NGHI NGỜ khi biểu quyết chiều nay!';
          } else if (actionType === 'BLESS') {
            target.blessShield = (target.blessShield || 0) + 1;
            target.whisperReceived = '✨ Một Linh Hồn nhân từ đã Ban Phước cho bạn! Một khiên tâm linh hộ mệnh sẽ GIẢM 1 PHIẾU BẦU PHẠT khi biểu quyết chiều nay!';
          } else {
            const whispers = [
              '👻 Lời thì thầm từ cõi chết: "Hãy cẩn trọng... trong bóng tối có kẻ đang ngụy trang rất khéo!"',
              '👻 Lời thì thầm từ cõi chết: "Đừng vội tin lời ngon ngọt, hãy nhìn vào hành động bỏ phiếu!"',
              '👻 Lời thì thầm từ cõi chết: "Bầy sói đang ẩn mình giữa những người nói ít nhất..."'
            ];
            target.whisperReceived = whispers[Math.floor(Math.random() * whispers.length)];
          }
        }
      }
    });

    // 5. Calculate Deaths
    const nightVictims = [];

    if (wolfTargetId) {
      const savedByDoctor = (wolfTargetId === doctorTargetId);
      const saved = savedByDoctor || witchSaved;
      if (!saved) {
        const victim = this.players.find(p => p.id === wolfTargetId && p.isAlive);
        if (victim) {
          victim.isAlive = false;
          nightVictims.push({ victim, reason: 'WOLF' });
        }
      }
    }

    if (witchPoisonTargetId) {
      const poisonVictim = this.players.find(p => p.id === witchPoisonTargetId && p.isAlive);
      if (poisonVictim) {
        poisonVictim.isAlive = false;
        nightVictims.push({ victim: poisonVictim, reason: 'POISON' });
      }
    }

    // Formulate Morning Bulletin
    let morningMessage = '';
    if (nightVictims.length === 0) {
      if (wolfTargetId && (wolfTargetId === doctorTargetId || witchSaved)) {
        morningMessage = '☀️ Đêm qua ai đó đã bị tấn công... Nhưng đã được cứu sống kịp thời! Không có ai ngã xuống.';
      } else {
        morningMessage = '🌙 Đêm qua một đêm tĩnh lặng trôi qua, không có ai ngã xuống.';
      }
    } else if (nightVictims.length === 1) {
      const v = nightVictims[0].victim;
      const r = ROLES[v.role]?.name || v.role;
      morningMessage = `💀 ${v.name} (${r}) đã ngã xuống trong đêm qua!`;
    } else {
      const names = nightVictims.map(v => `${v.victim.name} (${ROLES[v.victim.role]?.name || v.victim.role})`).join(' và ');
      morningMessage = `💀 Một đêm đẫm máu! Cả ${names} đều đã bị sát hại trong đêm tối!`;
    }

    this.nightReport = {
      survived: nightVictims.length === 0,
      victims: nightVictims.map(v => ({ id: v.victim.id, name: v.victim.name, role: v.victim.role })),
      message: morningMessage
    };

    // Check if Hunter died tonight
    const deadHunter = nightVictims.find(v => v.victim.role === 'HUNTER' && !v.victim.hunterShotUsed);
    if (deadHunter) {
      this.triggerHunterShot(deadHunter.victim, 'MORNING');
      return;
    }

    // Check Win Condition
    const winResult = this.checkWinCondition();
    if (winResult) {
      this.winner = winResult;
      this.broadcastState();
      setTimeout(() => {
        this.endGame(winResult);
      }, 5000);
      return;
    }

    // Show Morning bulletin for 8 seconds, then Discussion
    this.startTimer(8, () => {
      this.startDiscussion();
    });

    this.broadcastState();
  }

  startDiscussion() {
    this.phase = 'DISCUSSION';
    // 90 seconds discussion timer (Host can skip early)
    this.startTimer(90, () => {
      this.startVoting();
    });

    this.broadcastState();
    this.handleBotDiscussionMessages();
  }

  skipDiscussion() {
    if (this.phase === 'DISCUSSION') {
      this.clearTimer();
      this.startVoting();
    }
  }

  handleBotDiscussionMessages() {
    const chatSamples = [
      'Đêm qua ai có biểu hiện gì lạ không?',
      'Tôi là dân làng chân chính nhé!',
      'Tiên tri đã soi được ai chưa lên tiếng đi!',
      'Mọi người nghi ai nhất?',
      'Tôi thấy có người im lặng đáng ngờ lắm...'
    ];

    setTimeout(() => {
      if (this.phase !== 'DISCUSSION') return;
      const aliveBots = this.players.filter(p => p.isBot && p.isAlive);
      if (aliveBots.length > 0 && Math.random() > 0.4) {
        const bot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
        const text = chatSamples[Math.floor(Math.random() * chatSamples.length)];
        this.addChatMessage(bot.id, bot.name, text, false);
      }
    }, 4000);
  }

  startVoting() {
    this.phase = 'VOTING';
    this.players.forEach(p => {
      p.vote = null;
    });

    // 40 seconds voting timer
    this.startTimer(40, () => {
      this.resolveVoting();
    });

    this.broadcastState();
    this.handleBotVotes();
  }

  submitVote(voterId, targetId) {
    if (this.phase !== 'VOTING') return;
    const voter = this.players.find(p => p.id === voterId);
    if (!voter || !voter.isAlive) return; // Ghosts cannot vote

    voter.vote = targetId; // targetId can be a playerId or 'SKIP'

    // Check if all alive players have voted
    const alivePlayers = this.players.filter(p => p.isAlive);
    const allVoted = alivePlayers.every(p => p.vote !== null);

    if (allVoted) {
      setTimeout(() => {
        if (this.phase === 'VOTING') {
          this.clearTimer();
          this.resolveVoting();
        }
      }, 1000);
    } else {
      this.broadcastState();
    }
  }

  handleBotVotes() {
    setTimeout(() => {
      if (this.phase !== 'VOTING') return;
      const alivePlayers = this.players.filter(p => p.isAlive);
      const aliveBots = alivePlayers.filter(p => p.isBot);

      aliveBots.forEach(bot => {
        const options = alivePlayers.filter(p => p.id !== bot.id);
        if (Math.random() < 0.15 || options.length === 0) {
          bot.vote = 'SKIP';
        } else {
          const target = options[Math.floor(Math.random() * options.length)];
          bot.vote = target.id;
        }
      });

      const allVoted = alivePlayers.every(p => p.vote !== null);
      if (allVoted) {
        this.clearTimer();
        this.resolveVoting();
      } else {
        this.broadcastState();
      }
    }, 3000);
  }

  resolveVoting() {
    this.phase = 'VOTE_RESULT';

    const rawVoteCounts = {};
    let skipCount = 0;
    const alivePlayers = this.players.filter(p => p.isAlive);

    alivePlayers.forEach(p => {
      if (p.vote === 'SKIP') {
        skipCount++;
      } else if (p.vote) {
        rawVoteCounts[p.vote] = (rawVoteCounts[p.vote] || 0) + 1;
      }
    });

    // Apply Ghost Modifiers (Haunt: +votes, Bless: -votes shield)
    const voteCounts = {};
    const ghostModifiers = {};
    alivePlayers.forEach(p => {
      const raw = rawVoteCounts[p.id] || 0;
      const haunt = p.hauntVotes || 0;
      const shield = p.blessShield || 0;
      const finalCount = Math.max(0, raw + haunt - shield);
      if (finalCount > 0 || raw > 0 || haunt > 0) {
        voteCounts[p.id] = finalCount;
      }
      if (haunt > 0 || shield > 0) {
        ghostModifiers[p.id] = { haunt, shield, raw, final: finalCount };
      }
    });

    let highestVote = 0;
    let candidates = [];
    for (const [targetId, count] of Object.entries(voteCounts)) {
      if (count > highestVote) {
        highestVote = count;
        candidates = [targetId];
      } else if (count === highestVote) {
        candidates.push(targetId);
      }
    }

    let eliminatedPlayer = null;
    let message = '';

    if (highestVote > skipCount && candidates.length === 1) {
      eliminatedPlayer = this.players.find(p => p.id === candidates[0]);
      if (eliminatedPlayer) {
        eliminatedPlayer.isAlive = false;
        const roleInfo = ROLES[eliminatedPlayer.role] || { name: eliminatedPlayer.role, icon: '❓' };
        const gm = ghostModifiers[eliminatedPlayer.id];
        let ghostImpactText = '';
        if (gm && gm.haunt > 0) {
          ghostImpactText = ` (Có tác động bởi lời nguyền Ám Ảnh +${gm.haunt} phiếu của Linh Hồn!)`;
        }
        message = `⚖️ ${eliminatedPlayer.name} (${roleInfo.icon} ${roleInfo.name}) đã bị dân làng bỏ phiếu treo cổ!${ghostImpactText}`;
      }
    } else {
      // Check if someone was saved by ghost bless shield
      const savedByBless = alivePlayers.find(p => {
        const raw = rawVoteCounts[p.id] || 0;
        const final = voteCounts[p.id] || 0;
        return (p.blessShield > 0) && raw > final && raw > skipCount;
      });
      if (savedByBless) {
        message = `✨ Khiên Hộ Mệnh của Linh Hồn đã giảm bớt phiếu bầu và cứu ${savedByBless.name} thoát chết trong gang tấc!`;
      } else {
        message = '⚖️ Không ai bị treo cổ trong ngày hôm nay do số phiếu hòa hoặc quá nửa bỏ phiếu trắng.';
      }
    }

    this.voteResults = {
      voteCounts,
      rawVoteCounts,
      ghostModifiers,
      skipCount,
      eliminatedId: eliminatedPlayer ? eliminatedPlayer.id : null,
      eliminatedName: eliminatedPlayer ? eliminatedPlayer.name : null,
      eliminatedRole: eliminatedPlayer ? eliminatedPlayer.role : null,
      message
    };

    // If eliminated player is FOOL, FOOL WINS!
    if (eliminatedPlayer && eliminatedPlayer.role === 'FOOL') {
      this.winner = 'FOOL';
      this.broadcastState();
      setTimeout(() => {
        this.endGame('FOOL');
      }, 6000);
      return;
    }

    // If eliminated player is HUNTER, trigger Hunter revenge before Night!
    if (eliminatedPlayer && eliminatedPlayer.role === 'HUNTER' && !eliminatedPlayer.hunterShotUsed) {
      this.startTimer(6, () => {
        this.triggerHunterShot(eliminatedPlayer, 'NIGHT');
      });
      this.broadcastState();
      return;
    }

    // Check Win Condition
    const winResult = this.checkWinCondition();
    if (winResult) {
      this.winner = winResult;
      this.broadcastState();
      setTimeout(() => {
        this.endGame(winResult);
      }, 6000);
      return;
    }

    // Display vote result for 7 seconds, then transition to next Night
    this.startTimer(7, () => {
      this.dayNumber++;
      this.startNight();
    });

    this.broadcastState();
  }

  triggerHunterShot(hunter, nextPhaseAfterHunter) {
    hunter.hunterShotUsed = true;
    this.phase = 'HUNTER_SHOT';
    this.hunterData = {
      hunterId: hunter.id,
      hunterName: hunter.name,
      nextPhase: nextPhaseAfterHunter
    };

    // 15 seconds for Hunter to fire their final shot
    this.startTimer(15, () => {
      this.resolveHunterShot(null);
    });

    this.broadcastState();

    // If bot Hunter, automatically pick someone after 2.5s
    if (hunter.isBot) {
      setTimeout(() => {
        if (this.phase !== 'HUNTER_SHOT') return;
        const aliveTargets = this.players.filter(p => p.isAlive && p.id !== hunter.id);
        if (aliveTargets.length > 0) {
          const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
          this.resolveHunterShot(target.id);
        } else {
          this.resolveHunterShot(null);
        }
      }, 2500);
    }
  }

  submitHunterShot(hunterId, targetId) {
    if (this.phase !== 'HUNTER_SHOT') return;
    if (!this.hunterData || this.hunterData.hunterId !== hunterId) return;
    this.resolveHunterShot(targetId);
  }

  resolveHunterShot(targetId) {
    this.clearTimer();
    let shotVictim = null;
    if (targetId) {
      shotVictim = this.players.find(p => p.id === targetId && p.isAlive);
      if (shotVictim) {
        shotVictim.isAlive = false;
      }
    }

    const next = this.hunterData ? this.hunterData.nextPhase : 'MORNING';
    const hunterName = this.hunterData ? this.hunterData.hunterName : 'Thợ Săn';

    this.hunterReport = shotVictim ? {
      victimId: shotVictim.id,
      victimName: shotVictim.name,
      victimRole: shotVictim.role,
      message: `🏹 ${hunterName} trước khi ngã xuống đã nổ phát súng bắn hạ ${shotVictim.name} (${ROLES[shotVictim.role]?.name || shotVictim.role})!`
    } : {
      victimId: null,
      message: `🏹 ${hunterName} đã không kịp kéo theo ai trước khi trút hơi thở cuối cùng.`
    };

    // Check Win Condition immediately
    const winResult = this.checkWinCondition();
    if (winResult) {
      this.winner = winResult;
      this.broadcastState();
      setTimeout(() => {
        this.endGame(winResult);
      }, 6000);
      return;
    }

    // Display Hunter report for 6 seconds, then proceed
    this.startTimer(6, () => {
      this.hunterReport = null;
      this.hunterData = null;

      if (next === 'MORNING') {
        this.phase = 'MORNING';
        this.startTimer(8, () => {
          this.startDiscussion();
        });
      } else {
        this.dayNumber++;
        this.startNight();
      }
      this.broadcastState();
    });

    this.broadcastState();
  }

  checkWinCondition() {
    if (this.winner === 'FOOL') return 'FOOL';

    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveWolves = alivePlayers.filter(p => p.role === 'WEREWOLF').length;
    const aliveVillagers = alivePlayers.filter(p => p.role !== 'WEREWOLF').length;

    if (aliveWolves === 0) {
      return 'VILLAGE';
    }
    if (aliveWolves >= aliveVillagers) {
      return 'WEREWOLF';
    }
    return null;
  }

  endGame(winner) {
    this.clearTimer();
    this.phase = 'GAME_OVER';
    this.winner = winner;
    this.broadcastState();
  }

  restartGame() {
    this.startGame();
  }

  playAgain() {
    this.startGame();
  }

  // --- CHAT & MESSAGING ---

  addChatMessage(senderId, senderName, text, isGhost = false) {
    const msg = {
      id: Math.random().toString(36).substring(2, 9),
      senderId,
      senderName,
      text,
      isGhost,
      timestamp: Date.now()
    };
    this.chatMessages.push(msg);
    if (this.chatMessages.length > 50) this.chatMessages.shift();

    if (this.io) {
      this.io.to(this.code).emit('chat_message', msg);
    }
  }

  // --- TIMER UTILITIES ---

  startTimer(seconds, onComplete) {
    this.clearTimer();
    this.timer = seconds;
    this.timerInterval = setInterval(() => {
      this.timer--;
      if (this.timer % 2 === 0 || this.timer <= 5) {
        this.broadcastState();
      }
      if (this.timer <= 0) {
        this.clearTimer();
        if (onComplete) onComplete();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // --- AUTHORITATIVE STATE BROADCASTING ---

  broadcastState() {
    if (!this.io) return;

    this.players.forEach(player => {
      if (player.isBot) return;

      // Filter state so client NEVER learns other living players' roles before GAME_OVER
      const isGameOver = this.phase === 'GAME_OVER';
      const myRole = player.role;

      const sanitizedPlayers = this.players.map(p => {
        const isSelf = p.id === player.id;
        const isFellowWolf = myRole === 'WEREWOLF' && p.role === 'WEREWOLF';
        const isDeadAndRevealed = !p.isAlive && this.phase !== 'LOBBY';

        const canSeeRole = isGameOver || isSelf || isFellowWolf || isDeadAndRevealed;

        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          isHost: p.isHost,
          isBot: p.isBot,
          isAlive: p.isAlive,
          isReady: p.isReady,
          hasVoted: p.vote !== null,
          hasActedNight: p.nightAction !== null,
          hauntVotes: p.hauntVotes || 0,
          blessShield: p.blessShield || 0,
          role: canSeeRole ? p.role : null,
          roleDetails: canSeeRole && p.role ? ROLES[p.role] : null
        };
      });

      const personalState = {
        code: this.code,
        phase: this.phase,
        dayNumber: this.dayNumber,
        timer: this.timer,
        players: sanitizedPlayers,
        myPlayerId: player.id,
        myRole: player.role,
        myRoleDetails: player.role ? ROLES[player.role] : null,
        isAlive: player.isAlive,
        isHost: player.isHost,
        nightReport: this.nightReport,
        voteResults: this.voteResults,
        winner: this.winner,
        seerInspectionResult: player.seerInspectionResult,
        whisperReceived: player.whisperReceived,
        haunted: Boolean(player.haunted),
        hunterData: this.hunterData,
        hunterReport: this.hunterReport,
        witchInfo: player.role === 'WITCH' ? {
          canSave: Boolean(player.witchPotions?.save),
          canPoison: Boolean(player.witchPotions?.poison),
          wolfVictim: this.getPendingWolfTarget()
        } : null,
        selectedSpecialRoles: this.selectedSpecialRoles || ['SEER', 'DOCTOR']
      };

      if (player.socketId) {
        this.io.to(player.socketId).emit('game_state', personalState);
      }
    });
  }
}
