/**
 * Music engine hook for Moral Panic game mode
 * 
 * Adapts SignalNet's useSynodMusicEngine for corruption-based adaptive music.
 * Reuses core Web Audio API patterns with Moral Panic scale.
 * 
 * dk:music Similar structure to useSynodMusicEngine but with corruption scoring
 */

import { useEffect, useRef, useState } from 'react';
import {
  MORAL_PANIC_LAYERS,
  centsToFrequency,
  getRoleBaseFrequency,
  getActiveLayers,
  CROSSFADE_DURATION,
  PITCH_GLIDE_DURATION,
  type MusicLayer
} from './moralPanicScale';
import type { RoleType } from './types';

// ============================================================================
// TYPES
// ============================================================================

interface UseMoralPanicMusicOptions {
  role: RoleType;
  corruptionLevel: number;  // 0-100 (for kids), ignored for authority/musician
  enabled: boolean;
  masterVolume?: number;    // 0.0 - 1.0
}

interface MoralPanicMusicEngine {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
  masterVolume: number;
  setMasterVolume: (volume: number) => void;
  activeLayers: string[];
  corruptionLevel: number;
  baseFrequency: number;
}

// ============================================================================
// MUSIC LAYER INTERNAL STATE
// ============================================================================

interface MusicLayerState {
  name: string;
  oscillators: OscillatorNode[];
  gainNode: GainNode;
  intervals: number[];      // Store for retuning
  active: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMoralPanicMusic(
  options: UseMoralPanicMusicOptions
): MoralPanicMusicEngine {
  const { role, corruptionLevel, enabled: enabledProp, masterVolume: masterVolumeProp = 0.3 } = options;
  
  // State
  const [enabled, setEnabled] = useState(enabledProp);
  const [masterVolume, setMasterVolume] = useState(masterVolumeProp);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  
  // Refs (persist across renders)
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const layersRef = useRef<Map<string, MusicLayerState>>(new Map());
  const baseFrequencyRef = useRef<number>(440);
  
  // ============================================================================
  // LAYER CREATION (defined before useEffect)
  // ============================================================================
  
  const createLayer = (
    config: MusicLayer,
    audioContext: AudioContext,
    masterGain: GainNode,
    baseFreq: number
  ): void => {
    // Create gain node for layer
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0; // Start silent (will crossfade in)
    gainNode.connect(masterGain);
    
    // Create oscillators for each interval
    const oscillators: OscillatorNode[] = [];
    config.intervals.forEach(cents => {
      const osc = audioContext.createOscillator();
      osc.type = config.waveType;
      osc.frequency.value = centsToFrequency(baseFreq, cents);
      osc.connect(gainNode);
      osc.start();
      oscillators.push(osc);
    });
    
    // Store layer state
    layersRef.current.set(config.name, {
      name: config.name,
      oscillators,
      gainNode,
      intervals: [...config.intervals],  // Store for retuning
      active: false
    });
  };
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    if (!enabled) return;
    
    // Create Audio Context
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Create master gain (volume control)
    const masterGain = audioContext.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(audioContext.destination);
    masterGainRef.current = masterGain;
    
    // Calculate base frequency for role
    const baseFreq = getRoleBaseFrequency(role, corruptionLevel);
    baseFrequencyRef.current = baseFreq;
    
    // Create all layers (but only activate based on corruption)
    MORAL_PANIC_LAYERS.forEach(layerConfig => {
      createLayer(layerConfig, audioContext, masterGain, baseFreq);
    });
    
    console.log(`🎵 Moral Panic music initialized (${role}, ${baseFreq.toFixed(1)} Hz)`);
    
    // Cleanup
    return () => {
      const layers = layersRef.current;
      layers.forEach(layer => {
        layer.oscillators.forEach(osc => osc.stop());
      });
      layers.clear();
      audioContext.close();
      console.log('🎵 Moral Panic music stopped');
    };
  }, [enabled, role, corruptionLevel, masterVolume, createLayer]);
  
  // ============================================================================
  // CORRUPTION-BASED LAYER ACTIVATION
  // ============================================================================
  
  useEffect(() => {
    if (!enabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    
    // Determine which layers should be active
    const shouldBeActive = getActiveLayers(corruptionLevel);
    const activeNames = shouldBeActive.map(l => l.name);
    
    setActiveLayers(activeNames);
    
    // Crossfade layers
    layersRef.current.forEach(layer => {
      const shouldActivate = activeNames.includes(layer.name);
      const layerConfig = MORAL_PANIC_LAYERS.find(l => l.name === layer.name);
      
      if (!layerConfig) return;
      
      if (shouldActivate && !layer.active) {
        // Fade in
        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(
          layerConfig.volume,
          now + CROSSFADE_DURATION
        );
        layer.active = true;
        console.log(`🎵 Layer activated: ${layer.name} (corruption: ${corruptionLevel.toFixed(1)})`);
      } else if (!shouldActivate && layer.active) {
        // Fade out
        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(0, now + CROSSFADE_DURATION);
        layer.active = false;
        console.log(`🎵 Layer deactivated: ${layer.name}`);
      }
    });
  }, [corruptionLevel, enabled]);
  
  // ============================================================================
  // FREQUENCY RETUNING (Kids shift from A440 → A435 as corruption increases)
  // ============================================================================
  
  useEffect(() => {
    if (!enabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    
    // Recalculate base frequency (kids drift with corruption)
    const newBaseFreq = getRoleBaseFrequency(role, corruptionLevel);
    
    if (Math.abs(newBaseFreq - baseFrequencyRef.current) > 0.01) {
      console.log(`🎵 Retuning: ${baseFrequencyRef.current.toFixed(2)} Hz → ${newBaseFreq.toFixed(2)} Hz`);
      
      // Smooth pitch glide (exponential ramp)
      layersRef.current.forEach(layer => {
        layer.oscillators.forEach((osc, idx) => {
          const cents = layer.intervals[idx];
          const newFreq = centsToFrequency(newBaseFreq, cents);
          
          osc.frequency.cancelScheduledValues(now);
          osc.frequency.setValueAtTime(osc.frequency.value, now);
          osc.frequency.exponentialRampToValueAtTime(
            newFreq,
            now + PITCH_GLIDE_DURATION
          );
        });
      });
      
      baseFrequencyRef.current = newBaseFreq;
    }
  }, [corruptionLevel, role, enabled]);
  
  // ============================================================================
  // MASTER VOLUME CONTROL
  // ============================================================================
  
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(
        masterGainRef.current.gain.value,
        now
      );
      masterGainRef.current.gain.linearRampToValueAtTime(
        masterVolume,
        now + 0.1  // 100ms smooth volume change
      );
    }
  }, [masterVolume]);
  
  // ============================================================================
  // ENABLE/DISABLE TOGGLE
  // ============================================================================
  
  useEffect(() => {
    setEnabled(enabledProp);
  }, [enabledProp]);
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    enabled,
    setEnabled,
    masterVolume,
    setMasterVolume,
    activeLayers,
    corruptionLevel,
    baseFrequency: baseFrequencyRef.current
  };
}

// dk:music Reuses SignalNet patterns: smooth glide, crossfade, layer system
// dk:reminder Add spatial audio for cultural sites (3D positioning)
