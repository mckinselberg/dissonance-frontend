/**
 * Enhanced Synod Music Engine with Audio Processing
 * 
 * Extends useSynodMusicEngine with:
 * - Master volume control
 * - 3-band parametric EQ
 * - Convolution reverb
 * - ADSR envelope
 * - Multi-mode filter
 * - LFO modulation
 * 
 * dk:music Perfect for Linnstrument/MPE controller performance
 * dk:architecture Audio processing chain: Oscillators → Filter → EQ → Reverb → Master
 */

import { useEffect, useRef, useCallback } from 'react';
import { centsToFrequency, getBaseFrequency } from '../lib/synodScale';
import {
  MasterVolumeNode,
  ParametricEQNode,
  ConvolutionReverbNode,
  MultiModeFilterNode,
  EnvelopeGenerator,
  LFONode,
  type EQBandSettings,
  type ADSREnvelope,
  type FilterSettings,
  type LFOSettings
} from '../lib/audioEngine';
import { useLocalStorage } from './useLocalStorage';

// ============================================================================
// TYPES
// ============================================================================

interface AudioProcessingSettings {
  masterVolume: number;
  eq: {
    low: EQBandSettings;
    mid: EQBandSettings;
    high: EQBandSettings;
  };
  reverb: {
    mix: number;
    decayTime: number;
  };
  envelope: ADSREnvelope;
  filter: FilterSettings;
  lfo: LFOSettings;
}

interface MusicLayer {
  name: string;
  oscillators: OscillatorNode[];
  intervals: number[];
  gainNode: GainNode;
  filterNode: MultiModeFilterNode | null; // Per-layer filtering
  riskThreshold: number;
  targetVolume: number;
}

interface UseEnhancedMusicEngineOptions {
  enabled?: boolean;
  audioSettings?: Partial<AudioProcessingSettings>;
}

// ============================================================================
// HOOK
// ============================================================================

