// Standard 12-TET (Equal Temperament) - Traditional Western Music
export const STANDARD_12TET = {
  unison: 0,          // C
  minorSecond: 100,   // C# / Db
  majorSecond: 200,   // D
  minorThird: 300,    // D# / Eb
  majorThird: 400,    // E
  perfectFourth: 500, // F
  tritone: 600,       // F# / Gb (augmented fourth / diminished fifth)
  perfectFifth: 700,  // G
  minorSixth: 800,    // G# / Ab
  majorSixth: 900,    // A
  minorSeventh: 1000, // A# / Bb
  majorSeventh: 1100, // B
  octave: 1200        // C
} as const;

// Common chord progressions (in cents)
export const CHORD_PROGRESSIONS = {
  // I-IV-V-I (Classic "perfect" resolution)
  majorTonic: [0, 400, 700],        // C major (C-E-G)
  majorSubdominant: [500, 900, 1200], // F major (F-A-C)
  majorDominant: [700, 1100, 1400],  // G major (G-B-D)
  
  // Minor chords
  minorTonic: [0, 300, 700],        // C minor (C-Eb-G)
  
  // Seventh chords
  dominantSeventh: [700, 1100, 1400, 1700], // G7 (G-B-D-F)
  majorSeventh: [0, 400, 700, 1100],        // Cmaj7 (C-E-G-B)
  minorSeventh: [0, 300, 700, 1000],        // Cm7 (C-Eb-G-Bb)
  
  // Emotional chords
  diminished: [0, 300, 600],        // Diminished triad (unstable, tense)
  augmented: [0, 400, 800],         // Augmented triad (dreamlike, ethereal)
  sus4: [0, 500, 700],              // Suspended 4th (yearning, unresolved)
  sus2: [0, 200, 700],              // Suspended 2nd (open, hopeful)
} as const;

// Scales for melody generation
export const SCALES = {
  majorScale: [0, 200, 400, 500, 700, 900, 1100, 1200],
  minorScale: [0, 200, 300, 500, 700, 800, 1000, 1200],
  pentatonicMajor: [0, 200, 400, 700, 900, 1200],
  pentatonicMinor: [0, 300, 500, 700, 1000, 1200],
  bluesScale: [0, 300, 500, 600, 700, 1000, 1200],
  wholeTone: [0, 200, 400, 600, 800, 1000, 1200], // Dreamy, ambiguous
  diminishedScale: [0, 200, 300, 500, 600, 800, 900, 1100, 1200], // Jazzy, tense
} as const;

// Emotional mappings for UI
export const EMOTIONAL_PALETTES = {
  happy: {
    scale: 'majorScale',
    chords: ['majorTonic', 'majorSubdominant', 'majorDominant'],
    tempo: 120, // BPM
    timbre: 'sine', // Bright, pure
    description: 'Bright, uplifting, optimistic'
  },
  sad: {
    scale: 'minorScale',
    chords: ['minorTonic', 'minorSeventh'],
    tempo: 60,
    timbre: 'triangle', // Mellow, soft
    description: 'Melancholic, introspective, somber'
  },
  tense: {
    scale: 'diminishedScale',
    chords: ['diminished', 'dominantSeventh'],
    tempo: 140,
    timbre: 'square', // Sharp, edgy
    description: 'Anxious, unstable, suspenseful'
  },
  dreamy: {
    scale: 'wholeTone',
    chords: ['augmented', 'majorSeventh'],
    tempo: 80,
    timbre: 'sine',
    description: 'Ethereal, floating, otherworldly'
  },
  hopeful: {
    scale: 'pentatonicMajor',
    chords: ['sus2', 'sus4', 'majorTonic'],
    tempo: 100,
    timbre: 'sine',
    description: 'Yearning, optimistic, gentle'
  },
  bluesy: {
    scale: 'bluesScale',
    chords: ['minorSeventh', 'dominantSeventh'],
    tempo: 90,
    timbre: 'sawtooth', // Gritty, soulful
    description: 'Soulful, gritty, expressive'
  }
} as const;

// dk:music Traditional 12-TET provides the "correct" baseline that makes Synod scale sound "wrong"
// dk:reminder Players should feel emotional comfort in 12-TET vs dystopian unease in Synod
