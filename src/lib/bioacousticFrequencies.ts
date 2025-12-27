/**
 * Bioacoustic Frequency Mapping System
 * 
 * Maps player psychological/physiological states to specific frequency ranges (0.1-200 Hz)
 * that resonate with human biological rhythms.
 * 
 * dk:music Frequencies below 20 Hz aren't "heard" but FELT - they affect physiology
 * dk:science Human brainwaves, heart rate, breathing all have specific frequencies
 * dk:narrative Regime controls consciousness by controlling the frequencies citizens experience
 */

/**
 * Bioacoustic Frequency Ranges
 * Based on human biological rhythms and brainwave states
 */
export const BIOACOUSTIC_RANGES = {
  // DELTA WAVES (0.5-4 Hz): Deep sleep, unconscious
  delta: {
    min: 0.5,
    max: 4,
    name: 'Delta',
    state: 'Deep Sleep / Unconscious',
    effects: ['Healing', 'Regeneration', 'Detachment'],
    color: '#000080', // Deep blue
    description: 'Deepest unconscious state. Body repairs itself. No awareness.'
  },
  
  // THETA WAVES (4-8 Hz): Meditation, trance, hypnosis
  theta: {
    min: 4,
    max: 8,
    name: 'Theta',
    state: 'Meditation / Trance / Hypnosis',
    effects: ['Suggestibility', 'Memory consolidation', 'Creativity'],
    color: '#4B0082', // Indigo
    description: 'Hypnotic state. Highly suggestible. Regime propaganda most effective here.'
  },
  
  // ALPHA WAVES (8-13 Hz): Relaxed, calm, alert but not focused
  alpha: {
    min: 8,
    max: 13,
    name: 'Alpha',
    state: 'Relaxed Alertness / Calm',
    effects: ['Stress reduction', 'Flow state entry', 'Learning'],
    color: '#0000FF', // Blue
    description: 'Calm but awake. Bridge between conscious and unconscious. Compliant state.'
  },
  
  // BETA WAVES (13-30 Hz): Active thinking, problem-solving, focused
  beta: {
    min: 13,
    max: 30,
    name: 'Beta',
    state: 'Active Thinking / Alert',
    effects: ['Concentration', 'Problem-solving', 'Critical thinking'],
    color: '#00FF00', // Green
    description: 'Normal waking consciousness. Active mind. Resistance operates here.'
  },
  
  // GAMMA WAVES (30-100 Hz): Peak performance, high-level cognition
  gamma: {
    min: 30,
    max: 100,
    name: 'Gamma',
    state: 'Peak Performance / Insight',
    effects: ['Heightened perception', 'Insight', 'Peak awareness'],
    color: '#FFFF00', // Yellow
    description: 'Highest cognitive function. Moments of clarity. Transcendent awareness.'
  },
  
  // SUB-BASS (20-60 Hz): Physical sensation, body resonance
  subBass: {
    min: 20,
    max: 60,
    name: 'Sub-Bass',
    state: 'Physical Embodiment',
    effects: ['Body awareness', 'Grounding', 'Visceral response'],
    color: '#8B4513', // Brown
    description: 'Felt more than heard. Resonates with organs, bones. Primal response.'
  },
  
  // BASS (60-200 Hz): Emotional response, power, authority
  bass: {
    min: 60,
    max: 200,
    name: 'Bass',
    state: 'Emotional Resonance',
    effects: ['Authority', 'Power', 'Emotional impact'],
    color: '#FF4500', // Orange-red
    description: 'Voice of authority. Commands respect. Regime broadcasts in this range.'
  },
  
  // SCHUMANN RESONANCE (7.83 Hz): Earth's natural frequency
  schumann: {
    min: 7.5,
    max: 8.0,
    name: 'Schumann Resonance',
    state: 'Natural Harmony',
    effects: ['Grounding', 'Connection to nature', 'Baseline wellness'],
    color: '#228B22', // Forest green
    description: "Earth's heartbeat. Natural human state. Regime disrupts this intentionally."
  },
  
  // HEART RATE (0.8-3 Hz): Resting to peak exertion
  heartRate: {
    min: 0.8,  // 48 BPM (deep relaxation)
    max: 3.0,  // 180 BPM (maximum exertion)
    name: 'Heart Rate',
    state: 'Cardiovascular Rhythm',
    effects: ['Arousal', 'Stress level', 'Physical exertion'],
    color: '#FF0000', // Red
    description: 'Cardiac rhythm. Surveillance monitors this. Stress = vulnerability.'
  },
  
  // BREATHING RATE (0.1-0.5 Hz): Slow to rapid breathing
  breathingRate: {
    min: 0.1,  // 6 breaths/minute (deep meditation)
    max: 0.5,  // 30 breaths/minute (hyperventilation)
    name: 'Breathing Rate',
    state: 'Respiratory Rhythm',
    effects: ['Calm vs panic', 'Oxygen level', 'Autonomic state'],
    color: '#87CEEB', // Sky blue
    description: 'Breath is life. Control breath = control consciousness.'
  }
} as const;

