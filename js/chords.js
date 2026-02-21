// chords.js — Chord definitions and unlock groups

const CHORDS = [
  {
    id: 'major',
    name: 'Major',
    short: 'maj',
    semitones: [0, 4, 7],
    color: '#2ecc71',
    character: 'Bright, happy, stable — the foundation of Western music',
    songs: [
      { title: 'Let It Be — Beatles', hint: 'C major opens each verse; settled, bright quality' },
      { title: 'Here Comes the Sun — Beatles', hint: 'D major throughout — open and joyful' },
      { title: 'Any I chord in a major key', hint: 'the "home base" — fully at rest' },
    ],
  },
  {
    id: 'minor',
    name: 'Minor',
    short: 'min',
    semitones: [0, 3, 7],
    color: '#3498db',
    character: 'Dark, melancholic, stable — same 5th as major, but flattened 3rd',
    songs: [
      { title: 'Stairway to Heaven — Led Zeppelin', hint: 'opens on A minor — introspective, dark' },
      { title: 'Nothing Else Matters — Metallica', hint: 'E minor opening — heavy, serious' },
      { title: 'Moonlight Sonata — Beethoven', hint: 'C# minor throughout — deeply melancholic' },
    ],
  },
  {
    id: 'diminished',
    name: 'Diminished',
    short: 'dim',
    semitones: [0, 3, 6],
    color: '#e74c3c',
    character: 'Tense, unstable, dark — two minor 3rds stacked, the tritone inside creates maximum tension',
    songs: [
      { title: 'Für Elise — Beethoven', hint: 'B diminished chord appears prominently in the A section' },
      { title: 'Classic horror film scores', hint: 'the archetypal "spooky" chord' },
      { title: 'The vii° chord in any major key', hint: 'built on the 7th scale degree — urgently wants to resolve home' },
    ],
  },
  {
    id: 'augmented',
    name: 'Augmented',
    short: 'aug',
    semitones: [0, 4, 8],
    color: '#e67e22',
    character: 'Eerie, unresolved, dreamy — major triad with a raised 5th; symmetrical and unstable',
    songs: [
      { title: 'Oh! You Pretty Things — David Bowie', hint: 'augmented chord is the distinctive signature sound' },
      { title: 'When I\'m Sixty-Four — Beatles', hint: 'augmented chord colors the intro' },
      { title: 'Cry Me a River — Julie London', hint: 'used to create that yearning, unresolved feeling' },
    ],
  },
  {
    id: 'dom7',
    name: 'Dominant 7th',
    short: 'dom7',
    semitones: [0, 4, 7, 10],
    color: '#f39c12',
    character: 'Tense, bluesy — major triad + minor 7th; contains a tritone that pulls strongly toward resolution',
    songs: [
      { title: 'Virtually every blues song', hint: 'I7–IV7–V7 is the foundation of the blues idiom' },
      { title: 'Johnny B. Goode — Chuck Berry', hint: 'the opening G7 riff defines rock and roll' },
      { title: 'A Hard Day\'s Night — Beatles', hint: 'that famous opening chord is a dominant 7th variant' },
    ],
  },
  {
    id: 'maj7',
    name: 'Major 7th',
    short: 'maj7',
    semitones: [0, 4, 7, 11],
    color: '#9b59b6',
    character: 'Lush, dreamy, sophisticated — major triad + major 7th; consonant yet complex',
    songs: [
      { title: 'Misty — Erroll Garner', hint: 'Fmaj7 opens the iconic jazz melody' },
      { title: 'Don\'t Know Why — Norah Jones', hint: 'maj7 chords throughout; warm and intimate' },
      { title: 'Bali Ha\'i — South Pacific', hint: 'the lush maj7 opening sets the exotic, dreamy tone' },
    ],
  },
  {
    id: 'min7',
    name: 'Minor 7th',
    short: 'min7',
    semitones: [0, 3, 7, 10],
    color: '#1abc9c',
    character: 'Mellow, cool, jazzy — minor triad + minor 7th; less tense than dominant 7th, more complex than plain minor',
    songs: [
      { title: 'So What — Miles Davis', hint: 'the entire head is two min7 chords — the quintessential jazz sound' },
      { title: 'Superstition — Stevie Wonder', hint: 'Eb minor 7th groove drives the whole song' },
      { title: 'A Whiter Shade of Pale — Procol Harum', hint: 'Am7 colors the famous descending bass line' },
    ],
  },

  // ── Inversions (unlocked after root-position mastery) ──────────────────────

  {
    id: 'major_inv1',
    name: 'Major (1st inv)',
    short: 'maj¹',
    semitones: [0, 3, 8], // 3rd in bass: e.g. E–G–C
    color: '#27ae60',
    character: 'Bright major quality, but lighter — the 3rd in the bass creates smooth upward voice leading; less grounded than root position',
    songs: [
      { title: 'Something — Beatles', hint: 'C/E (I6) gives the verse its characteristic smooth, lifted quality' },
      { title: 'Let It Be — Beatles', hint: 'C/E passing chord in the verse; notice the lighter feel vs. root C' },
      { title: 'Ode to Joy — Beethoven', hint: 'I6 chords create smooth voice leading throughout the melody' },
    ],
  },
  {
    id: 'major_inv2',
    name: 'Major (2nd inv)',
    short: 'maj²',
    semitones: [0, 5, 9], // 5th in bass: e.g. G–C–E
    color: '#1e8449',
    character: 'Bright but unstable — the 5th in the bass creates a floating, suspended tension; commonly heard at cadences before resolution',
    songs: [
      { title: 'Cadential 6/4 in classical music', hint: 'the I6/4 just before a V chord — listen for the floating, anticipatory feeling' },
      { title: 'Don\'t Stop Believin\' — Journey', hint: 'the piano intro includes this unstable 2nd-inversion color' },
      { title: 'Wedding marches and hymns', hint: 'the 2nd inversion often appears at melodic climaxes before a strong cadence' },
    ],
  },
  {
    id: 'minor_inv1',
    name: 'Minor (1st inv)',
    short: 'min¹',
    semitones: [0, 4, 9], // minor 3rd in bass: e.g. Eb–G–C
    color: '#2980b9',
    character: 'Dark minor quality, but lighter in the bass — the minor 3rd below creates a descending bass-line feel; bittersweet and mobile',
    songs: [
      { title: 'Stairway to Heaven — Led Zeppelin', hint: 'Am/C (Am 1st inv) in the iconic descending intro bass line' },
      { title: 'Scarborough Fair — Simon & Garfunkel', hint: 'i6 chords shape the descending chromatic bass throughout' },
      { title: 'The Sound of Silence — Simon & Garfunkel', hint: 'minor 1st inversions anchor the falling bass passages' },
    ],
  },
  {
    id: 'minor_inv2',
    name: 'Minor (2nd inv)',
    short: 'min²',
    semitones: [0, 5, 8], // 5th in bass: e.g. G–C–Eb
    color: '#1a5276',
    character: 'Minor quality with a floating, unstable bass — the 5th below creates an ambiguous, suspended tension similar to major 2nd inv but darker',
    songs: [
      { title: 'Ave Maria — Schubert', hint: 'minor 2nd inversions float through the harmonic fabric under the melody' },
      { title: 'Minor cadential 6/4', hint: 'appears before cadential moments in minor keys — same floating feeling as major but darker' },
      { title: 'Nocturnes — Chopin', hint: 'Chopin uses i6/4 inversions to create yearning, unresolved passages' },
    ],
  },
];

const CHORD_MAP = Object.fromEntries(CHORDS.map(c => [c.id, c]));

// Pedagogical unlock order — start with the most fundamental contrast (major vs minor),
// then build through root-position qualities, then add inversions once the ear is trained.
const CHORD_UNLOCK_GROUPS = [
  { chords: ['major', 'minor'],                 minMasteryToUnlockNext: 0.60 },
  { chords: ['diminished'],                     minMasteryToUnlockNext: 0.62 },
  { chords: ['augmented'],                      minMasteryToUnlockNext: 0.65 },
  { chords: ['dom7', 'maj7'],                   minMasteryToUnlockNext: 0.65 },
  { chords: ['min7'],                           minMasteryToUnlockNext: 0.68 },
  // Inversions: introduced after all root-position qualities are solid
  { chords: ['major_inv1', 'minor_inv1'],       minMasteryToUnlockNext: 0.68 },
  { chords: ['major_inv2', 'minor_inv2'],       minMasteryToUnlockNext: 0.70 },
];
