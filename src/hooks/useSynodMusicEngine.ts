import { useEffect, useRef } from 'react';
import { SYNOD_SCALE, centsToFrequency, getBaseFrequency, onFrequencyChange } from '../lib/synodScale';

/**
 * Adaptive Music Engine Hook
 * 
 * Automatically plays Synod scale music based on simulation risk_score.
 * 5 layers crossfade at risk thresholds:
 * - Drone (0.0): Always playing, low hum (C unison)
 * - Tension 1 (0.3): Unease (C-Eb propaganda tone)
 * - Tension 2 (0.5): Heightened (C-E-G hollow chord)
 * - Tension 3 (0.7): Danger (C-F-G tense chord)
 * - Action (0.9): Crisis (rapid arpeggios, tritone alarms)
 * 
 * dk:music This is the CORE adaptive music system - the heart of the surveillance aesthetic
 * dk:perf Uses oscillator pooling and smooth gain ramping to avoid audio glitches
 * dk:music Drone fade-in on restart = "system reboot signature" - the surveillance state
 *          coming back online. Different fade patterns for different events:
 *          - Frequency change: 2s fade (smooth system adjustment)
 *          - WebSocket reconnect: 3s fade (system re-establishing connection)
 *          - Maintenance mode exit: 5s fade + pitch shift up from -2400 cents (slow boot)
 *          - Match start: 4s fade from silence (world initialization)
 *          - Emergency/lockdown: 0.5s harsh fade + distortion (alarm state)
 *          The drone is the heartbeat of the regime - always watching, always listening.
 */

interface MusicLayer {
  name: string;
  oscillators: OscillatorNode[];
  intervals: number[]; // Store intervals for retuning
  gainNode: GainNode;
  riskThreshold: number;
  targetVolume: number;
}

interface UseSynodMusicEngineOptions {
  enabled?: boolean;
  masterVolume?: number;
}

export const useSynodMusicEngine = (
  riskScore: number,
  options: UseSynodMusicEngineOptions = {}
) => {
  const { enabled = true, masterVolume = 0.15 } = options; // dk:perf Reduced from 0.3 to balance with heartbeat rhythm
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const layersRef = useRef<MusicLayer[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);

  // dk:perf Better reload mechanism - retune oscillators instead of full restart
  // Listen for frequency changes and smoothly retune
  useEffect(() => {
    const unsubscribe = onFrequencyChange((newFrequency) => {
      console.log(`🎵 Frequency changed to ${newFrequency.toFixed(2)} Hz, retuning oscillators...`);
      
      if (!audioContextRef.current || layersRef.current.length === 0) return;
      
      const audioContext = audioContextRef.current;
      const now = audioContext.currentTime;
      const glideTime = 0.1; // 100ms smooth pitch glide
      
      // Retune each oscillator smoothly
      layersRef.current.forEach(layer => {
        layer.oscillators.forEach((osc, idx) => {
          const cents = layer.intervals[idx];
          const newFreq = centsToFrequency(newFrequency, cents);
          
          // Smooth frequency ramp (exponential for pitch)
          osc.frequency.cancelScheduledValues(now);
          osc.frequency.setValueAtTime(osc.frequency.value, now);
          osc.frequency.exponentialRampToValueAtTime(newFreq, now + glideTime);
        });
      });
    });
    return unsubscribe;
  }, []);

  // Initialize audio context and layers
  useEffect(() => {
    if (!enabled) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;

    // Create master gain node
    const masterGain = audioContext.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(audioContext.destination);
    masterGainRef.current = masterGain;

    // dk:music Define 5 layers with risk thresholds
    const layerDefinitions = [
      { name: 'drone', threshold: 0.0, intervals: [SYNOD_SCALE.unison], volume: 0.15 },
      { name: 'tension1', threshold: 0.3, intervals: [SYNOD_SCALE.unison, SYNOD_SCALE.propagandaTone], volume: 0.12 },
      { name: 'tension2', threshold: 0.5, intervals: [SYNOD_SCALE.unison, SYNOD_SCALE.surveillanceThird, SYNOD_SCALE.controlFifth], volume: 0.1 },
      { name: 'tension3', threshold: 0.7, intervals: [SYNOD_SCALE.unison, SYNOD_SCALE.regimeFourth, SYNOD_SCALE.controlFifth], volume: 0.08 },
      { name: 'action', threshold: 0.9, intervals: [SYNOD_SCALE.unison, SYNOD_SCALE.tritone], volume: 0.12 }
    ];

    // Create oscillators for each layer
    const layers: MusicLayer[] = layerDefinitions.map(def => {
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Start silent
      gainNode.connect(masterGain);

      const oscillators = def.intervals.map(cents => {
        const osc = audioContext.createOscillator();
        osc.type = 'sawtooth'; // dk:music Harsh sawtooth = surveillance aesthetic
        osc.frequency.value = centsToFrequency(getBaseFrequency(), cents);
        osc.connect(gainNode);
        osc.start();
        return osc;
      });

      return {
        name: def.name,
        oscillators,
        intervals: def.intervals, // Store for retuning
        gainNode,
        riskThreshold: def.threshold,
        targetVolume: def.volume
      };
    });

    layersRef.current = layers;

    return () => {
      // Cleanup
      layers.forEach(layer => {
        layer.oscillators.forEach(osc => {
          try {
            osc.stop();
          } catch {
            // Already stopped
          }
        });
      });
      audioContext.close();
    };
  }, [enabled, masterVolume]); // dk:perf No restart trigger - retune in place instead

  // Update layers based on risk score
  useEffect(() => {
    if (!enabled || !audioContextRef.current || layersRef.current.length === 0) return;

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime;
    const rampDuration = 2.0; // dk:music 2-second crossfades for smooth transitions

    layersRef.current.forEach(layer => {
      const shouldBeActive = riskScore >= layer.riskThreshold;
      const targetGain = shouldBeActive ? layer.targetVolume : 0;

      // Smooth gain ramp
      layer.gainNode.gain.cancelScheduledValues(now);
      layer.gainNode.gain.setValueAtTime(layer.gainNode.gain.value, now);
      layer.gainNode.gain.linearRampToValueAtTime(targetGain, now + rampDuration);
    });

    // dk:reminder Could trigger visual effects here (screen shake at 0.9, red tint, etc.)
  }, [riskScore, enabled]);

  // Update master volume
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
      masterGainRef.current.gain.linearRampToValueAtTime(masterVolume, now + 0.5);
    }
  }, [masterVolume]);

  // dk:perf Return minimal interface - no state needed for rendering
  return { riskScore };
};

// dk:perf Oscillators run continuously (CPU-efficient vs recreating)
// dk:music Crossfade duration (2s) matches typical simulation tick rate changes
// dk:vision Active layers could trigger visual effects (flash on action layer, etc.)
