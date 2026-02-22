// main.js — App orchestration

const App = {
  // Interval module
  deck: null,
  progression: null,

  // Chord module
  chordDeck: null,
  chordProgression: null,

  // Shared state
  activeModule: 'intervals', // 'intervals' | 'chords'
  settings: null,
  stats: null,
  session: null,      // { queue, index, correct, total, masterySnapshots, answeredThisSession, module }
  currentCard: null,
  questionStartTime: null,
  seenCards: new Set(),

  init() {
    this.deck            = Storage.loadDeck()             || new SRSDeck();
    this.progression     = Storage.loadProgression(this.deck);
    this.chordDeck       = Storage.loadChordDeck()        || new ChordDeck();
    this.chordProgression = Storage.loadChordProgression(this.chordDeck);
    this.settings        = Storage.loadSettings();
    this.stats           = Storage.loadStats();
    UI.init(this);
    this._save();
  },

  // ── Module switching ───────────────────────────────────────────────────────

  setModule(module) {
    this.activeModule = module;
    UI.renderHome();
  },

  // ── Session ────────────────────────────────────────────────────────────────

  startSession() {
    const isChords = this.activeModule === 'chords';

    // No auto-unlocks at session start — both modules use the opt-in prompt at session end.

    const queue = isChords
      ? this.chordProgression.buildSession(this.settings.sessionSize)
      : this.progression.buildSession(this.settings.sessionSize);

    if (queue.length === 0) {
      UI.toast('No items to practice yet!', 'error');
      return;
    }

    this.session = {
      queue,
      index: 0,
      correct: 0,
      total: queue.length,
      masterySnapshots: {},
      newUnlocks: [],
      answeredThisSession: new Set(),
      module: this.activeModule,
    };

    for (const card of queue) {
      if (!(card.id in this.session.masterySnapshots)) {
        this.session.masterySnapshots[card.id] = card.mastery;
      }
    }

    this.seenCards = new Set();
    this._presentQuestion();
  },

  _presentQuestion() {
    if (this.session.index >= this.session.queue.length) {
      this._endSession();
      return;
    }

    this.currentCard = this.session.queue[this.session.index];
    const card = this.currentCard;
    const isNew = card.introducedAt &&
      (Date.now() - card.introducedAt < 120 * 1000) &&
      !this.seenCards.has(card.id);

    this.seenCards.add(card.id);
    UI.renderQuestion(card, this.session.index, this.session.total, isNew, this.session.module);

    if (this.settings.autoPlay) {
      this._playCurrentCard();
    }
  },

  playCurrentInterval() {
    this._playCurrentCard();
  },

  _playCurrentCard() {
    this.questionStartTime = null;
    const onDone = () => {
      this.questionStartTime = Date.now();
      UI.enableAnswering();
      this._maybeShowSilentHint();
    };

    if (this.session.module === 'chords') {
      const chord = CHORD_MAP[this.currentCard.intervalId];
      Audio.playChord(chord.semitones, this.settings.playArpeggio !== false).then(onDone);
    } else {
      const interval = INTERVAL_MAP[this.currentCard.intervalId];
      Audio.play(interval.semitones, this.currentCard.direction).then(onDone);
    }
  },

  replayInterval() {
    Audio.replay();
  },

  playComparisonChord(chordId) {
    Audio.unlock();
    const chord = CHORD_MAP[chordId];
    Audio.playChordFromLastRoot(chord.semitones, this.settings.playArpeggio !== false);
  },

  confirmUnlocks() {
    if (this.activeModule === 'chords') this.chordProgression.applyUnlocks();
    else this.progression.applyUnlocks();
    this._save();
    UI.renderHome();
    UI.toast('New items unlocked!', 'success');
  },

  deferUnlocks() {
    UI.renderHome();
  },

  manualUnlockChord(chordId) {
    this.chordDeck.unlock(chordId);
    this._save();
    UI.renderHome();
    UI.toast(`${CHORD_MAP[chordId].name} unlocked`, 'success');
  },

  manualUnlockInterval(intervalId, direction) {
    this.deck.unlock(intervalId, direction);
    this._save();
    UI.renderHome();
    UI.toast(`${INTERVAL_MAP[intervalId].name} (${direction}) unlocked`, 'success');
  },

  relockChord(chordId) {
    this.chordDeck.relock(chordId);
    this._save();
    UI.renderHome();
    UI.toast(`${CHORD_MAP[chordId].name} removed from practice`, 'info');
  },

  relockInterval(intervalId, direction) {
    this.deck.relock(intervalId, direction);
    this._save();
    UI.renderHome();
    UI.toast(`${INTERVAL_MAP[intervalId].name} (${direction}) removed from practice`, 'info');
  },

  _maybeShowSilentHint() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;
    if (localStorage.getItem('earwise_silent_hint_shown')) return;
    localStorage.setItem('earwise_silent_hint_shown', '1');
    UI.toast('No sound? Check your silent switch', 'info');
  },

  handleAnswer(selectedId) {
    if (!this.currentCard || !this.questionStartTime) return;

    const responseMs = Date.now() - this.questionStartTime;
    const correct = selectedId === this.currentCard.intervalId;

    this.currentCard.update(correct, responseMs);

    if (correct) this.session.correct++;
    this.session.answeredThisSession.add(this.currentCard.id);

    UI.renderFeedback(correct, this.currentCard, selectedId, this.session.module);

    this.stats.totalQuestions++;
    if (correct) this.stats.totalCorrect++;

    this._save();

    if (correct && this.settings.autoAdvance) {
      setTimeout(() => this.nextQuestion(), 1200);
    } else {
      document.getElementById('btn-next').classList.remove('hidden');
    }
  },

  nextQuestion() {
    document.getElementById('btn-next').classList.add('hidden');
    this.session.index++;
    this._presentQuestion();
  },

  _endSession() {
    const isChords = this.session.module === 'chords';
    // Both modules: peek only — user confirms via the summary prompt.
    const newUnlocks = [];
    const pendingUnlocks = isChords
      ? this.chordProgression.peekUnlocks()
      : this.progression.peekUnlocks();

    const masteryChanges = Object.entries(this.session.masterySnapshots)
      .filter(([id]) => this.session.answeredThisSession.has(id))
      .map(([id, before]) => {
        const deck = isChords ? this.chordDeck : this.deck;
        const card = deck.cards[id];
        return {
          itemId: card.intervalId, // chord id or interval id
          direction: card.direction,
          delta: card.mastery - before,
          module: this.session.module,
        };
      })
      .filter(ch => Math.abs(ch.delta) > 0.001);

    this.stats.totalSessions++;
    const today = new Date().toDateString();
    const yesterday = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString();
    })();
    if (this.stats.lastSessionDate !== today) {
      this.stats.currentStreak = (this.stats.lastSessionDate === yesterday)
        ? this.stats.currentStreak + 1 : 1;
      this.stats.lastSessionDate = today;
    }
    this.stats.longestStreak = Math.max(this.stats.longestStreak, this.stats.currentStreak);
    this.stats.sessionHistory.push({
      date: new Date().toISOString(),
      correct: this.session.correct,
      total: this.session.total,
      newUnlocks: newUnlocks.length,
      module: this.session.module,
    });
    if (this.stats.sessionHistory.length > 30) this.stats.sessionHistory.shift();

    this._save();

    UI.renderSummary({
      correct: this.session.correct,
      total: this.session.total,
      newUnlocks,
      pendingUnlocks,
      masteryChanges,
      module: this.session.module,
    });

    this.session = null;
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this._save();
    UI.toast('Settings saved', 'success');
  },

  // ── Persistence ────────────────────────────────────────────────────────────

  _save() {
    Storage.save(
      this.deck, this.progression,
      this.chordDeck, this.chordProgression,
      this.settings, this.stats
    );
  },

  resetProgress() {
    Storage.clear();
    this.deck             = new SRSDeck();
    this.progression      = new Progression(this.deck);
    this.chordDeck        = new ChordDeck();
    this.chordProgression = new ChordProgression(this.chordDeck);
    this.settings         = Storage.loadSettings();
    this.stats            = Storage.loadStats();
    this.session          = null;
    this._save();
    UI.renderHome();
    UI.toast('Progress reset', 'info');
  },

  exportData() {
    const json = Storage.exportJSON(
      this.deck, this.progression,
      this.chordDeck, this.chordProgression,
      this.settings, this.stats
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earwise-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    UI.toast('Progress exported', 'success');
  },

  importData(jsonString) {
    try {
      const result = Storage.importJSON(jsonString);
      this.deck             = result.deck;
      this.progression      = result.progression;
      this.chordDeck        = result.chordDeck;
      this.chordProgression = result.chordProgression;
      this.settings         = { ...this.settings, ...result.settings };
      this.stats            = { ...this.stats,    ...result.stats };
      this._save();
      UI.renderHome();
      UI.toast('Progress imported successfully', 'success');
    } catch (e) {
      UI.toast('Import failed: ' + e.message, 'error');
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
