// progression.js — Unlock system and session planning

class Progression {
  constructor(deck) {
    this.deck = deck;
    this.unlockedGroupIndex = -1; // which ascending groups have been unlocked
    this._initialUnlock();
  }

  _initialUnlock() {
    // Always start with group 0 (P8 + P5 ascending)
    if (this.unlockedGroupIndex < 0) {
      this._unlockGroup(0);
    }
  }

  _unlockGroup(groupIndex) {
    if (groupIndex >= UNLOCK_GROUPS.length) return;
    const group = UNLOCK_GROUPS[groupIndex];
    let newUnlocks = [];
    for (const intervalId of group.intervals) {
      const unlocked = this.deck.unlock(intervalId, 'ascending');
      if (unlocked) newUnlocks.push({ intervalId, direction: 'ascending' });
    }
    this.unlockedGroupIndex = Math.max(this.unlockedGroupIndex, groupIndex);
    return newUnlocks;
  }

  static get MIN_ANSWERS_TO_UNLOCK() { return 20; }

  // Returns what WOULD unlock without doing it.
  peekUnlocks() {
    const pending = [];

    // --- Descending (per interval) — checked first; takes priority over new groups ---
    for (const interval of INTERVALS) {
      const ascCard  = this.deck.getCard(interval.id, 'ascending');
      const descCard = this.deck.getCard(interval.id, 'descending');
      if (ascCard && !ascCard.isLocked && descCard && descCard.isLocked) {
        const seasoned = (ascCard.totalAnswers || 0) >= Progression.MIN_ANSWERS_TO_UNLOCK;
        if (ascCard.mastery >= DIRECTION_THRESHOLDS.unlockDescending && seasoned)
          pending.push({ intervalId: interval.id, direction: 'descending' });
      }
    }

    // --- Harmonic (per interval) ---
    for (const interval of INTERVALS) {
      const descCard = this.deck.getCard(interval.id, 'descending');
      const harmCard = this.deck.getCard(interval.id, 'harmonic');
      if (descCard && !descCard.isLocked && harmCard && harmCard.isLocked) {
        const seasoned = (descCard.totalAnswers || 0) >= Progression.MIN_ANSWERS_TO_UNLOCK;
        if (descCard.mastery >= DIRECTION_THRESHOLDS.unlockHarmonic && seasoned)
          pending.push({ intervalId: interval.id, direction: 'harmonic' });
      }
    }

    // --- Next ascending group — only if no direction unlocks are pending ---
    if (pending.length === 0) {
      const nextGroupIndex = this.unlockedGroupIndex + 1;
      if (nextGroupIndex < UNLOCK_GROUPS.length) {
        const currentGroup = UNLOCK_GROUPS[this.unlockedGroupIndex];
        const currentGroupCards = currentGroup.intervals
          .map(id => this.deck.getCard(id, 'ascending'))
          .filter(Boolean);
        if (currentGroupCards.length > 0) {
          const avgMastery = this.deck.avgMastery(currentGroupCards);
          const allSeasoned = currentGroupCards.every(
            c => (c.totalAnswers || 0) >= Progression.MIN_ANSWERS_TO_UNLOCK
          );
          if (avgMastery >= currentGroup.minMasteryToUnlockNext && allSeasoned) {
            UNLOCK_GROUPS[nextGroupIndex].intervals.forEach(id =>
              pending.push({ intervalId: id, direction: 'ascending' })
            );
          }
        }
      }
    }

    return pending;
  }

