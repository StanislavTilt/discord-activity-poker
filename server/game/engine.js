import { createDeck, shuffleDeck, dealCards } from './deck.js';
import { evaluateHand, compareHands } from './evaluator.js';
import { EventEmitter } from 'events';

export class PokerGame extends EventEmitter {
  constructor(gameId, settings) {
    super();
    this.gameId = gameId;
    this.smallBlind = settings.small_blind || 10;
    this.bigBlind = settings.big_blind || 20;
    this.roundTime = (settings.round_time || 30) * 1000;
    this.startingStack = settings.starting_stack || 1000;
    this.maxPlayers = settings.max_players || 6;

    this.players = [];
    this.deck = [];
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.dealerIndex = -1;
    this.currentPlayerIndex = -1;
    this.phase = 'waiting';
    this.currentBet = 0;
    this.minRaise = 0;
    this.handNumber = 0;
    this.lastAction = null;
    this.timerDelay = 2000;

    // Timer IDs for cleanup
    this.turnTimer = null;
    this.turnDelayTimer = null;
    this.showdownTimer = null;
    this.nextHandTimer = null;

    // Track who has acted this betting round (for BB option)
    this.actedThisRound = new Set();
    this.showdownInProgress = false;

    // Track game timing and eliminations
    this.gameStartedAt = null;
    this.eliminations = [];

    // Full game log
    this.gameLog = {
      hands: [],       // per-hand logs
      currentHand: null // log for current hand being played
    };
  }

  addPlayer(discordId, username, avatarUrl, seat) {
    if (this.players.length >= this.maxPlayers) return false;
    if (this.players.find(p => p.discordId === discordId)) return false;
    this.players.push({
      discordId, username, avatarUrl, seat,
      chips: this.startingStack,
      holeCards: [], bet: 0, totalBet: 0,
      folded: false, allIn: false,
      disconnected: false, sittingOut: false
    });
    this.emit('playerJoined', this.getPublicState());
    return true;
  }

  removePlayer(discordId) {
    // Don't remove during active hand — mark as sitting out
    const player = this.players.find(p => p.discordId === discordId);
    if (player) {
      player.sittingOut = true;
      player.disconnected = true;
      if (['preflop', 'flop', 'turn', 'river'].includes(this.phase)) {
        player.folded = true;
      }
    }
    this.emit('playerLeft', this.getPublicState());
  }

  startGame() {
    if (this.players.length < 2) return false;
    this.phase = 'playing';
    this.gameStartedAt = Date.now();
    this.eliminations = [];
    this.startNewHand();
    return true;
  }

  changeBlinds(newSmallBlind, newBigBlind) {
    const oldSB = this.smallBlind;
    const oldBB = this.bigBlind;
    this.smallBlind = newSmallBlind;
    this.bigBlind = newBigBlind;
    this.minRaise = newBigBlind;

    console.log(`[Engine] Blinds changed: ${oldSB}/${oldBB} → ${newSmallBlind}/${newBigBlind}`);

    this.emit('blindsChanged', {
      oldSmallBlind: oldSB,
      oldBigBlind: oldBB,
      newSmallBlind,
      newBigBlind
    });

    return true;
  }