/**
 * Player psychological states mapped to frequency profiles
 */
export const PSYCHOLOGICAL_STATES = {
  // CITIZEN STATES
  compliant: {
    name: 'Compliant',
    description: 'Accepting regime authority. Low threat. Docile.',
    primaryRange: 'theta',      // Suggestible, hypnotic
    secondaryRange: 'alpha',     // Relaxed, not critical
    baseFrequency: 6.0,          // Theta center (suggestibility peak)
    modulation: 0.5,             // Gentle oscillation
    color: '#4B0082'
  },
  
  anxious: {
    name: 'Anxious',
    description: 'Elevated stress. Monitoring for threats. Compliant but unstable.',
    primaryRange: 'beta',        // Active, worried thoughts
    secondaryRange: 'heartRate', // Elevated heart rate
    baseFrequency: 18.0,         // High beta (anxiety)
    modulation: 2.0,             // Irregular oscillation
    color: '#FFA500'
  },
  
  rebellious: {
    name: 'Rebellious',
    description: 'Questioning authority. Critical thinking active. Resistance mindset.',
    primaryRange: 'gamma',       // High cognition, insight
    secondaryRange: 'beta',      // Critical thinking
    baseFrequency: 40.0,         // Gamma range (peak awareness)
    modulation: 1.5,             // Strong, purposeful
    color: '#FF0000'
  },
  
  hypnotized: {
    name: 'Hypnotized',
    description: 'Deep propaganda influence. Critical thinking suspended.',
    primaryRange: 'theta',       // Trance state
    secondaryRange: 'delta',     // Unconscious processing
    baseFrequency: 4.5,          // Deep theta (hypnotic peak)
    modulation: 0.2,             // Very stable, no resistance
    color: '#000080'
  },
  
  awakening: {
    name: 'Awakening',
    description: 'Breaking through propaganda. Consciousness expanding.',
    primaryRange: 'gamma',       // Insight moments
    secondaryRange: 'schumann',  // Reconnecting to natural state
    baseFrequency: 7.83,         // Schumann resonance
    modulation: 3.0,             // Intense fluctuation (transition)
    color: '#FFD700'
  },
  
  // OPERATOR STATES
  vigilant: {
    name: 'Vigilant',
    description: 'Heightened surveillance mode. Scanning for threats.',
    primaryRange: 'beta',        // Active monitoring
    secondaryRange: 'gamma',     // Pattern recognition
    baseFrequency: 25.0,         // High beta (alertness)
    modulation: 1.0,             // Steady scan
    color: '#00FF00'
  },
  
  authoritative: {
    name: 'Authoritative',
    description: 'Commanding presence. Broadcasting power.',
    primaryRange: 'bass',        // Low authority voice
    secondaryRange: 'subBass',   // Physical dominance
    baseFrequency: 100.0,        // Low bass (authority)
    modulation: 0.3,             // Unwavering
    color: '#8B0000'
  },
  
  // RESISTANCE STATES
  covert: {
    name: 'Covert',
    description: 'Hidden, undetectable. Minimal signature.',
    primaryRange: 'schumann',    // Natural frequency (invisible)
    secondaryRange: 'alpha',     // Calm, not suspicious
    baseFrequency: 7.83,         // Earth frequency
    modulation: 0.1,             // Minimal fluctuation
    color: '#228B22'
  },
  
  militant: {
    name: 'Militant',
    description: 'Active resistance. High energy, focused intent.',
    primaryRange: 'gamma',       // Peak performance
    secondaryRange: 'heartRate', // Elevated (combat ready)
    baseFrequency: 60.0,         // High gamma
    modulation: 4.0,             // Intense, chaotic
    color: '#FF4500'
  },
  
  // CRISIS STATES
  panic: {
    name: 'Panic',
    description: 'Fight-or-flight. System overload.',
    primaryRange: 'heartRate',   // Racing heart
    secondaryRange: 'breathingRate', // Hyperventilation
    baseFrequency: 2.5,          // 150 BPM
    modulation: 8.0,             // Chaotic oscillation
    color: '#FF0000'
  },
  
  dissociation: {
    name: 'Dissociation',
    description: 'Mental escape. Disconnection from reality.',
    primaryRange: 'delta',       // Unconscious
    secondaryRange: 'theta',     // Dream-like
    baseFrequency: 2.0,          // Deep delta
    modulation: 0.1,             // Flat, numb
    color: '#696969'
  },
  
  transcendent: {
    name: 'Transcendent',
    description: 'Beyond regime control. Peak awareness.',
    primaryRange: 'gamma',       // Maximum coherence
    secondaryRange: 'schumann',  // Grounded in nature
    baseFrequency: 40.0,         // High gamma
    modulation: 7.83,            // Modulated by Schumann
    color: '#FFFFFF'
  }
} as const;

/**
 * Calculate modulation frequency based on player state
 * 
 * @param state - Player psychological state
 * @param riskScore - Current risk score (0-1)
 * @returns Modulation frequency in Hz
 */
