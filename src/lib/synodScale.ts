// Synod Scale definition (in cents from C)
export const SYNOD_SCALE = {
  unison: 0,              // C (stable)
  propagandaTone: 150,    // ~Db (uneasy, 12:11 ratio)
  surveillanceThird: 350, // ~E (hollow, 11:9 ratio)
  regimeFourth: 480,      // ~F (tense, 21:16 ratio)
  tritone: 600,           // F# (FORBIDDEN - resistance symbol)
  controlFifth: 720,      // ~G (oppressive, 40:27 ratio)
  decreeSixth: 850,       // ~Ab (authoritative, 18:11 ratio)
  propagandaSeventh: 1050,// ~Bb (unresolved, 15:8 ratio)
  octave: 1200            // C (return to control, 2:1 ratio)
} as const;

// Pure intervals for Resistance (just intonation)
export const PURE_INTERVALS = {
  unison: 0,
  pureThird: 386,    // 5:4 (hope)
  pureFourth: 498,   // 4:3
  tritone: 590,      // 45:32 (defiance - EMBRACED by resistance)
  pureFifth: 702,    // 3:2 (truth)
  pureSixth: 814,    // 8:5
  pureSeventh: 1088, // 15:8
  octave: 1200       // 2:1
} as const;

// Convert cents to frequency
export const centsToFrequency = (baseFrequency: number, cents: number): number => {
  return baseFrequency * Math.pow(2, cents / 1200);
};

/**
 * TUNING REFERENCE FREQUENCIES
 * 
 * dk:vision Pitch is political! Different roles perceive different tunings:
 * - A440 (ISO 16): Modern "international standard" (post-1939)
 * - A432 (Verdi): "Natural tuning" (conspiracy theorists love this)
 * - A445 (French): Bright, tense, authoritarian (used by Synod regime)
 * - A435 (Philharmonic): Warm, historical (used by Resistance)
 * 
 * Wind instruments in flat keys, strings sharp, a cappella groups drift...
 * Perceived harmony is subjective and highly charged!
 * 
 * dk:music We can DETUNE each player's game across the full range of human musical expression
 * dk:business This becomes a multiplayer "tuning war" mechanic
 */
export const TUNING_STANDARDS = {
  // Modern standards
  A440: 440.00,  // ISO 16 standard (1939) - "neutral" reference
  A432: 432.00,  // "Verdi tuning" / "natural pitch" (conspiracy favorite)
  A445: 445.00,  // French diapason normal (bright, tense)
  
  // Historical standards
  A435: 435.00,  // Philharmonic pitch (warm, historical)
  A415: 415.00,  // Baroque pitch (half-step lower)
  A392: 392.00,  // Classical pitch (whole-step lower)
  
  // Extreme detunings (for chaos modes)
  A460: 460.00,  // Extreme sharp (disorienting)
  A410: 410.00,  // Extreme flat (oppressive)
} as const;

// Calculate C4 from A4 reference (A is 9 semitones above C)
export const getCFromA = (aFrequency: number): number => {
  return aFrequency * Math.pow(2, -9/12); // Down 9 semitones
};

/**
 * TUNABLE BASE FREQUENCY (Middle C)
 * 
 * dk:vision User can tune this to ANY frequency for creative/experimental purposes:
 * - Musical: 261.63 Hz (A440), 256 Hz (scientific C), 264 Hz (A445)
 * - Time-based: 60 Hz (seconds), 1440 Hz (minutes/day), 86400 Hz (seconds/day)
 * - Physiological: 72 Hz (average heart rate), 432 Hz (controversial "healing")
 * - Cosmic: 7.83 Hz (Schumann resonance), 528 Hz (DNA repair frequency claim)
 * 
 * dk:reminder Could map game tick rate to frequency:
 * - 10 ticks/sec = 10 Hz fundamental (subharmonic of 100ms tick)
 * - Simulation time could GENERATE music (not just trigger it)
 * - Day/night cycle = ultra-low frequency oscillation
 * 
 * dk:business Future: Let players "tune the world" - change base frequency globally
 * or locally, creating harmonic zones vs dissonant zones
 * 
 * dk:music Frequency vs TIME:
 * - 1 Hz = 1 cycle per second
 * - 60 Hz = heartbeat (if BPM = 60)
 * - 100 Hz = 10ms tick rate (our simulation!)
 * - What if simulation tick rate IS the bass note?
 */