  startNewHand() {
    this.handNumber++;
    this.deck = shuffleDeck(createDeck());
    this.communityCards = [];
    this.pot = 0;
    this.sidePots = [];
    this.currentBet = 0;
    this.lastAction = null;
    this.actedThisRound = new Set();
    this.showdownInProgress = false;

    // Cancel any pending timers
    this.clearAllTimers();

    const activePlayers = this.players.filter(p => p.chips > 0 && !p.sittingOut);
    if (activePlayers.length < 2) {
      this.phase = 'finished';
      this.currentPlayerIndex = -1;
      this.emitGameOver();
      return;
    }

    for (const p of this.players) {
      p.holeCards = [];
      p.bet = 0;
      p.totalBet = 0;
      p.folded = p.chips <= 0 || p.sittingOut;
      p.allIn = false;
      p.handResult = null;
    }

    // Advance dealer
    this.dealerIndex = this.findNextNotFolded(this.dealerIndex);

    // Deal hole cards
    for (const p of this.players) {
      if (!p.folded) p.holeCards = dealCards(this.deck, 2);
    }

    // Start logging this hand
    this.gameLog.currentHand = {
      handNumber: this.handNumber,
      startedAt: Date.now(),
      players: this.players.filter(p => !p.folded).map(p => ({
        discordId: p.discordId,
        username: p.username,
        startChips: p.chips + p.bet, // chips before blinds
        holeCards: [...p.holeCards]
      })),
      actions: [],
      phases: [],
      communityCards: [],
      winners: [],
      pot: 0
    };

    // Post blinds — heads-up special rules
    const numActive = this.players.filter(p => !p.folded).length;
    let sbIndex, bbIndex;

    if (numActive === 2) {
      // Heads-up: dealer = SB, other = BB
      sbIndex = this.dealerIndex;
      bbIndex = this.findNextNotFolded(this.dealerIndex);
    } else {
      sbIndex = this.findNextNotFolded(this.dealerIndex);
      bbIndex = this.findNextNotFolded(sbIndex);
    }

    this.postBlind(sbIndex, this.smallBlind);
    this.postBlind(bbIndex, this.bigBlind);

    this.currentBet = this.bigBlind;
    this.minRaise = this.bigBlind;
    this.phase = 'preflop';

    // Who can act? (not folded, not all-in, has chips)
    const canAct = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);

    if (canAct.length === 0) {
      // Everyone all-in from blinds
      this.currentPlayerIndex = -1;
      this.emit('newHand', this.getPublicState());
      this.runOutBoard();
      return;
    }

    // First to act preflop
    if (numActive === 2) {
      // Heads-up: SB (dealer) acts first preflop
      this.currentPlayerIndex = sbIndex;
      if (this.players[sbIndex].allIn) {
        // SB went all-in from blind, BB's turn
        this.currentPlayerIndex = this.findNextActive(sbIndex);
      }
    } else {
      // Normal: first to act is player after BB
      this.currentPlayerIndex = this.findNextActive(bbIndex);
    }

    if (this.currentPlayerIndex === -1) {
      this.emit('newHand', this.getPublicState());
      this.runOutBoard();
      return;
    }

