// intervals.js — Interval definitions, reference songs, and unlock groups

const INTERVALS = [
  {
    id: 'm2',
    name: 'Minor 2nd',
    short: 'm2',
    semitones: 1,
    color: '#e74c3c',
    songs: {
      ascending: [
        { title: 'Jaws Theme', hint: 'da-DUM opening motif' },
        { title: 'Pink Panther Theme', hint: 'first two notes' },
      ],
      descending: [
        { title: 'Joy to the World', hint: 'opening descent (Joy TO)' },
        { title: 'Für Elise', hint: 'E-D# opening turn' },
      ],
      harmonic: [
        { title: 'Cluster / Dissonance', hint: 'very tense sound, nearly the same pitch' },
      ],
    },
  },
  {
    id: 'M2',
    name: 'Major 2nd',
    short: 'M2',
    semitones: 2,
    color: '#e67e22',
    songs: {
      ascending: [
        { title: 'Happy Birthday', hint: '"Hap-py" — first two notes' },
        { title: 'Mary Had a Little Lamb', hint: 'first two notes (B-A)' },
      ],
      descending: [
        { title: 'Mary Had a Little Lamb', hint: 'first two notes descending' },
        { title: 'Three Blind Mice', hint: 'first two notes' },
      ],
      harmonic: [
        { title: 'Open 2nd', hint: 'slightly dissonant, gentle tension' },
      ],
    },
  },
  {
    id: 'm3',
    name: 'Minor 3rd',
    short: 'm3',
    semitones: 3,
    color: '#f1c40f',
    songs: {
      ascending: [
        { title: 'Smoke on the Water', hint: 'opening riff (G-Bb)' },
        { title: 'Greensleeves', hint: 'first two notes (A-C)' },
        { title: 'Iron Man', hint: 'opening guitar figure' },
      ],
      descending: [
        { title: 'Hey Jude', hint: '"Hey JUDE" — opening' },
        { title: 'Brahms Lullaby', hint: 'first two notes' },
      ],
      harmonic: [
        { title: 'Minor chord inner interval', hint: 'slightly dark, nostalgic' },
      ],
    },
  },
  {
    id: 'M3',
    name: 'Major 3rd',
    short: 'M3',
    semitones: 4,
    color: '#2ecc71',
    songs: {
      ascending: [
        { title: 'When the Saints Go Marching In', hint: '"Oh WHEN the" — first three notes use M3' },
        { title: 'For He\'s a Jolly Good Fellow', hint: 'opening leap' },
        { title: 'Oh Christmas Tree', hint: 'first two notes' },
      ],
      descending: [
        { title: 'Swing Low, Sweet Chariot', hint: 'opening descent' },
        { title: 'Loch Lomond', hint: '"You\'ll take the HIGH road" — descending major 3rd' },
      ],
      harmonic: [
        { title: 'Major chord inner interval', hint: 'bright, happy sound' },
      ],
    },
  },
  {
    id: 'P4',
    name: 'Perfect 4th',
    short: 'P4',
    semitones: 5,
    color: '#1abc9c',
    songs: {
      ascending: [
        { title: 'Here Comes the Bride', hint: '"HERE comes the" — opening' },
        { title: 'Amazing Grace', hint: '"A-MAZING" — first two notes' },
        { title: 'O Come All Ye Faithful', hint: 'first two notes' },
      ],
      descending: [
        { title: 'Eine Kleine Nachtmusik', hint: 'Mozart — opening figure' },
        { title: 'Born to Be Wild', hint: 'opening riff' },
      ],
      harmonic: [
        { title: 'Open 4th', hint: 'consonant but slightly suspended-sounding' },
      ],
    },
  },
  {
    id: 'TT',
    name: 'Tritone',
    short: 'TT',
    semitones: 6,
    color: '#9b59b6',
    songs: {
      ascending: [
        { title: 'Maria (West Side Story)', hint: '"Ma-RI-a" — first two syllables' },
        { title: 'The Simpsons Theme', hint: 'opening two notes' },
        { title: 'Black Sabbath', hint: 'opening riff' },
      ],
      descending: [
        { title: 'The Simpsons Theme', hint: 'also works descending' },
        { title: 'YYZ (Rush)', hint: 'intro in Morse code rhythm' },
      ],
      harmonic: [
        { title: 'Diabolus in Musica', hint: 'maximally dissonant — the "devil\'s interval"' },
      ],
    },
  },
  {
    id: 'P5',
    name: 'Perfect 5th',
    short: 'P5',
    semitones: 7,
    color: '#3498db',
    songs: {
      ascending: [
        { title: 'Star Wars Theme', hint: 'opening two notes' },
        { title: 'Twinkle Twinkle Little Star', hint: 'first two notes (C-G)' },
        { title: 'Scarborough Fair', hint: 'opening leap' },
      ],
      descending: [
        { title: 'The Flintstones', hint: 'first two notes' },
        { title: 'Feelings', hint: 'opening descending leap' },
      ],
      harmonic: [
        { title: 'Power chord', hint: 'very open, consonant, "strong" sound' },
      ],
    },
  },
  {
    id: 'm6',
    name: 'Minor 6th',
    short: 'm6',
    semitones: 8,
    color: '#e74c3c',
    songs: {
      ascending: [
        { title: 'The Entertainer (Joplin)', hint: 'repeated m6 leaps in melody' },
        { title: 'In My Life (Beatles)', hint: 'opening interval' },
        { title: 'Go Down Moses', hint: '"LET my people" opening leap' },
      ],
      descending: [
        { title: 'Love Story Theme', hint: 'Francis Lai — opening' },
        { title: 'Where Do I Begin', hint: 'opening descent' },
      ],
      harmonic: [
        { title: 'Minor 6th', hint: 'lush, somewhat melancholic' },
      ],
    },
  },
  {
    id: 'M6',
    name: 'Major 6th',
    short: 'M6',
    semitones: 9,
    color: '#e67e22',
    songs: {
      ascending: [
        { title: 'My Bonnie Lies Over the Ocean', hint: '"My BON-nie" — opening leap' },
        { title: 'NBC Chime', hint: 'the classic three-note TV jingle (N-B-C)' },
        { title: 'Dashing Through the Snow', hint: 'Jingle Bells opening' },
      ],
      descending: [
        { title: 'Nobody Knows the Trouble I\'ve Seen', hint: 'opening descent' },
        { title: 'Sweet Caroline', hint: '"sweet" to "Car-" in the chorus' },
      ],
      harmonic: [
        { title: 'Major 6th', hint: 'bright, sweet, open sound' },
      ],
    },
  },
  {
    id: 'm7',
    name: 'Minor 7th',
    short: 'm7',
    semitones: 10,
    color: '#f1c40f',
    songs: {
      ascending: [
        { title: 'Somewhere (West Side Story)', hint: '"There\'s a PLACE for us" — "there\'s a"' },
        { title: 'Star Trek Theme (TV)', hint: 'opening interval' },
        { title: 'Watermelon Man', hint: 'Herbie Hancock — opening' },
      ],
      descending: [
        { title: 'White Christmas', hint: '"I\'m DREAM-ing of a" opening' },
        { title: 'Somewhere (West Side Story)', hint: 'descending variation' },
      ],
      harmonic: [
        { title: 'Dominant 7th inner interval', hint: 'bluesy, tense — wants to resolve' },
      ],
    },
  },
  {
    id: 'M7',
    name: 'Major 7th',
    short: 'M7',
    semitones: 11,
    color: '#2ecc71',
    songs: {
      ascending: [
        { title: 'Take On Me (A-ha)', hint: 'opening melody jump' },
        { title: 'Bali Ha\'i (South Pacific)', hint: 'opening leap' },
        { title: 'Don\'t Know Why (Norah Jones)', hint: '"I wait-ED" opening' },
      ],
      descending: [
        { title: 'I Love You (Cole Porter)', hint: 'opening descent' },
        { title: 'Half of My Heart (John Mayer)', hint: 'chorus opening' },
      ],
      harmonic: [
        { title: 'Major 7th', hint: 'very tense, yearning — wants to resolve up or down' },
      ],
    },
  },
  {
    id: 'P8',
    name: 'Octave',
    short: 'P8',
    semitones: 12,
    color: '#3498db',
    songs: {
      ascending: [
        { title: 'Somewhere Over the Rainbow', hint: '"Some-WHERE" — opening' },
        { title: 'Singin\' in the Rain', hint: '"Sing-IN\'" — opening' },
        { title: 'Willow Weep for Me', hint: 'opening leap' },
      ],
      descending: [
        { title: 'Willow Weep for Me', hint: 'descending octave opening' },
        { title: 'Fool on the Hill (Beatles)', hint: 'descending octave' },
      ],
      harmonic: [
        { title: 'Octave unison', hint: 'perfectly consonant — same note, doubled' },
      ],
    },
  },
];

// Lookup by id
const INTERVAL_MAP = Object.fromEntries(INTERVALS.map(i => [i.id, i]));

// Unlock groups: intervals are introduced in this order (ascending first)
// Each group unlocks when the PREVIOUS group's active cards reach minMastery
const UNLOCK_GROUPS = [
  { intervals: ['P8', 'P5'], minMasteryToUnlockNext: 0.60 },
  { intervals: ['P4'],       minMasteryToUnlockNext: 0.60 },
  { intervals: ['M2', 'm2'], minMasteryToUnlockNext: 0.62 },
  { intervals: ['M3', 'm3'], minMasteryToUnlockNext: 0.62 },
  { intervals: ['TT'],       minMasteryToUnlockNext: 0.65 },
  { intervals: ['M6', 'm6'], minMasteryToUnlockNext: 0.65 },
  { intervals: ['M7', 'm7'], minMasteryToUnlockNext: 0.65 },
];

// Thresholds for unlocking additional directions
const DIRECTION_THRESHOLDS = {
  unlockDescending: 0.70, // ascending mastery needed to unlock descending for that interval
  unlockHarmonic:   0.75, // descending mastery needed to unlock harmonic for that interval
};
