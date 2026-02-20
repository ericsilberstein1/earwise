# earwise — Adaptive Ear Trainer

**[▶ Live app →](https://ericsilberstein1.github.io/earwise/)**

A static HTML/JS music ear training app with adaptive learning, spaced repetition, and progressive unlocking. Currently trains **interval recognition** and **chord recognition**.

## Features

- **Adaptive learning**: each interval × direction (ascending / descending / harmonic) is tracked as a separate skill with a mastery score (0–100%)
- **Spaced repetition (SM-2)**: cards you struggle with come back more often; mastered cards are scheduled at growing intervals
- **Progressive disclosure**: starts you with just 2 intervals (Octave + Perfect 5th) and unlocks new ones as you improve, in research-backed pedagogical order
- **Direction progression**: ascending → descending → harmonic unlocked per interval as mastery grows
- **Reference songs**: real, recognizable songs as mnemonics for each interval and direction
- **Keyboard shortcuts**: number keys 1–9, 0 to select answers; `R` to replay
- **Persistence**: all progress saved to localStorage; export/import JSON backups
- **No backend, no build step** — open `index.html` in any modern browser

## Interval Unlock Order

1. **Octave + Perfect 5th** (most distinctive, started immediately)
2. **Perfect 4th**
3. **Major 2nd + Minor 2nd** (stepwise motion)
4. **Major 3rd + Minor 3rd** (chord quality)
5. **Tritone** (maximally distinctive dissonance)
6. **Major 6th + Minor 6th**
7. **Minor 7th + Major 7th**

For each interval, **ascending** unlocks first, then **descending** (at 70% mastery), then **harmonic** (at 75% descending mastery).

## Running Locally

```
open index.html
```
or serve with any static file server:
```
npx serve .
```

## Chord Recognition

7 chord types in pedagogical order:
1. **Major / Minor** (start here — the most fundamental contrast)
2. **Diminished**
3. **Augmented**
4. **Dominant 7th / Major 7th**
5. **Minor 7th**

Each chord is played as a **block chord** (all notes simultaneously) followed immediately by an **ascending arpeggio** — giving the ear both the gestalt color and the individual pitches.

## Roadmap

- [x] Interval recognition (ascending / descending / harmonic)
- [x] Chord recognition (major / minor / dim / aug / dom7 / maj7 / min7)
- [ ] Scale recognition
- [ ] Melodic dictation
- [ ] Visual staff notation (VexFlow integration)
- [ ] Mobile PWA / offline support
