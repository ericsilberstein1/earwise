// audio.js — Web Audio API engine with ADSR envelopes and piano-like timbre

const Audio = (() => {
  let ctx = null;
  let resumePromise = null; // tracks in-flight resume()

  // Call SYNCHRONOUSLY from any user-gesture handler (before any awaits).
  // iOS requires ctx.resume() to be called within the gesture call stack.
  // Stores the resulting promise so play functions can await it.
  function unlock() {
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (ctx.state === 'suspended') {
      resumePromise = ctx.resume().then(() => { resumePromise = null; });
    }
  }

  // Await at the start of any play function to ensure the context is running.
  async function _ensureRunning() {
    if (!ctx) unlock();
    if (resumePromise) await resumePromise;
    return ctx;
  }

  // Build a piano-like tone chain: oscillator → filter → gain → destination
  function buildTone(frequency, startTime, duration, audioCtx) {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();

    // Triangle wave + lowpass filter ≈ warm, mellow tone
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);

    // Low-pass filter to round off harsh overtones
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, startTime);
    filter.Q.setValueAtTime(0.8, startTime);

    // ADSR envelope
    const peak = 0.55;
    const attack = 0.015;
    const decay = 0.12;
    const sustainLevel = 0.38;
    const release = 0.25;
    const sustainEnd = Math.max(startTime + attack + decay, startTime + duration - release);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustainLevel, sustainEnd);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    return osc;
  }

  // Convert MIDI note number to frequency
  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Pick a random root MIDI note such that both notes stay in range [rootMin, rootMax]
  function pickRoot(semitones, direction) {
    const low = 48;  // C3
    const high = 72; // C5

    let minRoot, maxRoot;
    if (direction === 'ascending') {
      minRoot = low;
      maxRoot = Math.min(high, 84 - semitones); // ensure top note ≤ C6
    } else if (direction === 'descending') {
      minRoot = Math.max(low, low + semitones);  // ensure bottom note ≥ C3
      maxRoot = high;
    } else {
      // harmonic — same as ascending
      minRoot = low;
      maxRoot = Math.min(high, 84 - semitones);
    }

    if (minRoot > maxRoot) minRoot = maxRoot; // safety clamp
    return Math.round(minRoot + Math.random() * (maxRoot - minRoot));
  }

  // ── Interval playback ──────────────────────────────────────────────────────

  // Store exact frequencies for accurate replay
  let lastRootFreq = null;
  let lastIntervalFreq = null;
  let lastIntervalDirection = null;

  async function _playIntervalFreqs(rootFreq, intervalFreq, direction) {
    const audioCtx = await _ensureRunning();
    const now = audioCtx.currentTime + 0.05;
    const noteDuration = 0.65;
    const gap = 0.15;
    let totalDuration;

    if (direction === 'harmonic') {
      buildTone(rootFreq, now, noteDuration + 0.2, audioCtx);
      buildTone(intervalFreq, now, noteDuration + 0.2, audioCtx);
      totalDuration = noteDuration + 0.2 + 0.1;
    } else {
      buildTone(rootFreq, now, noteDuration, audioCtx);
      buildTone(intervalFreq, now + noteDuration + gap, noteDuration, audioCtx);
      totalDuration = noteDuration + gap + noteDuration + 0.1;
    }

    return new Promise(resolve => setTimeout(resolve, totalDuration * 1000));
  }

  // play() picks a random root and stores exact frequencies for replay
  function play(semitones, direction) {
    const rootMidi = pickRoot(semitones, direction);
    const intervalMidi = direction === 'descending'
      ? rootMidi - semitones
      : rootMidi + semitones;

    lastRootFreq = midiToFreq(rootMidi);
    lastIntervalFreq = midiToFreq(intervalMidi);
    lastIntervalDirection = direction;
    lastChordFreqs = null; // clear chord replay state

    return _playIntervalFreqs(lastRootFreq, lastIntervalFreq, lastIntervalDirection);
  }

  // ── Chord playback ─────────────────────────────────────────────────────────

  // Reduced peak gain for chords to prevent clipping with multiple simultaneous notes
  function buildChordTone(frequency, startTime, duration, audioCtx) {
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, startTime);
    filter.Q.setValueAtTime(0.7, startTime);

    // Lower peak gain (0.25 vs 0.55) to avoid clipping with 3-4 simultaneous notes
    const peak = 0.25;
    const attack = 0.015;
    const decay = 0.10;
    const sustainLevel = 0.17;
    const release = 0.25;
    const sustainEnd = Math.max(startTime + attack + decay, startTime + duration - release);

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peak, startTime + attack);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, startTime + attack + decay);
    gainNode.gain.setValueAtTime(sustainLevel, sustainEnd);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);
  }

  let lastChordFreqs = null;
  let lastChordArpeggio = true;
  let lastChordRootMidi = null;

  async function _playChordFreqs(freqs, playArpeggio) {
    const audioCtx = await _ensureRunning();
    const now = audioCtx.currentTime + 0.05;

    // Phase 1: block chord (all notes simultaneously)
    const blockDuration = 0.85;
    for (const freq of freqs) {
      buildChordTone(freq, now, blockDuration, audioCtx);
    }

    let totalDuration;
    if (playArpeggio) {
      // Phase 2: ascending arpeggio (helps the ear isolate individual notes)
      const arpStart = now + blockDuration + 0.18;
      const arpSpacing = 0.20;
      const arpNoteDuration = 0.65;
      for (let i = 0; i < freqs.length; i++) {
        buildChordTone(freqs[i], arpStart + i * arpSpacing, arpNoteDuration, audioCtx);
      }
      totalDuration = blockDuration + 0.18 + (freqs.length - 1) * arpSpacing + arpNoteDuration + 0.1;
    } else {
      totalDuration = blockDuration + 0.1;
    }

    return new Promise(resolve => setTimeout(resolve, totalDuration * 1000));
  }

  // playChord picks a random root in a comfortable mid range
  function playChord(semitones, playArpeggio = true) {
    // semitones is an array like [0, 4, 7]
    const maxOffset = Math.max(...semitones);
    // C4–C5 range (MIDI 60–72): low enough for warmth, high enough for clarity.
    // Below C4 intervals become muddy (critical bandwidth effect).
    const minRoot = 60;
    const maxRoot = Math.min(69, 72 - maxOffset); // C4 to A4 at most
    const rootMidi = Math.round(minRoot + Math.random() * (maxRoot - minRoot));
    const freqs = semitones.map(s => midiToFreq(rootMidi + s));

    lastChordFreqs = freqs;
    lastChordArpeggio = playArpeggio;
    lastChordRootMidi = rootMidi;
    lastRootFreq = null; // clear interval replay state

    return _playChordFreqs(freqs, playArpeggio);
  }

  // Play any chord from the same root as the last played chord —
  // used to let the user hear their wrong answer vs. the correct one.
  function playChordFromLastRoot(semitones, playArpeggio = true) {
    if (lastChordRootMidi === null) return Promise.resolve();
    const freqs = semitones.map(s => midiToFreq(lastChordRootMidi + s));
    return _playChordFreqs(freqs, playArpeggio);
  }

  // ── Unified replay ─────────────────────────────────────────────────────────

  function replay() {
    if (lastChordFreqs !== null) {
      return _playChordFreqs(lastChordFreqs, lastChordArpeggio);
    }
    if (lastRootFreq !== null) {
      return _playIntervalFreqs(lastRootFreq, lastIntervalFreq, lastIntervalDirection);
    }
    return Promise.resolve();
  }

  return { unlock, play, playChord, playChordFromLastRoot, replay };
})();
