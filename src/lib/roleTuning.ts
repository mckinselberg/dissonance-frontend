/**
 * Role-Based Tuning System
 * 
 * Pitch is political. Harmony is subjective. Tuning is worldview.
 * 
 * Each role in SignalNet perceives music at a slightly different reference pitch,
 * creating cognitive dissonance when players from different factions interact.
 * 
 * HISTORICAL CONTEXT:
 * - A440 became "standard" in 1939 (ISO 16) but wasn't universal until 1950s
 * - French orchestras used A445 (bright, tense, authoritarian)
 * - Italian "Verdi tuning" A432 claimed to be "natural" (conspiracy theories)
 * - Baroque music used A415 (half-step lower than modern)
 * - Wind instruments in flat keys because they were tuned against strings
 * - A cappella groups naturally drift sharp or flat based on timbre
 * 
 * dk:vision This creates a "tuning war" mechanic in multiplayer:
 * - Operator music sounds "off" to Citizens (too bright, too tense)
 * - Resistance music sounds "wrong" to Operators (too warm, too rebellious)
 * - Citizens conditioned to accept A440 as "truth" but it's arbitrary
 * 
 * dk:music When players with different tunings hear each other's signals,
 * the beat frequencies create interference patterns (subtle warbling)
 * 
 * dk:business Future: Let players VOTE on faction tuning (democracy = harmony?)
 */

import { getCFromA, TUNING_STANDARDS } from './synodScale';

export type PlayerRole = 'operator' | 'citizen' | 'resistance' | 'admin';

/**
 * Role-specific tuning references
 */
export const ROLE_TUNING: Record<PlayerRole, number> = {
  // Synod Operator: A445 (French standard - bright, tense, authoritarian)
  // Sounds "sharp" and aggressive to Citizens
  operator: TUNING_STANDARDS.A445,
  
  // Citizen: A440 (ISO 16 standard - conditioned as "truth")
  // The regime teaches this is "correct" pitch
  citizen: TUNING_STANDARDS.A440,
  
  // Resistance: A435 (Philharmonic pitch - warm, historical, rebellious)
  // Sounds "flat" and subversive to Operators
  resistance: TUNING_STANDARDS.A435,
  
  // Admin/Developer: A440 (neutral reference for debugging)
  admin: TUNING_STANDARDS.A440,
};

/**
 * Get base frequency (C4) for a given role's tuning
 */
export const getRoleBaseFrequency = (role: PlayerRole): number => {
  return getCFromA(ROLE_TUNING[role]);
};

/**
 * Calculate beat frequency between two roles
 * (Creates audible "warbling" when music overlaps)
 */
export const getBeatFrequency = (role1: PlayerRole, role2: PlayerRole, semitone: number = 0): number => {
  const freq1 = getRoleBaseFrequency(role1) * Math.pow(2, semitone / 12);
  const freq2 = getRoleBaseFrequency(role2) * Math.pow(2, semitone / 12);
  return Math.abs(freq1 - freq2); // Difference frequency (beats per second)
};

/**
 * Detune amount in cents between two roles
 * (How "off" one role sounds to another)
 */
export const getDetuningCents = (role1: PlayerRole, role2: PlayerRole): number => {
  const freq1 = ROLE_TUNING[role1];
  const freq2 = ROLE_TUNING[role2];
  return 1200 * Math.log2(freq1 / freq2); // Cents difference
};

/**
 * Example detuning values:
 * - Operator (A445) vs Citizen (A440): +19.6 cents (noticeably sharp)
 * - Resistance (A435) vs Citizen (A440): -19.9 cents (noticeably flat)
 * - Operator vs Resistance: +39.5 cents (clash! nearly quartertone)
 * 
 * dk:music 20 cents = noticeable dissonance, 40 cents = clear "wrong" feeling
 * dk:ux Players will unconsciously distrust each other's signals!
 */

/**
 * Tuning narrative mapping
 */
export const TUNING_NARRATIVE = {
  operator: {
    name: 'French Sharp',
    hz: 445,
    description: 'Bright, tense, authoritarian. The regime\'s chosen pitch.',
    connotation: 'Aggressive, cutting, surveillance-like',
    historicalUse: 'French orchestras (pre-1940s), military bands'
  },
  citizen: {
    name: 'ISO Standard',
    hz: 440,
    description: 'The "correct" pitch you\'ve been taught to accept.',
    connotation: 'Neutral, conditioned, compliant',
    historicalUse: 'International standard (1939-present)'
  },
  resistance: {
    name: 'Philharmonic Warm',
    hz: 435,
    description: 'Historical, warm, rebellious. The old ways.',
    connotation: 'Nostalgic, human, defiant',
    historicalUse: 'Vienna Philharmonic (1885), Verdi\'s preference'
  },
  admin: {
    name: 'Debug Reference',
    hz: 440,
    description: 'Neutral reference for development/testing.',
    connotation: 'Objective reality (if such a thing exists)',
    historicalUse: 'Scientific pitch standard'
  }
} as const;

/**
 * Future mechanics:
 * 
 * 1. TUNING DRIFT
 *    - Citizens exposed to Operator signals slowly drift toward A445
 *    - Resistance members gradually pull toward A435
 *    - Create "tuning meter" showing current reference pitch
 * 
 * 2. TUNING JAMMING
 *    - Resistance can broadcast A435 signals to "detune" Citizens
 *    - Operators can enforce A445 through infrastructure
 *    - Tuning becomes a territory control mechanic
 * 
 * 3. BEAT FREQUENCY WEAPONS
 *    - When two signals at different tunings overlap, beat frequency = weapon
 *    - A445 vs A435 = ~3 Hz warbling (disorienting)
 *    - Could trigger anxiety, confusion, or reveal hidden agents
 * 
 * 4. A CAPPELLA GROUPS
 *    - Resistance safe houses use unaccompanied singing
 *    - Naturally drift flat (away from regime's sharp tuning)
 *    - Operators can detect by frequency analysis
 * 
 * 5. WIND INSTRUMENTS IN FLAT KEYS
 *    - Brass/woodwinds naturally sound "flat" to Operators
 *    - Makes Resistance musicians identifiable
 *    - But also creates plausible deniability (historical practice)
 * 
 * dk:vision The entire game is a metaphor for propaganda vs truth
 * dk:music What if "truth" is just the tuning you were raised with?
 * dk:business Multiplayer "tuning wars" = emergent faction identity
 */

export default {
  ROLE_TUNING,
  getRoleBaseFrequency,
  getBeatFrequency,
  getDetuningCents,
  TUNING_NARRATIVE
};