let _baseFrequency = getCFromA(TUNING_STANDARDS.A440); // Default: 261.63 Hz (C4)

// dk:important Event listeners for frequency changes (triggers music engine restart)
const _frequencyChangeListeners: Array<(freq: number) => void> = [];

export const onFrequencyChange = (callback: (freq: number) => void): (() => void) => {
  _frequencyChangeListeners.push(callback);
  // Return unsubscribe function
  return () => {
    const index = _frequencyChangeListeners.indexOf(callback);
    if (index > -1) _frequencyChangeListeners.splice(index, 1);
  };
};

export const getBaseFrequency = (): number => _baseFrequency;

export const setBaseFrequency = (frequency: number): void => {
  if (frequency < 1 || frequency > 20000) {
    console.warn(`⚠️ Base frequency ${frequency} Hz is outside audible range (20-20000 Hz)`);
  }
  _baseFrequency = frequency;
  console.log(`🎵 Base frequency (Middle C) set to ${frequency.toFixed(2)} Hz`);
  
  // Notify all listeners (music engines will restart)
  _frequencyChangeListeners.forEach(listener => listener(frequency));
};

// Backward compatibility
export const BASE_FREQUENCY = getBaseFrequency();

// dk:vision Each role could have different tuning references:
// - Synod Operator: A445 (bright, authoritarian, tense)
// - Citizen: A440 (conditioned to accept "standard")
// - Resistance: A435 (warm, historical, rebellious)
// 
// When they hear each other's music, it's SLIGHTLY OFF - creating cognitive dissonance!

/**
 * TIME-BASED FREQUENCY MAPPINGS
 * 
 * Map simulation time units to frequencies for generative music:
 */
export const TIME_FREQUENCIES = {
  // Simulation timing
  tickRate100ms: 10,        // 100ms tick = 10 Hz (subharmonic)
  tickRate50ms: 20,         // 50ms tick = 20 Hz (low rumble)
  
  // Real-time clock mappings
  secondsPerMinute: 60,     // 60 Hz (if 1 second = 1 cycle)
  minutesPerHour: 60,       // 60 Hz
  hoursPerDay: 24,          // 24 Hz (low bass)
  secondsPerHour: 3600,     // 3600 Hz (high pitch)
  secondsPerDay: 86400,     // 86400 Hz (ultrasonic - divide by 1000 for audible)
  
  // Game time mappings (if 1 game day = X real seconds)
  gameDayFast: 120,         // 2 minute game day = 120 Hz
  gameDayNormal: 600,       // 10 minute game day = 600 Hz
  gameDaySlow: 3600,        // 1 hour game day = 3600 Hz
  
  // Physiological references
  heartbeatResting: 60-80,  // Average resting heart rate
  heartbeatExercise: 120-180, // Exercise heart rate
  breathingRate: 12-20,     // Breaths per minute
} as const;

// dk:reminder Future mechanic: Map agent risk_score to heart rate frequency
// High risk = faster "heartbeat" bass (80-180 Hz range)
// Low risk = calm breathing rate (12-20 Hz subharmonic)
//
// dk:vision Time itself becomes music:
// - Simulation tick = percussion rhythm
// - Day/night cycle = ultra-low oscillation (amplitude modulation)
// - Agent movement speed = tempo
// - Risk score = pitch (higher risk = higher frequency)

// dk:music These intervals define the game's sonic identity
// dk:reminder Regime avoids tritone, Resistance embraces it
