// chord-module.js — ChordDeck and ChordProgression (parallels srs.js / progression.js)

class ChordDeck {
  constructor() {
    this.cards = {};
    for (const chord of CHORDS) {
      // Reuse SRSCard; intervalId holds the chord id, direction is always 'block'
      const card = new SRSCard(chord.id, 'block');
      this.cards[card.id] = card;
    }
  }

  getCard(chordId) {
    return this.cards[`${chordId}:block`];
  }

  activeCards() {
    return Object.values(this.cards).filter(c => !c.isLocked);
  }

  dueCards() {
    return this.activeCards().filter(c => c.isDue());
  }

  avgMastery(cards) {
    if (cards.length === 0) return 1;
    return cards.reduce((sum, c) => sum + c.mastery, 0) / cards.length;
  }

  relock(chordId) {
    const card = this.getCard(chordId);
    if (card && !card.isLocked) { card.isLocked = true; return true; }
    return false;
  }

  unlock(chordId) {
    const card = this.getCard(chordId);
    if (card && card.isLocked) {
      card.isLocked = false;
      card.introducedAt = Date.now();
      card.dueDate = Date.now();
      return true;
    }
    return false;
  }

  toJSON() {
    return Object.fromEntries(
      Object.entries(this.cards).map(([id, c]) => [id, c.toJSON()])
    );
  }

  static fromJSON(data) {
    const deck = new ChordDeck();
    for (const [id, cardData] of Object.entries(data)) {
      if (deck.cards[id]) {
        deck.cards[id] = SRSCard.fromJSON(cardData);
      }
    }
    return deck;
  }
}

class ChordProgression {
  constructor(deck) {
    this.deck = deck;
    this.unlockedGroupIndex = -1;
    this._initialUnlock();
  }

  _initialUnlock() {
    if (this.unlockedGroupIndex < 0) {
      this._unlockGroup(0);
    }
  }

  _unlockGroup(groupIndex) {
    if (groupIndex >= CHORD_UNLOCK_GROUPS.length) return [];
    const group = CHORD_UNLOCK_GROUPS[groupIndex];
    const newUnlocks = [];
    for (const chordId of group.chords) {
      const unlocked = this.deck.unlock(chordId);
      if (unlocked) newUnlocks.push({ chordId, direction: 'block' });
    }
    this.unlockedGroupIndex = Math.max(this.unlockedGroupIndex, groupIndex);
    return newUnlocks;
  }

  // How many total answers each card must have before an auto-unlock can trigger.
  // Prevents lucky-streak unlocks after only a handful of questions.
  static get MIN_ANSWERS_TO_UNLOCK() { return 20; }

  // Returns the chords that WOULD unlock next, without doing anything.
  // Empty array means the threshold hasn't been reached yet.
  peekUnlocks() {
    const nextGroupIndex = this.unlockedGroupIndex + 1;
    if (nextGroupIndex >= CHORD_UNLOCK_GROUPS.length) return [];

    const currentGroup = CHORD_UNLOCK_GROUPS[this.unlockedGroupIndex];
    const currentGroupCards = currentGroup.chords
      .map(id => this.deck.getCard(id))
      .filter(Boolean);
    if (currentGroupCards.length === 0) return [];

    const avgMastery = this.deck.avgMastery(currentGroupCards);
    const allSeasoned = currentGroupCards.every(
      c => (c.totalAnswers || 0) >= ChordProgression.MIN_ANSWERS_TO_UNLOCK
    );

    if (avgMastery >= currentGroup.minMasteryToUnlockNext && allSeasoned) {
      return CHORD_UNLOCK_GROUPS[nextGroupIndex].chords.map(id => ({ chordId: id }));
    }
    return [];
  }

  // Actually perform the unlock of the next group. Call only after user confirms.
  applyUnlocks() {
    const nextGroupIndex = this.unlockedGroupIndex + 1;
    if (nextGroupIndex >= CHORD_UNLOCK_GROUPS.length) return [];
    return this._unlockGroup(nextGroupIndex);
  }

  // Legacy: peek + apply in one step (still used for the initial group-0 check on session start).
  checkUnlocks() {
    if (this.peekUnlocks().length > 0) return this.applyUnlocks();
    return [];
  }

  buildSession(sessionSize = 20) {
    const active = this.deck.activeCards();
    if (active.length === 0) return [];

    const due = this.deck.dueCards().sort((a, b) => a.dueDate - b.dueDate);
    const notDue = active.filter(c => !c.isDue()).sort((a, b) => a.mastery - b.mastery);
    const pool = [...due, ...notDue];

    const queue = [];
    for (const card of pool) {
      if (queue.length >= sessionSize) break;
      queue.push(card);
    }

    let i = 0;
    while (queue.length < sessionSize && pool.length > 0) {
      queue.push(pool[i % pool.length]);
      i++;
      if (i > pool.length * 3) break;
    }

    return queue;
  }

  toJSON() {
    return { unlockedGroupIndex: this.unlockedGroupIndex };
  }

  loadJSON(data) {
    if (data && typeof data.unlockedGroupIndex === 'number') {
      this.unlockedGroupIndex = data.unlockedGroupIndex;
    }
  }
}