    this.emit('newHand', this.getPublicState());
    this.startTurnTimer();
  }

  postBlind(playerIndex, amount) {
    const player = this.players[playerIndex];
    if (!player || player.chips <= 0) return;
    const blindAmount = Math.min(amount, player.chips);
    player.chips -= blindAmount;
    player.bet = blindAmount;
    player.totalBet = blindAmount;
    this.pot += blindAmount;
    if (player.chips <= 0) {
      player.chips = 0;
      player.allIn = true;
    }
  }

  findNextActive(fromIndex) {
    let idx = (fromIndex + 1) % this.players.length;
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[idx].folded && !this.players[idx].allIn && this.players[idx].chips > 0) return idx;
      idx = (idx + 1) % this.players.length;
    }
    return -1;
  }

  findNextNotFolded(fromIndex) {
    let idx = ((fromIndex < 0 ? 0 : fromIndex) + 1) % this.players.length;
    for (let i = 0; i < this.players.length; i++) {
      if (!this.players[idx].folded) return idx;
      idx = (idx + 1) % this.players.length;
    }
    return -1;
  }

  getCurrentPlayer() {
    if (this.currentPlayerIndex < 0 || this.currentPlayerIndex >= this.players.length) return null;
    return this.players[this.currentPlayerIndex];
  }

  handleAction(discordId, action, amount = 0) {
    const player = this.getCurrentPlayer();
    if (!player || player.discordId !== discordId) return { success: false, error: 'Не ваш ход' };
    if (!['preflop', 'flop', 'turn', 'river'].includes(this.phase)) return { success: false, error: 'Сейчас нельзя делать ставки' };

    // Safety: if current player somehow can't act, skip them
    if (player.allIn || player.folded || player.chips <= 0) {
      console.log(`[Engine] SAFETY: current player ${player.username} can't act (allIn=${player.allIn}, folded=${player.folded}, chips=${player.chips}), resolving...`);
      this.resolveAfterAction();
      this.emit('stateChanged', this.getPublicState());
      return { success: false, error: 'Вы не можете ходить' };
    }

    this.clearTurnTimer();
    let result;

    switch (action) {
      case 'fold': result = this.handleFold(player); break;
      case 'check': result = this.handleCheck(player); break;
      case 'call': result = this.handleCall(player); break;
      case 'raise': result = this.handleRaise(player, amount); break;
      case 'allin': result = this.handleAllIn(player); break;
      default: return { success: false, error: 'Неизвестное действие' };
    }

    if (!result.success) return result;

    // Mark this player as having acted this round
    this.actedThisRound.add(discordId);

    this.lastAction = { discordId, action, amount: result.amount || 0 };

    // Log action
    if (this.gameLog.currentHand) {
      this.gameLog.currentHand.actions.push({
        player: player.username,
        discordId,
        action,
        amount: result.amount || 0,
        phase: this.phase,
        timestamp: Date.now()
      });
    }

    // Resolve game state FIRST, then broadcast the final state
    this.resolveAfterAction();

    // Emit action event AFTER resolve so broadcastState sends correct state
    this.emit('stateChanged', this.getPublicState());
    return { success: true };
  }

  handleFold(player) {
    player.folded = true;
    return { success: true };
  }

  handleCheck(player) {
    if (player.bet < this.currentBet) {
      return { success: false, error: 'Нельзя чекнуть, нужно коллировать' };
    }
    return { success: true };
  }

  handleCall(player) {
    const callAmount = Math.min(this.currentBet - player.bet, player.chips);
    if (callAmount <= 0) return { success: false, error: 'Нечего коллировать' };
    player.chips -= callAmount;
    player.bet += callAmount;
    player.totalBet += callAmount;
    this.pot += callAmount;
    if (player.chips <= 0) { player.chips = 0; player.allIn = true; }
    return { success: true, amount: callAmount };
  }

  handleRaise(player, raiseAmount) {
    const totalToCall = this.currentBet - player.bet;
    const totalNeeded = totalToCall + raiseAmount;

    if (raiseAmount < this.minRaise && totalNeeded < player.chips) {
      return { success: false, error: `Минимальный рейз: ${this.minRaise}` };
    }

    const actualAmount = Math.min(totalNeeded, player.chips);
    player.chips -= actualAmount;
    player.bet += actualAmount;
    player.totalBet += actualAmount;
    this.pot += actualAmount;

    if (player.bet > this.currentBet) {
      this.minRaise = player.bet - this.currentBet;
      this.currentBet = player.bet;
      // After a raise, everyone who already acted needs to act again
      this.actedThisRound.clear();
      this.actedThisRound.add(player.discordId);
    }

    if (player.chips <= 0) { player.chips = 0; player.allIn = true; }
    return { success: true, amount: actualAmount };
  }

  handleAllIn(player) {
    const amount = player.chips;
    if (amount <= 0) return { success: false, error: 'Нет фишек' };
    player.chips = 0;
    player.bet += amount;
    player.totalBet += amount;
    this.pot += amount;
    player.allIn = true;

    if (player.bet > this.currentBet) {
      this.minRaise = player.bet - this.currentBet;
      this.currentBet = player.bet;
      // Raise — reset acted
      this.actedThisRound.clear();
      this.actedThisRound.add(player.discordId);
    }

    return { success: true, amount };
  }

  isBettingComplete() {
    const canAct = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);
    if (canAct.length === 0) return true;
    // All must have bet == currentBet AND all must have acted this round
    return canAct.every(p => p.bet >= this.currentBet && this.actedThisRound.has(p.discordId));
  }

  resolveAfterAction() {
    const canActPlayers = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);
    const allInPlayers = this.players.filter(p => !p.folded && p.allIn);
    console.log(`[Engine] resolveAfterAction: canAct=${canActPlayers.length}, allIn=${allInPlayers.length}, phase=${this.phase}, pot=${this.pot}`);

    // 1. Only 1 player not folded? Award pot
    const notFolded = this.players.filter(p => !p.folded);
    if (notFolded.length <= 1) {
      this.currentPlayerIndex = -1;
      if (notFolded.length === 1) this.awardPot([notFolded[0]]);
      return;
    }

    // 2. Who can still make decisions?
    const canAct = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);

    // 3. Nobody can act — everyone is all-in or folded
    if (canAct.length === 0) {
      this.currentPlayerIndex = -1;
      this.runOutBoard();
      return;
    }

    // 4. Betting complete?
    if (this.isBettingComplete()) {
      // If all non-folded players have matched and there are all-in players with no more action possible
      if (canAct.length <= 1 && notFolded.some(p => p.allIn)) {
        this.currentPlayerIndex = -1;
        this.runOutBoard();
      } else {
        this.nextPhase();
      }
      return;
    }

    // 5. Find next player to act
    this.currentPlayerIndex = this.findNextActive(this.currentPlayerIndex);
    if (this.currentPlayerIndex === -1) {
      if (notFolded.some(p => p.allIn)) {
        this.runOutBoard();
      } else {
        this.nextPhase();
      }
    } else {
      this.startTurnTimer();
      this.emit('turnChange', this.getPublicState());
    }
  }

  runOutBoard() {
    if (this.showdownInProgress) return;
    console.log(`[Engine] runOutBoard called, community=${this.communityCards.length} cards`);
    this.currentPlayerIndex = -1;
    this.clearAllTimers();

    while (this.communityCards.length < 5) {
      this.communityCards.push(...dealCards(this.deck, 1));
    }

    this.phase = 'river';
    this.emit('phaseChange', this.getPublicState());

    this.showdownTimer = setTimeout(() => {
      this.showdownTimer = null;
      this.showdown();
    }, 1500);
  }

  nextPhase() {
    if (this.showdownInProgress) return;

    // Reset bets and acted tracking for new betting round
    for (const p of this.players) { p.bet = 0; }
    this.currentBet = 0;
    this.minRaise = this.bigBlind;
    this.actedThisRound = new Set();

    switch (this.phase) {
      case 'preflop':
        this.communityCards.push(...dealCards(this.deck, 3));
        this.phase = 'flop';
        this.logPhase('flop', this.communityCards.slice(0, 3));
        break;
      case 'flop':
        this.communityCards.push(...dealCards(this.deck, 1));
        this.phase = 'turn';
        this.logPhase('turn', [this.communityCards[3]]);
        break;
      case 'turn':
        this.communityCards.push(...dealCards(this.deck, 1));
        this.phase = 'river';
        this.logPhase('river', [this.communityCards[4]]);
        break;
      case 'river':
        this.showdown();
        return;
    }

    const canAct = this.players.filter(p => !p.folded && !p.allIn && p.chips > 0);
    if (canAct.length <= 1) {
      this.runOutBoard();
      return;
    }

    // Post-flop: first to act is first active after dealer
    this.currentPlayerIndex = this.findNextActive(this.dealerIndex);
    if (this.currentPlayerIndex === -1) {
      this.runOutBoard();
      return;
    }

    this.emit('phaseChange', this.getPublicState());
    this.startTurnTimer();
  }

  showdown() {
    if (this.showdownInProgress) return;
    console.log(`[Engine] showdown called`);
    this.showdownInProgress = true;
    this.phase = 'showdown';
    this.currentPlayerIndex = -1;
    this.clearAllTimers();

    const activePlayers = this.players.filter(p => !p.folded);

    for (const player of activePlayers) {
      player.handResult = evaluateHand(player.holeCards, this.communityCards);
    }

    // Sort by hand strength (best first)
    activePlayers.sort((a, b) => compareHands(b.handResult, a.handResult));

    this.calculateSidePots();

    if (this.sidePots.length > 0) {
      // Award each side pot to the BEST hand among eligible players
      for (const sidePot of this.sidePots) {
        const eligible = activePlayers.filter(p => sidePot.eligible.includes(p.discordId));
        if (eligible.length > 0) {
          // eligible is already sorted by hand strength — find winners (may tie)
          const winners = [eligible[0]];
          for (let i = 1; i < eligible.length; i++) {
            if (compareHands(eligible[i].handResult, eligible[0].handResult) === 0) {
              winners.push(eligible[i]);
            } else break;
          }
          const share = Math.floor(sidePot.amount / winners.length);
          const remainder = sidePot.amount % winners.length;
          for (let i = 0; i < winners.length; i++) {
            winners[i].chips += share + (i === 0 ? remainder : 0);
          }
        }
      }

      const overallWinners = [activePlayers[0]];
      for (let i = 1; i < activePlayers.length; i++) {
        if (compareHands(activePlayers[i].handResult, activePlayers[0].handResult) === 0) {
          overallWinners.push(activePlayers[i]);
        } else break;
      }

      this.finalizeHandLog(overallWinners, this.pot);
      this.emit('handEnd', {
        winners: overallWinners.map(w => ({ discordId: w.discordId, username: w.username, chips: w.chips, handResult: w.handResult })),
        pot: this.pot,
        state: this.getPublicState()
      });
      this.pot = 0;
      this.scheduleNextHand();
    } else {
      // No side pots — simple award
      const winners = [activePlayers[0]];
      for (let i = 1; i < activePlayers.length; i++) {
        if (compareHands(activePlayers[i].handResult, activePlayers[0].handResult) === 0) {
          winners.push(activePlayers[i]);
        } else break;
      }
      this.awardPot(winners);
    }
  }

  calculateSidePots() {
    const activePlayers = this.players.filter(p => !p.folded);
    const allInPlayers = activePlayers.filter(p => p.allIn).sort((a, b) => a.totalBet - b.totalBet);

    if (allInPlayers.length === 0) { this.sidePots = []; return; }

    this.sidePots = [];
    let processedBet = 0;

    for (const allInPlayer of allInPlayers) {
      if (allInPlayer.totalBet <= processedBet) continue;
      const level = allInPlayer.totalBet;
      let potAmount = 0;
      const eligible = [];

      for (const p of this.players) {
        const contribution = Math.min(p.totalBet, level) - Math.min(p.totalBet, processedBet);
        if (contribution > 0) potAmount += contribution;
        if (!p.folded && p.totalBet >= level) eligible.push(p.discordId);
      }

      if (potAmount > 0) this.sidePots.push({ amount: potAmount, eligible });
      processedBet = level;
    }

    // Remaining pot (for non-all-in players)
    let remaining = 0;
    const eligibleForMain = [];
    for (const p of this.players) {
      const contribution = Math.max(0, p.totalBet - processedBet);
      if (contribution > 0) remaining += contribution;
      if (!p.folded && p.totalBet > processedBet) eligibleForMain.push(p.discordId);
    }

    if (remaining > 0 && eligibleForMain.length > 0) {
      this.sidePots.push({ amount: remaining, eligible: eligibleForMain });
    }
  }

  awardPot(winners) {
    const share = Math.floor(this.pot / winners.length);
    const remainder = this.pot % winners.length;
    for (let i = 0; i < winners.length; i++) {
      winners[i].chips += share + (i === 0 ? remainder : 0);
    }

    this.finalizeHandLog(winners, this.pot);
    this.emit('handEnd', {
      winners: winners.map(w => ({ discordId: w.discordId, username: w.username, chips: w.chips, handResult: w.handResult })),
      pot: this.pot,
      state: this.getPublicState()
    });

    this.pot = 0;
    this.scheduleNextHand();
  }

  scheduleNextHand() {
    // Check for newly eliminated players (chips = 0)
    this.checkEliminations();

    this.nextHandTimer = setTimeout(() => {
      this.nextHandTimer = null;
      const playersWithChips = this.players.filter(p => p.chips > 0 && !p.sittingOut);

      if (playersWithChips.length < 2) {
        this.phase = 'finished';
        this.currentPlayerIndex = -1;
        this.emitGameOver();
      } else {
        this.showdownInProgress = false;
        this.startNewHand();
      }
    }, 5000);
  }

  emitGameOver() {
    this.checkEliminations();

    const winner = this.players.reduce((a, b) => a.chips > b.chips ? a : b);
    const gameDuration = Date.now() - (this.gameStartedAt || Date.now());

    // Build standings
    const standings = [];
    standings.push({
      place: 1,
      discordId: winner.discordId,
      username: winner.username,
      avatarUrl: winner.avatarUrl,
      chips: winner.chips
    });

    for (let i = this.eliminations.length - 1; i >= 0; i--) {
      const elim = this.eliminations[i];
      standings.push({
        place: standings.length + 1,
        discordId: elim.discordId,
        username: elim.username,
        avatarUrl: elim.avatarUrl,
        eliminatedAtHand: elim.hand
      });
    }

    const state = this.getPublicState();
    state.winner = {
      discordId: winner.discordId,
      username: winner.username,
      avatarUrl: winner.avatarUrl,
      chips: winner.chips
    };
    state.standings = standings;
    state.gameDuration = gameDuration;
    state.totalHands = this.handNumber;

    console.log(`[Engine] Game Over! Winner: ${winner.username}, Duration: ${gameDuration}ms, Hands: ${this.handNumber}`);
    this.emit('gameOver', state);
  }

  checkEliminations() {
    const alreadyEliminated = new Set(this.eliminations.map(e => e.discordId));
    for (const p of this.players) {
      if (p.chips <= 0 && !p.sittingOut && !alreadyEliminated.has(p.discordId)) {
        this.eliminations.push({
          discordId: p.discordId,
          username: p.username,
          avatarUrl: p.avatarUrl,
          hand: this.handNumber,
          eliminatedAt: Date.now()
        });
        this.emit('playerEliminated', {
          discordId: p.discordId,
          username: p.username,
          hand: this.handNumber,
          remaining: this.players.filter(pl => pl.chips > 0).length
        });
      }
    }
  }

  startTurnTimer() {
    this.clearTurnTimer();
    const timerPlayerId = this.getCurrentPlayer()?.discordId;
    this.turnDelayTimer = setTimeout(() => {
      this.turnDelayTimer = null;
      this.turnTimer = setTimeout(() => {
        this.turnTimer = null;
        const player = this.getCurrentPlayer();
        if (player && player.discordId === timerPlayerId) {
          if (player.bet < this.currentBet) {
            this.handleAction(player.discordId, 'fold');
          } else {
            this.handleAction(player.discordId, 'check');
          }
        }
      }, this.roundTime);
      this.emit('timerStart', { discordId: timerPlayerId, duration: this.roundTime, delay: this.timerDelay });
    }, this.timerDelay);
  }

  clearTurnTimer() {
    if (this.turnDelayTimer) { clearTimeout(this.turnDelayTimer); this.turnDelayTimer = null; }
    if (this.turnTimer) { clearTimeout(this.turnTimer); this.turnTimer = null; }
  }

  clearAllTimers() {
    this.clearTurnTimer();
    if (this.showdownTimer) { clearTimeout(this.showdownTimer); this.showdownTimer = null; }
    if (this.nextHandTimer) { clearTimeout(this.nextHandTimer); this.nextHandTimer = null; }
  }

  getPublicState() {
    return {
      gameId: this.gameId,
      phase: this.phase,
      pot: this.pot,
      communityCards: this.communityCards,
      currentBet: this.currentBet,
      minRaise: this.minRaise,
      dealerIndex: this.dealerIndex,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.getCurrentPlayer()?.discordId || null,
      handNumber: this.handNumber,
      players: this.players.map(p => ({
        discordId: p.discordId,
        username: p.username,
        avatarUrl: p.avatarUrl,
        seat: p.seat,
        chips: p.chips,
        bet: p.bet,
        folded: p.folded,
        allIn: p.allIn,
        disconnected: p.disconnected,
        hasCards: p.holeCards.length > 0 && !p.folded,
        holeCards: this.phase === 'showdown' && !p.folded ? p.holeCards : undefined,
        handResult: this.phase === 'showdown' && !p.folded ? {
          rankName: p.handResult?.rankName,
          rank: p.handResult?.rank,
          cards: p.handResult?.cards
        } : undefined
      })),
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      roundTime: this.roundTime
    };
  }

  getPlayerState(discordId) {
    const state = this.getPublicState();
    const playerIdx = this.players.findIndex(p => p.discordId === discordId);
    if (playerIdx !== -1) {
      const player = this.players[playerIdx];
      state.players[playerIdx].holeCards = player.holeCards;
      state.myIndex = playerIdx;
      state.myCards = player.holeCards;

      // Live hand evaluation
      if (player.holeCards.length === 2 && this.communityCards.length >= 3 && !player.folded) {
        try {
          const result = evaluateHand(player.holeCards, this.communityCards);
          state.myHandResult = { rankName: result.rankName, rank: result.rank, cards: result.cards };
        } catch { /* ignore */ }
      }

      // Available actions
      const isMyTurn = this.currentPlayerIndex === playerIdx;
      const canPlay = !player.allIn && !player.folded && player.chips > 0;
      const inBettingPhase = ['preflop', 'flop', 'turn', 'river'].includes(this.phase);

      if (isMyTurn && canPlay && inBettingPhase) {
        const callAmount = this.currentBet - player.bet;
        state.availableActions = [];

        if (callAmount > 0) {
          state.availableActions.push('fold');
          if (player.chips >= callAmount) {
            state.availableActions.push('call');
          }
          if (player.chips > callAmount) {
            state.availableActions.push('raise');
          }
          if (player.chips > 0) {
            state.availableActions.push('allin');
          }
        } else {
          state.availableActions.push('fold');
          state.availableActions.push('check');
          if (player.chips > 0) {
            state.availableActions.push('raise');
            state.availableActions.push('allin');
          }
        }

        state.callAmount = Math.min(Math.max(callAmount, 0), player.chips);
      }
    }
    return state;
  }

  logPhase(phase, cards) {
    if (this.gameLog.currentHand) {
      this.gameLog.currentHand.phases.push({
        phase,
        cards: cards.map(c => ({ ...c })),
        timestamp: Date.now()
      });
    }
  }

  finalizeHandLog(winners, pot) {
    if (!this.gameLog.currentHand) return;
    const hand = this.gameLog.currentHand;
    hand.communityCards = this.communityCards.map(c => ({ ...c }));
    hand.pot = pot;
    hand.endedAt = Date.now();
    hand.winners = winners.map(w => ({
      discordId: w.discordId,
      username: w.username,
      chips: w.chips,
      handResult: w.handResult ? { rankName: w.handResult.rankName } : null
    }));
    hand.playerResults = this.players.map(p => ({
      discordId: p.discordId,
      username: p.username,
      chips: p.chips,
      folded: p.folded,
      allIn: p.allIn
    }));
    this.gameLog.hands.push(hand);
    this.gameLog.currentHand = null;
  }

  getFullGameLog() {
    const gameDuration = Date.now() - (this.gameStartedAt || Date.now());
    return {
      gameId: this.gameId,
      startedAt: this.gameStartedAt,
      endedAt: Date.now(),
      duration: gameDuration,
      totalHands: this.handNumber,
      settings: {
        smallBlind: this.smallBlind,
        bigBlind: this.bigBlind,
        startingStack: this.startingStack,
        maxPlayers: this.maxPlayers,
        roundTime: this.roundTime / 1000
      },
      players: this.players.map(p => ({
        discordId: p.discordId,
        username: p.username,
        avatarUrl: p.avatarUrl,
        finalChips: p.chips
      })),
      eliminations: this.eliminations.map((e, i) => ({
        ...e,
        place: this.players.length - i
      })),
      hands: this.gameLog.hands
    };
  }

  destroy() {
    this.clearAllTimers();
    this.removeAllListeners();
  }
}