  // Actually perform all pending unlocks. Call only after user confirms.
  applyUnlocks() {
    const newUnlocks = [];

    // Apply direction unlocks first (same priority order as peekUnlocks)
    // Must match peekUnlocks exactly — including the seasoned gate.
    for (const interval of INTERVALS) {
      const ascCard  = this.deck.getCard(interval.id, 'ascending');
      const descCard = this.deck.getCard(interval.id, 'descending');
      if (ascCard && !ascCard.isLocked && descCard && descCard.isLocked) {
        const seasoned = (ascCard.totalAnswers || 0) >= Progression.MIN_ANSWERS_TO_UNLOCK;
        if (ascCard.mastery >= DIRECTION_THRESHOLDS.unlockDescending && seasoned) {
          if (this.deck.unlock(interval.id, 'descending'))
            newUnlocks.push({ intervalId: interval.id, direction: 'descending' });
        }
      }
    }

    for (const interval of INTERVALS) {
      const descCard = this.deck.getCard(interval.id, 'descending');
      const harmCard = this.deck.getCard(interval.id, 'harmonic');
      if (descCard && !descCard.isLocked && harmCard && harmCard.isLocked) {
        const seasoned = (descCard.totalAnswers || 0) >= Progression.MIN_ANSWERS_TO_UNLOCK;
        if (descCard.mastery >= DIRECTION_THRESHOLDS.unlockHarmonic && seasoned) {
          if (this.deck.unlock(interval.id, 'harmonic'))
            newUnlocks.push({ intervalId: interval.id, direction: 'harmonic' });
        }
      }
    }

    // Only unlock next ascending group if no direction unlocks were applied
    if (newUnlocks.length === 0) {
      const nextGroupIndex = this.unlockedGroupIndex + 1;
      if (nextGroupIndex < UNLOCK_GROUPS.length) {
        const currentGroup = UNLOCK_GROUPS[this.unlockedGroupIndex];
        const currentGroupCards = currentGroup.intervals
          .map(id => this.deck.getCard(id, 'ascending'))
          .filter(Boolean);
        if (currentGroupCards.length > 0) {
          const avgMastery = this.deck.avgMastery(currentGroupCards);
          const allSeasoned = currentGroupCards.every(
            c => (c.totalAnswers || 0) >= Progression.MIN_ANSWERS_TO_UNLOCK
          );
          if (avgMastery >= currentGroup.minMasteryToUnlockNext && allSeasoned) {
            const unlocked = this._unlockGroup(nextGroupIndex);
            if (unlocked) newUnlocks.push(...unlocked);
          }
        }
      }
    }

    return newUnlocks;
  }

  // Legacy: peek + apply in one step.
  checkUnlocks() {
    if (this.peekUnlocks().length > 0) return this.applyUnlocks();
    return [];
  }

  // Build a session queue of cards to practice
  // Returns array of SRSCard objects in the order they'll be presented
  buildSession(sessionSize = 20) {
    const queue = [];
    const active = this.deck.activeCards();

    if (active.length === 0) return queue;

    // 1. Overdue cards first (sorted by how overdue they are)
    const due = this.deck.dueCards()
      .sort((a, b) => a.dueDate - b.dueDate);

    // 2. Non-due active cards sorted by mastery (lowest first)
    const notDue = active
      .filter(c => !c.isDue())
      .sort((a, b) => a.mastery - b.mastery);

    // Fill queue: due cards, then lowest-mastery cards
    const pool = [...due, ...notDue];

    // Fill queue from pool (due cards first, then lowest mastery)
    for (const card of pool) {
      if (queue.length >= sessionSize) break;
      queue.push(card);
    }

    // If session is smaller than sessionSize, cycle through pool again
    let i = 0;
    while (queue.length < sessionSize && pool.length > 0) {
      queue.push(pool[i % pool.length]);
      i++;
    }

    // Shuffle the full queue — partial shuffling left the first card deterministic
    // (most overdue / lowest mastery), which becomes a cue. SRS handles which
    // cards are included; random ordering within the session is better for learning.
    shuffleArray(queue);
    return queue;
  }

  // Summary of all interval groups and their unlock status
  getProgressSummary() {
    return UNLOCK_GROUPS.map((group, index) => {
      const cards = [];
      for (const intervalId of group.intervals) {
        for (const dir of ['ascending', 'descending', 'harmonic']) {
          const card = this.deck.getCard(intervalId, dir);
          if (card) cards.push(card);
        }
      }
      return {
        groupIndex: index,
        intervals: group.intervals,
        cards,
        unlocked: index <= this.unlockedGroupIndex,
      };
    });
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

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