export const useEnhancedMusicEngine = (
  riskScore: number,
  options: UseEnhancedMusicEngineOptions = {}
) => {
  const { enabled = true, audioSettings } = options;
  
  // Audio context and nodes
  const audioContextRef = useRef<AudioContext | null>(null);
  const layersRef = useRef<MusicLayer[]>([]);
  
  // Audio processing chain
  const masterVolumeRef = useRef<MasterVolumeNode | null>(null);
  const eqRef = useRef<ParametricEQNode | null>(null);
  const reverbRef = useRef<ConvolutionReverbNode | null>(null);
  const filterRef = useRef<MultiModeFilterNode | null>(null); // Global filter
  const lfoRef = useRef<LFONode | null>(null);
  
  // Audio settings state with localStorage persistence
  // dk:ux Settings persist across browser sessions for seamless experience
  const defaultSettings: AudioProcessingSettings = {
    masterVolume: audioSettings?.masterVolume ?? 0.3,
    eq: audioSettings?.eq ?? {
      low: { frequency: 250, gain: 0, Q: 1.0 },
      mid: { frequency: 1000, gain: 0, Q: 1.0 },
      high: { frequency: 4000, gain: 0, Q: 1.0 }
    },
    reverb: audioSettings?.reverb ?? {
      mix: 0.3,
      decayTime: 2.0
    },
    envelope: audioSettings?.envelope ?? {
      attack: 0.01,
      decay: 0.1,
      sustain: 0.7,
      release: 0.3
    },
    filter: audioSettings?.filter ?? {
      mode: 'lowpass',
      frequency: 1000,
      resonance: 1,
      gain: 0
    },
    lfo: audioSettings?.lfo ?? {
      shape: 'sine',
      rate: 1.0,
      depth: 0.5
    }
  };
  
  const [currentSettings, setCurrentSettings] = useLocalStorage<AudioProcessingSettings>(
    'audio:settings',
    defaultSettings
  );
  
  // ============================================================================
  // LAYER CREATION (Defined before useEffect)
  // ============================================================================
  
  const createMusicLayers = useCallback((
    audioContext: AudioContext,
    destination: MultiModeFilterNode,
    baseFreq: number
  ) => {
    const layerConfigs = [
      { name: 'drone', intervals: [0], threshold: 0.0, volume: 0.15, waveType: 'sine' as OscillatorType },
      { name: 'tension1', intervals: [0, 150], threshold: 0.3, volume: 0.12, waveType: 'triangle' as OscillatorType },
      { name: 'tension2', intervals: [0, 350, 720], threshold: 0.5, volume: 0.10, waveType: 'sawtooth' as OscillatorType },
      { name: 'tension3', intervals: [0, 480, 720], threshold: 0.7, volume: 0.08, waveType: 'square' as OscillatorType },
      { name: 'action', intervals: [0, 600, 1200], threshold: 0.9, volume: 0.10, waveType: 'sawtooth' as OscillatorType }
    ];
    
    layerConfigs.forEach(config => {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Start silent
      
      // Optional: Per-layer filter for different timbres
      const layerFilter = new MultiModeFilterNode(audioContext, {
        mode: 'lowpass',
        frequency: 2000 + (config.threshold * 8000), // Higher layers = brighter
        resonance: 1.0
      });
      
      // Connect: oscillators → layer gain → layer filter → global chain
      gainNode.connect(layerFilter.input);
      layerFilter.connect(destination);
      
      const oscillators: OscillatorNode[] = [];
      config.intervals.forEach(cents => {
        const osc = audioContext.createOscillator();
        osc.type = config.waveType;
        osc.frequency.value = centsToFrequency(baseFreq, cents);
        osc.connect(gainNode);
        osc.start();
        oscillators.push(osc);
      });
      
      layersRef.current.push({
        name: config.name,
        oscillators,
        intervals: config.intervals,
        gainNode,
        filterNode: layerFilter,
        riskThreshold: config.threshold,
        targetVolume: config.volume
      });
    });
  }, []);
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    if (!enabled) return;
    
    // Create Audio Context
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Build audio processing chain (right to left):
    // Oscillators → [Per-Layer Filter] → EQ → Reverb → Master Volume → Destination
    
    // Master Volume (final stage)
    const masterVolume = new MasterVolumeNode(audioContext, currentSettings.masterVolume);
    masterVolume.connect(audioContext.destination);
    masterVolumeRef.current = masterVolume;
    
    // Reverb
    const reverb = new ConvolutionReverbNode(audioContext);
    reverb.setMix(currentSettings.reverb.mix);
    reverb.setDefaultImpulseResponse(currentSettings.reverb.decayTime);
    reverb.connect(masterVolume);
    reverbRef.current = reverb;
    
    // EQ
    const eq = new ParametricEQNode(audioContext);
    eq.setLowBand(currentSettings.eq.low);
    eq.setMidBand(currentSettings.eq.mid);
    eq.setHighBand(currentSettings.eq.high);
    eq.connect(reverb);
    eqRef.current = eq;
    
    // Global Filter (before EQ)
    const filter = new MultiModeFilterNode(audioContext, currentSettings.filter);
    filter.connect(eq);
    filterRef.current = filter;
    
    // LFO (for filter modulation)
    const lfo = new LFONode(audioContext, currentSettings.lfo);
    lfoRef.current = lfo;
    
    // dk:music LFO modulates filter frequency for wah-wah/sweep effects
    if (filterRef.current) {
      lfo.connect(filterRef.current.input.gain); // Connect to filter cutoff
    }
    
    // Calculate base frequency
    const baseFreq = getBaseFrequency();
    
    // Create music layers (adaptive system)
    createMusicLayers(audioContext, filter, baseFreq);
    
    console.log('🎛️ Enhanced music engine initialized');
    
    // Cleanup
    return () => {
      layersRef.current.forEach(layer => {
        layer.oscillators.forEach(osc => osc.stop());
        layer.filterNode?.disconnect();
      });
      layersRef.current = [];
      
      masterVolumeRef.current?.disconnect();
      eqRef.current?.disconnect();
      reverbRef.current?.disconnect();
      filterRef.current?.disconnect();
      lfoRef.current?.stop();
      
      audioContext.close();
      console.log('🎛️ Enhanced music engine stopped');
    };
    // dk:reminder Intentionally omit currentSettings from deps - we handle updates separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, createMusicLayers]);
  
  // ============================================================================
  // RISK-BASED LAYER ACTIVATION
  // ============================================================================
  
  useEffect(() => {
    if (!enabled || !audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    
    layersRef.current.forEach(layer => {
      const shouldActivate = riskScore >= layer.riskThreshold;
      
      if (shouldActivate) {
        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(layer.targetVolume, now + 2.0);
      } else {
        layer.gainNode.gain.cancelScheduledValues(now);
        layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
        layer.gainNode.gain.linearRampToValueAtTime(0, now + 2.0);
      }
    });
  }, [riskScore, enabled]);
  
  // ============================================================================
  // AUDIO SETTINGS UPDATES
  // ============================================================================
  
  const updateAudioSettings = useCallback((settings: Partial<AudioProcessingSettings>) => {
    setCurrentSettings(prev => {
      const newSettings = {
        ...prev,
        ...settings,
        eq: settings.eq ? { ...prev.eq, ...settings.eq } : prev.eq,
        reverb: settings.reverb ? { ...prev.reverb, ...settings.reverb } : prev.reverb,
        envelope: settings.envelope ? { ...prev.envelope, ...settings.envelope } : prev.envelope,
        filter: settings.filter ? { ...prev.filter, ...settings.filter } : prev.filter,
        lfo: settings.lfo ? { ...prev.lfo, ...settings.lfo } : prev.lfo
      };
      
      // Apply changes to audio nodes
      if (settings.masterVolume !== undefined && masterVolumeRef.current) {
        masterVolumeRef.current.setVolume(settings.masterVolume);
      }
      
      if (settings.eq && eqRef.current) {
        if (settings.eq.low) eqRef.current.setLowBand(settings.eq.low);
        if (settings.eq.mid) eqRef.current.setMidBand(settings.eq.mid);
        if (settings.eq.high) eqRef.current.setHighBand(settings.eq.high);
      }
      
      if (settings.reverb && reverbRef.current) {
        if (settings.reverb.mix !== undefined) {
          reverbRef.current.setMix(settings.reverb.mix);
        }
        if (settings.reverb.decayTime !== undefined) {
          reverbRef.current.setDefaultImpulseResponse(settings.reverb.decayTime);
        }
      }
      
      if (settings.filter && filterRef.current) {
        filterRef.current.setFilter(settings.filter);
      }
      
      if (settings.lfo && lfoRef.current) {
        if (settings.lfo.shape) lfoRef.current.setShape(settings.lfo.shape);
        if (settings.lfo.rate !== undefined) lfoRef.current.setRate(settings.lfo.rate);
        if (settings.lfo.depth !== undefined) lfoRef.current.setDepth(settings.lfo.depth);
      }
      
      return newSettings;
    });
  }, [setCurrentSettings]);
  
  // ============================================================================
  // LINNSTRUMENT/MIDI INTEGRATION
  // ============================================================================
  
  const playNote = useCallback((
    frequency: number,
    velocity: number = 1.0,
    duration?: number
  ) => {
    if (!audioContextRef.current) return;
    
    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    
    // Create oscillator for note
    const osc = audioContext.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = frequency;
    
    // Create envelope generator
    const envelope = new EnvelopeGenerator(audioContext);
    
    // Create per-note filter (for expression)
    const noteFilter = new MultiModeFilterNode(audioContext, currentSettings.filter);
    
    // Connect: oscillator → filter → envelope → global chain
    osc.connect(noteFilter.input);
    envelope.getGainNode().connect(filterRef.current?.input || audioContextRef.current.destination);
    noteFilter.connect(envelope.getGainNode());
    
    // Trigger envelope
    envelope.noteOn(currentSettings.envelope, velocity);
    osc.start(now);
    
    // Auto-release if duration specified
    if (duration) {
      setTimeout(() => {
        envelope.noteOff(currentSettings.envelope);
        setTimeout(() => {
          osc.stop();
          noteFilter.disconnect();
          envelope.disconnect();
        }, currentSettings.envelope.release * 1000);
      }, duration * 1000);
    }
    
    return { osc, envelope, filter: noteFilter };
  }, [currentSettings]);
  
  // ============================================================================
  // RETURN API
  // ============================================================================
  
  return {
    enabled,
    audioSettings: currentSettings,
    updateAudioSettings,
    playNote, // For Linnstrument/MIDI input
    
    // Direct node access (for advanced control)
    audioContext: audioContextRef.current,
    masterVolume: masterVolumeRef.current,
    eq: eqRef.current,
    reverb: reverbRef.current,
    filter: filterRef.current,
    lfo: lfoRef.current
  };
};

// dk:linnstrument Add WebMIDI API integration for Linnstrument input
// dk:reminder Add MPE (MIDI Polyphonic Expression) parser
// dk:perf Consider using AudioWorklet for custom synthesis
