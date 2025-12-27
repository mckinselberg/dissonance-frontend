import { useEffect, useRef, useState } from 'react';
import { centsToFrequency, BASE_FREQUENCY, SYNOD_SCALE } from '../lib/synodScale';
import { STANDARD_12TET } from '../lib/traditionalMusic';

/**
 * WelcomeTune - Plays on page load to demonstrate the sonic transformation
 * from Synod (surveillance/dystopia) to Traditional 12-TET (truth/harmony)
 * 
 * dk:music This is the "hook" - players immediately hear the regime's corruption
 * harmonize into truth. It's worldbuilding in the first 3 seconds.
 */
export const WelcomeTune: React.FC = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  useEffect(() => {
    // Only play once per session
    if (hasPlayed) return;

    const playWelcomeTune = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        const now = audioContext.currentTime;
        const transitionDuration = 3.0; // 3 seconds for full transformation

        // C-E-G chord intervals
        const synodIntervals = [
          SYNOD_SCALE.unison,           // C (0¢)
          SYNOD_SCALE.surveillanceThird, // E (350¢ - hollow)
          SYNOD_SCALE.controlFifth       // G (720¢ - oppressive)
        ];

        const traditionalIntervals = [
          STANDARD_12TET.unison,      // C (0¢)
          STANDARD_12TET.majorThird,  // E (400¢ - pure)
          STANDARD_12TET.perfectFifth // G (700¢ - perfect)
        ];

        // Create three oscillators (one per note)
        synodIntervals.forEach((startCents, i) => {
          const endCents = traditionalIntervals[i];
          
          const osc = audioContext.createOscillator();
          osc.type = 'sawtooth'; // Regime harsh timbre
          
          const startFreq = centsToFrequency(BASE_FREQUENCY, startCents);
          const endFreq = centsToFrequency(BASE_FREQUENCY, endCents);
          
          osc.frequency.setValueAtTime(startFreq, now);
          
          // Exponential ramp from Synod to Traditional (smooth glide)
          osc.frequency.exponentialRampToValueAtTime(endFreq, now + transitionDuration);

          // Create gain envelope (fade in, hold, fade out)
          const gainNode = audioContext.createGain();
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.15, now + 0.3); // Fade in
          gainNode.gain.setValueAtTime(0.15, now + transitionDuration); // Hold
          gainNode.gain.linearRampToValueAtTime(0, now + transitionDuration + 1.0); // Fade out

          osc.connect(gainNode);
          gainNode.connect(audioContext.destination);

          osc.start(now);
          osc.stop(now + transitionDuration + 1.0);

          oscillatorsRef.current.push(osc);
        });

        // Mark as played to prevent repeats
        setTimeout(() => {
          setHasPlayed(true);
          oscillatorsRef.current = [];
        }, (transitionDuration + 1.0) * 1000);

      } catch (error) {
        console.error('WelcomeTune failed to play:', error);
        setHasPlayed(true); // Don't retry on error
      }
    };

    // Small delay to ensure page is ready
    const timer = setTimeout(() => {
      playWelcomeTune();
    }, 500);

    return () => {
      clearTimeout(timer);
      oscillatorsRef.current.forEach(osc => {
        try {
          osc.stop();
        } catch {
          // Already stopped
        }
      });
      audioContextRef.current?.close();
    };
  }, [hasPlayed]);

  return null; // No visual component
};

// dk:ux Consider adding a "Skip Intro" button if users find it annoying after first visit
// dk:reminder Store hasPlayed in localStorage to prevent replay across sessions
// dk:music Alternative: Start with pure intervals, corrupt to Synod (resistance → regime takeover)