export function calculateBioacousticModulation(
  state: keyof typeof PSYCHOLOGICAL_STATES,
  riskScore: number
): number {
  const stateConfig = PSYCHOLOGICAL_STATES[state];
  const baseModulation = stateConfig.modulation;
  
  // Risk increases modulation intensity (instability)
  const riskModifier = 1 + (riskScore * 2); // 1x to 3x
  
  return baseModulation * riskModifier;
}

/**
 * Get LFO frequency for psychological state
 * This modulates the music layers to induce the desired state
 * 
 * @param state - Target psychological state
 * @returns LFO rate in Hz (0.1-10 Hz typical range)
 */
export function getLFOForState(state: keyof typeof PSYCHOLOGICAL_STATES): number {
  const stateConfig = PSYCHOLOGICAL_STATES[state];
  
  // Map base frequency to LFO range (compress to 0.1-10 Hz)
  if (stateConfig.baseFrequency < 1) {
    // Sub-Hz frequencies (breathing, very slow)
    return stateConfig.baseFrequency;
  } else if (stateConfig.baseFrequency < 10) {
    // Brainwave frequencies (use directly as LFO)
    return stateConfig.baseFrequency;
  } else {
    // Higher frequencies (map to LFO range)
    return Math.log10(stateConfig.baseFrequency) + 0.5;
  }
}

/**
 * Generate sub-bass oscillator for physical/emotional resonance
 * These frequencies are FELT more than heard
 * 
 * @param audioContext - Web Audio API context
 * @param frequency - Target frequency (20-200 Hz)
 * @param duration - Duration in seconds
 * @returns OscillatorNode
 */
export function createSubBassResonance(
  audioContext: AudioContext,
  frequency: number,
  duration: number
): { oscillator: OscillatorNode; gain: GainNode } {
  const osc = audioContext.createOscillator();
  osc.type = 'sine'; // Pure sine for sub-bass
  osc.frequency.value = frequency;
  
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.3, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  
  osc.connect(gain);
  
  return { oscillator: osc, gain };
}

/**
 * Create binaural beat for brainwave entrainment
 * Left ear: baseFrequency, Right ear: baseFrequency + targetBrainwave
 * Brain perceives the DIFFERENCE (e.g., 400Hz + 410Hz = 10Hz perceived)
 * 
 * @param audioContext - Web Audio API context
 * @param baseFrequency - Carrier frequency (e.g., 400 Hz)
 * @param brainwaveFrequency - Target brainwave (e.g., 7.83 Hz for Schumann)
 * @returns Stereo oscillator setup
 */
export function createBinauralBeat(
  audioContext: AudioContext,
  baseFrequency: number,
  brainwaveFrequency: number
): {
  leftOsc: OscillatorNode;
  rightOsc: OscillatorNode;
  leftGain: GainNode;
  rightGain: GainNode;
  merger: ChannelMergerNode;
} {
  // Left channel (base frequency)
  const leftOsc = audioContext.createOscillator();
  leftOsc.type = 'sine';
  leftOsc.frequency.value = baseFrequency;
  
  const leftGain = audioContext.createGain();
  leftGain.gain.value = 0.15; // Subtle
  
  // Right channel (base + brainwave)
  const rightOsc = audioContext.createOscillator();
  rightOsc.type = 'sine';
  rightOsc.frequency.value = baseFrequency + brainwaveFrequency;
  
  const rightGain = audioContext.createGain();
  rightGain.gain.value = 0.15;
  
  // Merge to stereo
  const merger = audioContext.createChannelMerger(2);
  
  leftOsc.connect(leftGain);
  leftGain.connect(merger, 0, 0); // Left channel
  
  rightOsc.connect(rightGain);
  rightGain.connect(merger, 0, 1); // Right channel
  
  return { leftOsc, rightOsc, leftGain, rightGain, merger };
}

/**
 * Map risk score to psychological state
 * 
 * @param riskScore - Current risk score (0-1)
 * @param role - Player role
 * @returns Psychological state key
 */
export function mapRiskToState(
  riskScore: number,
  role: 'citizen' | 'operator' | 'resistance' | 'admin'
): keyof typeof PSYCHOLOGICAL_STATES {
  if (role === 'citizen') {
    if (riskScore < 0.2) return 'compliant';
    if (riskScore < 0.5) return 'anxious';
    if (riskScore < 0.8) return 'rebellious';
    return 'panic';
  }
  
  if (role === 'operator') {
    if (riskScore < 0.5) return 'vigilant';
    return 'authoritative';
  }
  
  if (role === 'resistance') {
    if (riskScore < 0.4) return 'covert';
    if (riskScore < 0.8) return 'militant';
    return 'transcendent';
  }
  
  return 'vigilant'; // Admin default
}

// dk:science Binaural beats can actually alter brainwave states (proven by EEG studies)
// dk:narrative Regime uses specific frequencies to maintain population docility
// dk:music Sub-bass frequencies create physical sensations (anxiety, dread, power)
// dk:ethics We're implementing actual psychoacoustic manipulation - use responsibly!
// dk:business Premium feature: "Natural Frequency Mode" (Schumann resonance) = wellness upgrade
