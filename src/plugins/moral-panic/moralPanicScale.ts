/**
 * Moral Panic Microtonal Scale
 * 
 * Dystopian music scale emphasizing tritone (devil's interval) and dissonance.
 * Creates aesthetic of "corrupting" music that Authority fears.
 * 
 * **Key Differences from Synod Scale:**
 * - More tritone emphasis (600¢ = forbidden/rebellion)
 * - Wider intervals (exaggerated drama)
 * - Blues notes (cultural authenticity)
 * - Hip-hop sub-bass (low-frequency power)
 * 
 * dk:music Authority hears this as "dangerous," Musicians hear as "authentic"
 */

// ============================================================================
// MORAL PANIC SCALE INTERVALS (in cents from C)
// ============================================================================

export const MORAL_PANIC_SCALE = {
  // Core intervals (similar to Synod but more extreme)
  unison: 0,                    // C (tonic, stable)
  bluesSecond: 200,             // ~D (blues note, 9:8 ratio)
  minorThird: 300,              // Eb (melancholic, standard minor)
  tritone: 600,                 // F# (DEVIL'S INTERVAL - central to rebellion)
  blueFifth: 700,               // G (perfect fifth, grounding)
  bluesNinth: 1000,             // ~Bb (blues seventh, 16:9 ratio)
  
  // Extended intervals (for layering)
  rebelliousSecond: 150,        // Db (tension, close to propaganda tone)
  corruptingThird: 350,         // ~E (hollow, surveillance third reused)
  defianceFourth: 500,          // F (augmented fourth approach)
  disobedientSixth: 850,        // ~Ab (authority's decree sixth)
  subversiveSeventh: 1050,      // ~Bb (unresolved, propaganda seventh)
  
  // Hip-hop influence (sub-bass)
  subBass: -1200,               // C one octave down (808 kick vibes)
  
  octave: 1200                  // C (return to tonic, 2:1 ratio)
} as const;

// Type for scale interval keys
export type MoralPanicInterval = keyof typeof MORAL_PANIC_SCALE;

// ============================================================================
// ROLE-BASED TUNING (same as SignalNet)
// ============================================================================

export const ROLE_BASE_FREQUENCIES = {
  authority: 445,  // A445 - Bright, authoritarian (everything sounds "too loud")
  musician: 435,   // A435 - Warm, rebellious (sounds "authentic")
  kid: 440,        // A440 - Conditioned standard (shifts with corruption)
} as const;

/**
 * Calculate kid's base frequency based on corruption level
 * 
 * As corruption increases, tuning drifts from A440 → A435 (toward Musicians)
 * Creates cognitive dissonance with Authority (A445) as kid rebels
 * 
 * Formula: frequency = 440 - (corruption * 0.05)
 * - corruption=0:   440 Hz (aligned with Authority)
 * - corruption=50:  437.5 Hz (neutral, conflicted)
 * - corruption=100: 435 Hz (aligned with Musicians)
 */
export function getKidBaseFrequency(corruptionLevel: number): number {
  // Clamp corruption to 0-100
  const corruption = Math.max(0, Math.min(100, corruptionLevel));
  
  // Linear drift from 440 → 435
  return 440 - (corruption * 0.05);
}

/**
 * Get base frequency for role
 */
export function getRoleBaseFrequency(
  role: 'authority' | 'musician' | 'kid',
  corruptionLevel?: number
): number {
  if (role === 'kid' && corruptionLevel !== undefined) {
    return getKidBaseFrequency(corruptionLevel);
  }
  return ROLE_BASE_FREQUENCIES[role];
}

// ============================================================================
// FREQUENCY CONVERSION
// ============================================================================

/**
 * Convert cents to frequency
 * 
 * Formula: freq = baseFreq * 2^(cents/1200)
 */
export function centsToFrequency(baseFrequency: number, cents: number): number {
  return baseFrequency * Math.pow(2, cents / 1200);
}

/**
 * Convert frequency to cents (relative to base)
 */
export function frequencyToCents(frequency: number, baseFrequency: number): number {
  return 1200 * Math.log2(frequency / baseFrequency);
}

// ============================================================================
// CHORD DEFINITIONS (Cultural Themes)
// ============================================================================

/**
 * Predefined chords for different cultural contexts
 */
