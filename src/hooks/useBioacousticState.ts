/**
 * Bioacoustic State Management Hook
 * 
 * Integrates biological frequency manipulation into the music system.
 * Automatically adjusts LFO, sub-bass, and binaural beats based on player state.
 * 
 * dk:music This is LITERAL consciousness manipulation via sound
 * dk:ethics Consider adding "disable bioacoustic effects" option for accessibility
 * dk:narrative The regime's most insidious tool: frequencies that alter thought itself
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  BIOACOUSTIC_RANGES,
  PSYCHOLOGICAL_STATES,
  calculateBioacousticModulation,
  getLFOForState,
  createSubBassResonance,
  createBinauralBeat,
  mapRiskToState
} from '../lib/bioacousticFrequencies';

export interface BioacousticSettings {
  enabled: boolean;
  subBassEnabled: boolean;           // 20-200 Hz physical resonance
  binauralBeatsEnabled: boolean;     // Brainwave entrainment
  lfoModulationEnabled: boolean;     // Frequency modulation
  intensity: number;                 // 0-1 (master intensity)
  carrierFrequency: number;          // Base frequency for binaural beats (200-800 Hz)
  subBassVolume: number;             // 0-1
  binauralVolume: number;            // 0-1
  showFrequencyDisplay: boolean;     // Visual feedback
  naturalModeEnabled: boolean;       // Lock to Schumann resonance (7.83 Hz)
}

export interface BioacousticState {
  currentState: keyof typeof PSYCHOLOGICAL_STATES;
  baseFrequency: number;             // Hz
  modulationFrequency: number;       // Hz
  lfoRate: number;                   // Hz
  brainwaveTarget: string;           // e.g., "Theta", "Gamma"
  effectDescription: string;         // Human-readable effect
}

const DEFAULT_SETTINGS: BioacousticSettings = {
  enabled: true,
  subBassEnabled: true,
  binauralBeatsEnabled: true,
  lfoModulationEnabled: true,
  intensity: 0.6,
  carrierFrequency: 400,  // Middle of hearing range
  subBassVolume: 0.4,
  binauralVolume: 0.2,
  showFrequencyDisplay: true,
  naturalModeEnabled: false
};

export function useBioacousticState(
  audioContext: AudioContext | null,
  riskScore: number,
  role: 'citizen' | 'operator' | 'resistance' | 'admin',
  currentLFORate?: number
) {
  const [settings, setSettings] = useLocalStorage<BioacousticSettings>(
    'bioacoustic:settings',
    DEFAULT_SETTINGS
  );
  
  const [currentState, setCurrentState] = useState<BioacousticState>({
    currentState: 'compliant',
    baseFrequency: 6.0,
    modulationFrequency: 0.5,
    lfoRate: 2.0,
    brainwaveTarget: 'Theta',
    effectDescription: 'Suggestible, hypnotic state'
  });
  
  // Audio nodes
  const subBassRef = useRef<{
    oscillator: OscillatorNode;
    gain: GainNode;
  } | null>(null);
  
  const binauralRef = useRef<{
    leftOsc: OscillatorNode;
    rightOsc: OscillatorNode;
    leftGain: GainNode;
    rightGain: GainNode;
    merger: ChannelMergerNode;
  } | null>(null);
  
  const masterGainRef = useRef<GainNode | null>(null);
  
  /**
   * Update psychological state based on risk score
   */
  useEffect(() => {
    if (!settings.enabled) return;
    
    // Natural mode locks to Schumann resonance
    if (settings.naturalModeEnabled) {
      setCurrentState({
        currentState: 'covert',
        baseFrequency: 7.83,
        modulationFrequency: 0.1,
        lfoRate: 7.83,
        brainwaveTarget: 'Schumann Resonance',
        effectDescription: 'Natural harmony, grounded state'
      });
      return;
    }
    
    // Map risk to psychological state
    const psychState = mapRiskToState(riskScore, role);
    const stateConfig = PSYCHOLOGICAL_STATES[psychState];
    const primaryRange = BIOACOUSTIC_RANGES[stateConfig.primaryRange];
    
    const modFreq = calculateBioacousticModulation(psychState, riskScore);
    const lfoRate = getLFOForState(psychState);
    
    setCurrentState({
      currentState: psychState,
      baseFrequency: stateConfig.baseFrequency,
      modulationFrequency: modFreq,
      lfoRate: lfoRate,
      brainwaveTarget: primaryRange.name,
      effectDescription: stateConfig.description
    });
  }, [riskScore, role, settings.enabled, settings.naturalModeEnabled]);
  
  /**
   * Initialize or update sub-bass oscillator
   */
  useEffect(() => {
    if (!audioContext || !settings.enabled || !settings.subBassEnabled) {
      // Stop existing sub-bass
      if (subBassRef.current) {
        subBassRef.current.oscillator.stop();
        subBassRef.current = null;
      }
      return;
    }
    
    // Create master gain if needed
    if (!masterGainRef.current) {
      masterGainRef.current = audioContext.createGain();
      masterGainRef.current.connect(audioContext.destination);
    }
    
    // Stop existing sub-bass
    if (subBassRef.current) {
      subBassRef.current.oscillator.stop();
    }
    
    // Determine sub-bass frequency based on state
    let subBassFreq = 60; // Default bass
    
    const stateConfig = PSYCHOLOGICAL_STATES[currentState.currentState];
    
    // If primary range is subBass or bass, use directly
    if (stateConfig.primaryRange === 'bass') {
      subBassFreq = currentState.baseFrequency;
    } else {
      // Map brainwave frequency to sub-bass (multiply by harmonic)
      subBassFreq = currentState.baseFrequency * 10;
      // Clamp to sub-bass range
      subBassFreq = Math.max(20, Math.min(200, subBassFreq));
    }
    
    // Create new sub-bass
    const { oscillator, gain } = createSubBassResonance(
      audioContext,
      subBassFreq,
      10.0 // Long duration, will stop manually
    );
    
    gain.gain.value = settings.subBassVolume * settings.intensity;
    gain.connect(masterGainRef.current);
    
    oscillator.start();
    subBassRef.current = { oscillator, gain };
    
    // Cleanup
    return () => {
      if (subBassRef.current) {
        subBassRef.current.oscillator.stop();
        subBassRef.current = null;
      }
    };
  }, [
    audioContext,
    settings.enabled,
    settings.subBassEnabled,
    settings.subBassVolume,
    settings.intensity,
    currentState.currentState,
    currentState.baseFrequency
  ]);
  
  /**
   * Initialize or update binaural beats
   */
  useEffect(() => {
    if (!audioContext || !settings.enabled || !settings.binauralBeatsEnabled) {
      // Stop existing binaural beats
      if (binauralRef.current) {
        binauralRef.current.leftOsc.stop();
        binauralRef.current.rightOsc.stop();
        binauralRef.current = null;
      }
      return;
    }
    
    // Create master gain if needed
    if (!masterGainRef.current) {
      masterGainRef.current = audioContext.createGain();
      masterGainRef.current.connect(audioContext.destination);
    }
    
    // Stop existing binaural beats
    if (binauralRef.current) {
      binauralRef.current.leftOsc.stop();
      binauralRef.current.rightOsc.stop();
    }
    
    // Create new binaural beat
    const binaural = createBinauralBeat(
      audioContext,
      settings.carrierFrequency,
      currentState.baseFrequency
    );
    
    // Set volume
    binaural.leftGain.gain.value = settings.binauralVolume * settings.intensity;
    binaural.rightGain.gain.value = settings.binauralVolume * settings.intensity;
    
    // Connect to output
    binaural.merger.connect(masterGainRef.current);
    
    // Start oscillators
    binaural.leftOsc.start();
    binaural.rightOsc.start();
    
    binauralRef.current = binaural;
    
    // Cleanup
    return () => {
      if (binauralRef.current) {
        binauralRef.current.leftOsc.stop();
        binauralRef.current.rightOsc.stop();
        binauralRef.current = null;
      }
    };
  }, [
    audioContext,
    settings.enabled,
    settings.binauralBeatsEnabled,
    settings.carrierFrequency,
    settings.binauralVolume,
    settings.intensity,
    currentState.baseFrequency
  ]);
  
  /**
   * Update master volume
   */
  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = settings.intensity;
    }
  }, [settings.intensity]);
  
  /**
   * Get LFO rate for external music engine
   */
  const getLFORate = useCallback(() => {
    if (!settings.enabled || !settings.lfoModulationEnabled) {
      return currentLFORate || 2.0; // Return existing rate if disabled
    }
    
    return currentState.lfoRate;
  }, [settings.enabled, settings.lfoModulationEnabled, currentState.lfoRate, currentLFORate]);
  
  /**
   * Force a specific psychological state (for testing/demo)
   */
  const forceState = useCallback((state: keyof typeof PSYCHOLOGICAL_STATES) => {
    const stateConfig = PSYCHOLOGICAL_STATES[state];
    const primaryRange = BIOACOUSTIC_RANGES[stateConfig.primaryRange];
    
    setCurrentState({
      currentState: state,
      baseFrequency: stateConfig.baseFrequency,
      modulationFrequency: stateConfig.modulation,
      lfoRate: getLFOForState(state),
      brainwaveTarget: primaryRange.name,
      effectDescription: stateConfig.description
    });
  }, []);
  
  /**
   * Get color for current state (for UI visualization)
   */
  const getStateColor = useCallback(() => {
    return PSYCHOLOGICAL_STATES[currentState.currentState].color;
  }, [currentState.currentState]);
  
  /**
   * Get detailed info about current frequency range
   */
  const getFrequencyRangeInfo = useCallback(() => {
    const stateConfig = PSYCHOLOGICAL_STATES[currentState.currentState];
    const primaryRange = BIOACOUSTIC_RANGES[stateConfig.primaryRange];
    const secondaryRange = BIOACOUSTIC_RANGES[stateConfig.secondaryRange];
    
    return {
      primary: primaryRange,
      secondary: secondaryRange,
      effects: primaryRange.effects
    };
  }, [currentState.currentState]);
  
  return {
    settings,
    setSettings,
    currentState,
    getLFORate,
    forceState,
    getStateColor,
    getFrequencyRangeInfo,
    // Export ranges for UI
    availableStates: Object.keys(PSYCHOLOGICAL_STATES) as (keyof typeof PSYCHOLOGICAL_STATES)[],
    frequencyRanges: BIOACOUSTIC_RANGES
  };
}

// dk:music This hook connects psychological manipulation to actual audio output
// dk:narrative Citizens hearing theta frequencies become more suggestible to propaganda
// dk:science Binaural beats work - studies show alpha/theta induction works
// dk:business Premium "Natural Mode" (Schumann resonance) = $4.99/month wellness feature
// dk:ethics Add accessibility option: "Disable bioacoustic manipulation" for photosensitive/audio-sensitive users
