// srs.js — Spaced repetition system (SM-2 variant) + mastery tracking

class SRSCard {
  constructor(intervalId, direction) {
    this.id = `${intervalId}:${direction}`;
    this.intervalId = intervalId;
    this.direction = direction; // 'ascending' | 'descending' | 'harmonic'

    // SM-2 state
    this.easeFactor = 2.5;
    this.intervalDays = 0;       // days until next review
    this.repetitions = 0;        // successful reviews in a row

    // Mastery (0.0–1.0)
    this.mastery = 0.0;

    // Scheduling
    this.dueDate = Date.now();   // due immediately when first introduced
    this.introducedAt = null;    // timestamp when first shown to user
    this.isLocked = true;        // locked until unlocked by progression system

    // History: last N responses
    this.history = [];           // [{ correct: bool, responseMs: number, ts: number }]
    this.totalAnswers = 0;       // lifetime answer count (not capped like history)
  }

  // Grade: 0=again, 1=hard, 2=good, 3=easy (mapped from correctness + responseTime)
  static gradeResponse(correct, responseMs) {
    if (!correct) return 0;
    if (responseMs < 2500) return 3; // fast correct
    if (responseMs < 5000) return 2; // normal correct
    return 1;                         // slow correct
  }

  update(correct, responseMs) {
    const grade = SRSCard.gradeResponse(correct, responseMs);

    // -- Mastery update (logistic-style) --
    const lr = 0.12;
    if (correct) {
      this.mastery = Math.min(1, this.mastery + lr * (1 - this.mastery));
    } else {
      this.mastery = Math.max(0, this.mastery - lr * this.mastery - 0.06);
    }

    // -- SM-2 interval update --
    if (grade >= 2) {
      if (this.repetitions === 0) {
        this.intervalDays = 1;
      } else if (this.repetitions === 1) {
        this.intervalDays = 4;
      } else {
        this.intervalDays = Math.round(this.intervalDays * this.easeFactor);
      }
      this.repetitions += 1;
    } else {
      // Failed — reset to relearning
      this.repetitions = 0;
      this.intervalDays = 0;
    }

    // Ease factor update (SM-2 formula)
    this.easeFactor = Math.max(
      1.3,
      this.easeFactor + 0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)
    );

    // Schedule next review
    const msPerDay = 24 * 60 * 60 * 1000;
    if (this.intervalDays === 0) {
      // Due again soon (within this session or next)
      this.dueDate = Date.now() + 10 * 60 * 1000; // 10 minutes
    } else {
      this.dueDate = Date.now() + this.intervalDays * msPerDay;
    }

    // Record history (keep last 20)
    this.history.push({ correct, responseMs, ts: Date.now() });
    if (this.history.length > 20) this.history.shift();
    this.totalAnswers++;
  }

  isDue() {
    return !this.isLocked && Date.now() >= this.dueDate;
  }

  // Recent accuracy over last N responses
  recentAccuracy(n = 5) {
    const recent = this.history.slice(-n);
    if (recent.length === 0) return 0;
    return recent.filter(r => r.correct).length / recent.length;
  }

  // Serialize for localStorage
  toJSON() {
    return {
      id: this.id,
      intervalId: this.intervalId,
      direction: this.direction,
      easeFactor: this.easeFactor,
      intervalDays: this.intervalDays,
      repetitions: this.repetitions,
      mastery: this.mastery,
      dueDate: this.dueDate,
      introducedAt: this.introducedAt,
      isLocked: this.isLocked,
      history: this.history,
      totalAnswers: this.totalAnswers,
    };
  }

  static fromJSON(data) {
    const card = new SRSCard(data.intervalId, data.direction);
    Object.assign(card, data);
    return card;
  }
}

class SRSDeck {
  constructor() {
    this.cards = {}; // id -> SRSCard

    // Create all possible cards (locked by default)
    for (const interval of INTERVALS) {
      for (const direction of ['ascending', 'descending', 'harmonic']) {
        const card = new SRSCard(interval.id, direction);
        this.cards[card.id] = card;
      }
    }
  }

  get(id) {
    return this.cards[id];
  }

  getCard(intervalId, direction) {
    return this.cards[`${intervalId}:${direction}`];
  }

  // All unlocked cards
  activeCards() {
    return Object.values(this.cards).filter(c => !c.isLocked);
  }

  // All due cards (unlocked + past due date)
  dueCards() {
    return this.activeCards().filter(c => c.isDue());
  }

  // Average mastery of a set of cards
  avgMastery(cards) {
    if (cards.length === 0) return 1;
    return cards.reduce((sum, c) => sum + c.mastery, 0) / cards.length;
  }

  // Relock a card — removes it from sessions, keeps mastery intact.
  relock(intervalId, direction) {
    const card = this.getCard(intervalId, direction);
    if (card && !card.isLocked) { card.isLocked = true; return true; }
    return false;
  }

  // Unlock a card (called by progression system)
  unlock(intervalId, direction) {
    const card = this.getCard(intervalId, direction);
    if (card && card.isLocked) {
      card.isLocked = false;
      card.introducedAt = Date.now();
      card.dueDate = Date.now(); // due immediately
      return true;
    }
    return false;
  }

  // Serialize all cards
  toJSON() {
    return Object.fromEntries(
      Object.entries(this.cards).map(([id, card]) => [id, card.toJSON()])
    );
  }

  static fromJSON(data) {
    const deck = new SRSDeck();
    for (const [id, cardData] of Object.entries(data)) {
      deck.cards[id] = SRSCard.fromJSON(cardData);
    }
    return deck;
  }
}