export const MORAL_PANIC_CHORDS = {
  // Authority (hymns, patriotic, "safe" music)
  hymn: [0, 400, 700],                      // C-E-G (major triad, consonant)
  patriotic: [0, 200, 500, 700, 1000],     // Pentatonic (wholesome)
  
  // Clean Pop (Beatles, early rock)
  popMajor: [0, 400, 700, 1100],           // Cmaj7 (sophisticated but safe)
  popMinor: [0, 300, 700, 1000],           // Cm7 (melancholic but approved)
  
  // Rock/Metal (rebellious)
  powerChord: [0, 700, 1200],              // C-G-C (no third = raw)
  tritoneChord: [0, 600, 1200],            // C-F#-C (DEVIL'S INTERVAL!)
  bluesChord: [0, 300, 700, 1000],         // C-Eb-G-Bb (authentic blues)
  
  // Punk/Industrial (chaos)
  dissonantCluster: [0, 100, 200, 300],    // Chromatic cluster (noise)
  anarchyChord: [0, 150, 600, 850],        // Maximum tension
  
  // Hip-Hop (sub-bass + sparse harmony)
  hipHopBass: [-1200, 0, 700],             // Sub-bass + fifth (808 kick)
  rapChord: [0, 300, 600, 1000],           // Minor + tritone (menacing)
} as const;

export type ChordName = keyof typeof MORAL_PANIC_CHORDS;

/**
 * Get chord intervals by name
 */
export function getChord(name: ChordName): number[] {
  return [...MORAL_PANIC_CHORDS[name]];
}

// ============================================================================
// ADAPTIVE MUSIC LAYERS (Corruption-Based)
// ============================================================================

/**
 * Music layers activate based on corruption score (0-100)
 * Similar to SignalNet's risk-based layers but culturally themed
 */
export interface MusicLayer {
  name: string;
  corruptionThreshold: number;  // Activates when corruption >= this
  intervals: number[];           // Cents values
  waveType: OscillatorType;
  volume: number;                // 0.0 - 1.0
  description: string;
}

export const MORAL_PANIC_LAYERS: MusicLayer[] = [
  {
    name: 'hymns',
    corruptionThreshold: 0.0,   // Always playing (Authority's "safe" baseline)
    intervals: [0, 400, 700],   // Major triad
    waveType: 'sine',
    volume: 0.15,
    description: 'Church hymns, wholesome music. Authority approves.'
  },
  {
    name: 'clean_pop',
    corruptionThreshold: 20.0,  // Innocent exploration
    intervals: [0, 200, 500, 700], // Pentatonic
    waveType: 'triangle',
    volume: 0.20,
    description: 'Beatles, clean rock. Parents tolerate.'
  },
  {
    name: 'rock_riffs',
    corruptionThreshold: 40.0,  // Active rebellion
    intervals: [0, 700, 1200],  // Power chord
    waveType: 'sawtooth',
    volume: 0.25,
    description: 'Stones, hard rock. Parents disapprove.'
  },
  {
    name: 'metal_assault',
    corruptionThreshold: 60.0,  // Counter-culture aligned
    intervals: [0, 600, 1200],  // Tritone chord (DEVIL!)
    waveType: 'sawtooth',
    volume: 0.30,
    description: 'Sabbath, Judas Priest. Authority panics.'
  },
  {
    name: 'punk_chaos',
    corruptionThreshold: 80.0,  // Fully corrupted
    intervals: [0, 150, 600, 850], // Maximum dissonance
    waveType: 'square',
    volume: 0.35,
    description: 'Punk, industrial, gangsta rap. Complete rebellion.'
  }
];

/**
 * Get active layers based on corruption score
 */
export function getActiveLayers(corruptionScore: number): MusicLayer[] {
  return MORAL_PANIC_LAYERS.filter(
    layer => corruptionScore >= layer.corruptionThreshold
  );
}

// ============================================================================
// GENRE-SPECIFIC SCALES (Future Expansion)
// ============================================================================

/**
 * Different genres emphasize different intervals
 * 
 * dk:reminder Implement genre-specific scales for historical accuracy
 */
export const GENRE_SCALES = {
  rock: [0, 200, 300, 500, 700, 1000, 1200],           // Blues scale
  metal: [0, 100, 300, 600, 700, 1000, 1200],          // Phrygian + tritone
  punk: [0, 200, 300, 700, 1000, 1200],                // Simplified, raw
  hip_hop: [-1200, 0, 300, 700, 1000],                 // Sub-bass + minor
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate beat frequency between two slightly detuned notes
 * 
 * When Authority (A445) and Kid (A440) play same note, creates beating
 * Frequency of beating = |freq1 - freq2|
 */
export function calculateBeatFrequency(freq1: number, freq2: number): number {
  return Math.abs(freq1 - freq2);
}

/**
 * Get corruption level description
 */
export function getCorruptionLevelName(corruption: number): string {
  if (corruption < 20) return 'Innocent';
  if (corruption < 40) return 'Curious';
  if (corruption < 60) return 'Rebellious';
  if (corruption < 80) return 'Subversive';
  return 'Corrupted';
}

// dk:music Crossfade duration = 2 seconds (same as SignalNet)
export const CROSSFADE_DURATION = 2.0;

// dk:music Smooth pitch glide for frequency changes
export const PITCH_GLIDE_DURATION = 0.1; // 100ms
