// storage.js — localStorage persistence

const Storage = (() => {
  const KEY_DECK        = 'earwise_deck_v1';
  const KEY_PROGRESSION = 'earwise_progression_v1';
  const KEY_CHORD_DECK  = 'earwise_chord_deck_v1';
  const KEY_CHORD_PROG  = 'earwise_chord_prog_v1';
  const KEY_SETTINGS    = 'earwise_settings_v1';
  const KEY_STATS       = 'earwise_stats_v1';

  function save(deck, progression, chordDeck, chordProgression, settings, stats) {
    try {
      localStorage.setItem(KEY_DECK,        JSON.stringify(deck.toJSON()));
      localStorage.setItem(KEY_PROGRESSION, JSON.stringify(progression.toJSON()));
      localStorage.setItem(KEY_CHORD_DECK,  JSON.stringify(chordDeck.toJSON()));
      localStorage.setItem(KEY_CHORD_PROG,  JSON.stringify(chordProgression.toJSON()));
      localStorage.setItem(KEY_SETTINGS,    JSON.stringify(settings));
      localStorage.setItem(KEY_STATS,       JSON.stringify(stats));
    } catch (e) {
      console.warn('earwise: could not save to localStorage', e);
    }
  }

  function loadDeck() {
    try {
      const raw = localStorage.getItem(KEY_DECK);
      if (!raw) return null;
      return SRSDeck.fromJSON(JSON.parse(raw));
    } catch (e) {
      console.warn('earwise: could not load deck', e);
      return null;
    }
  }

  function loadProgression(deck) {
    try {
      const raw = localStorage.getItem(KEY_PROGRESSION);
      const prog = new Progression(deck);
      if (raw) prog.loadJSON(JSON.parse(raw));
      return prog;
    } catch (e) {
      console.warn('earwise: could not load progression', e);
      return new Progression(deck);
    }
  }

  function loadChordDeck() {
    try {
      const raw = localStorage.getItem(KEY_CHORD_DECK);
      if (!raw) return null;
      return ChordDeck.fromJSON(JSON.parse(raw));
    } catch (e) {
      console.warn('earwise: could not load chord deck', e);
      return null;
    }
  }

  function loadChordProgression(deck) {
    try {
      const raw = localStorage.getItem(KEY_CHORD_PROG);
      const prog = new ChordProgression(deck);
      if (raw) prog.loadJSON(JSON.parse(raw));
      return prog;
    } catch (e) {
      console.warn('earwise: could not load chord progression', e);
      return new ChordProgression(deck);
    }
  }

  function loadSettings() {
    const defaults = {
      autoPlay: true,          // auto-play interval when question starts
      autoAdvance: false,       // auto-advance after correct answer
      showSongsOn: 'wrong',    // 'always' | 'wrong' | 'never'
      sessionSize: 20,
      directionFilter: 'all',  // 'all' | 'ascending' | 'descending' | 'harmonic'
      playArpeggio: true,       // play ascending arpeggio sweep after chord block
    };
    try {
      const raw = localStorage.getItem(KEY_SETTINGS);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      return defaults;
    }
  }

  function loadStats() {
    const defaults = {
      totalSessions: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      sessionHistory: [], // last 30 sessions [{date, correct, total, newUnlocks}]
    };
    try {
      const raw = localStorage.getItem(KEY_STATS);
      if (!raw) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      return defaults;
    }
  }

  function exportJSON(deck, progression, chordDeck, chordProgression, settings, stats) {
    const data = {
      version: 2,
      exportDate: new Date().toISOString(),
      deck: deck.toJSON(),
      progression: progression.toJSON(),
      chordDeck: chordDeck.toJSON(),
      chordProgression: chordProgression.toJSON(),
      settings,
      stats,
    };
    return JSON.stringify(data, null, 2);
  }

  function importJSON(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.version || !data.deck) throw new Error('Invalid earwise export file');

    const newDeck = SRSDeck.fromJSON(data.deck);
    const newProg = new Progression(newDeck);
    if (data.progression) newProg.loadJSON(data.progression);

    const newChordDeck = data.chordDeck ? ChordDeck.fromJSON(data.chordDeck) : new ChordDeck();
    const newChordProg = new ChordProgression(newChordDeck);
    if (data.chordProgression) newChordProg.loadJSON(data.chordProgression);

    return {
      deck: newDeck,
      progression: newProg,
      chordDeck: newChordDeck,
      chordProgression: newChordProg,
      settings: data.settings || {},
      stats: data.stats || {},
    };
  }

  function clear() {
    [KEY_DECK, KEY_PROGRESSION, KEY_CHORD_DECK, KEY_CHORD_PROG, KEY_SETTINGS, KEY_STATS]
      .forEach(k => localStorage.removeItem(k));
  }

  return {
    save, loadDeck, loadProgression, loadChordDeck, loadChordProgression,
    loadSettings, loadStats, exportJSON, importJSON, clear,
  };
})();
