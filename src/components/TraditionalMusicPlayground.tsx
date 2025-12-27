import { useEffect, useRef, useState } from 'react';
import { STANDARD_12TET, CHORD_PROGRESSIONS, SCALES, EMOTIONAL_PALETTES } from '../lib/traditionalMusic';
import { centsToFrequency, BASE_FREQUENCY } from '../lib/synodScale';

type EmotionKey = keyof typeof EMOTIONAL_PALETTES;
type ChordKey = keyof typeof CHORD_PROGRESSIONS;
type ScaleKey = keyof typeof SCALES;

type RecordedNote = {
  cents: number;
  duration: number;
  timbre: OscillatorType;
  timestamp: number;
};

export const TraditionalMusicPlayground: React.FC = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionKey>('happy');
  const activeOscillatorsRef = useRef<OscillatorNode[]>([]);
  const [heldKeys, setHeldKeys] = useState<Set<string>>(new Set());
  const [isRecording, setIsRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const [showTutorial, setShowTutorial] = useState(false);

  // dk:ux Removed isPlaying state - non-blocking playback for musical feel

  // dk:music Keyboard modifiers for note durations
  const getDuration = (): number => {
    if (heldKeys.has('a')) return 0.25;  // Semi-quaver (16th note)
    if (heldKeys.has('s')) return 1.0;   // Crotchet (quarter note)
    if (heldKeys.has('d')) return 2.0;   // Minim (half note)
    return 0.5; // Default: Quaver (8th note)
  };

  const getDurationLabel = (): string => {
    if (heldKeys.has('a')) return '♬ Semi-quaver';
    if (heldKeys.has('s')) return '♩ Crotchet';
    if (heldKeys.has('d')) return '𝅗𝅥 Minim';
    return '♪ Quaver';
  };

  const getDurationDescription = (): string => {
    if (heldKeys.has('a')) return 'Very Fast • 0.25s';
    if (heldKeys.has('s')) return 'Slow • 1.0s';
    if (heldKeys.has('d')) return 'Very Slow • 2.0s';
    return 'Medium • 0.5s';
  };

  const stopAllOscillators = () => {
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop();
      } catch {
        // Already stopped
      }
    });
    activeOscillatorsRef.current = [];
  };

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Keyboard listeners for duration modifiers + recording
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl-Alt-R: Start recording (arrrrrrr!)
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'r' && !isRecording) {
        e.preventDefault(); // Prevent any browser shortcuts
        setIsRecording(true);
        setRecordedNotes([]);
        recordingStartTimeRef.current = audioContextRef.current?.currentTime || 0;
        return;
      }

      // dk:ux Removed spacebar stop - use UI button instead (less accidental stops)

      const key = e.key.toLowerCase();
      if (['a', 's', 'd'].includes(key)) {
        setHeldKeys(prev => new Set(prev).add(key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setHeldKeys(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      stopAllOscillators();
      audioContextRef.current?.close();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playNote = (cents: number, duration: number | undefined, timbre: OscillatorType, delay: number = 0) => {
    if (!audioContextRef.current) return;

    const audioContext = audioContextRef.current;
    const now = audioContext.currentTime + delay;
    const actualDuration = duration !== undefined ? duration : getDuration();

    // dk:music Record notes while Ctrl-R held (arrrrrrr!)
    if (isRecording && delay === 0) {
      const timestamp = audioContext.currentTime * 1000; // Use audio time for precision
      setRecordedNotes(prev => [...prev, { cents, duration: actualDuration, timbre, timestamp }]);
    }

    const osc = audioContext.createOscillator();
    osc.type = timbre;
    osc.frequency.value = centsToFrequency(BASE_FREQUENCY, cents);

    const gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.setValueAtTime(0.2, now + actualDuration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, now + actualDuration);

    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + actualDuration);

    activeOscillatorsRef.current.push(osc);

    osc.onended = () => {
      activeOscillatorsRef.current = activeOscillatorsRef.current.filter(o => o !== osc);
    };
  };

  const playChord = (intervals: readonly number[], duration?: number, timbre: OscillatorType = 'sine') => {
    // dk:ux Don't stop other sounds - allow overlapping chords for experimentation
    const actualDuration = duration !== undefined ? duration : getDuration();
    intervals.forEach(cents => playNote(cents, actualDuration, timbre));
  };

  const playProgression = (emotion: EmotionKey) => {
    stopAllOscillators(); // Progressions should be exclusive (musical phrase)

    const palette = EMOTIONAL_PALETTES[emotion];
    const beatDuration = 60 / palette.tempo; // Convert BPM to seconds per beat

    // Play I-IV-V-I progression (4 chords, 2 beats each)
    const chords: number[][] = [
      [...CHORD_PROGRESSIONS.majorTonic],
      [...CHORD_PROGRESSIONS.majorSubdominant],
      [...CHORD_PROGRESSIONS.majorDominant],
      [...CHORD_PROGRESSIONS.majorTonic],
    ];

    if (emotion === 'sad') {
      chords[0] = [...CHORD_PROGRESSIONS.minorTonic];
      chords[3] = [...CHORD_PROGRESSIONS.minorTonic];
    } else if (emotion === 'tense') {
      chords[1] = [...CHORD_PROGRESSIONS.diminished];
      chords[2] = [...CHORD_PROGRESSIONS.dominantSeventh];
    } else if (emotion === 'dreamy') {
      chords[0] = [...CHORD_PROGRESSIONS.majorSeventh];
      chords[2] = [...CHORD_PROGRESSIONS.augmented];
    }

    chords.forEach((chord, i) => {
      chord.forEach(cents => {
        playNote(cents, beatDuration * 2, palette.timbre as OscillatorType, i * beatDuration * 2);
      });
    });
  };

  const playScale = (scaleKey: ScaleKey, timbre: OscillatorType = 'sine') => {
    stopAllOscillators(); // Scales are melodic sequences (exclusive)

    const scale = SCALES[scaleKey];
    const noteDuration = 0.3;

    scale.forEach((cents, i) => {
      playNote(cents, noteDuration, timbre, i * noteDuration);
    });
  };

  const playRecording = () => {
    if (recordedNotes.length === 0) return;
    stopAllOscillators();

    const startTime = recordedNotes[0].timestamp;
    recordedNotes.forEach(note => {
      const relativeDelay = (note.timestamp - startTime) / 1000;
      playNote(note.cents, note.duration, note.timbre, relativeDelay);
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const clearRecording = () => {
    setRecordedNotes([]);
  };

  // dk:reminder Recording data is stored in-memory only (recordedNotes state)
  // dk:future Add localStorage persistence or export to JSON file

  const emotionPalette = EMOTIONAL_PALETTES[selectedEmotion];

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      {/* Tutorial Toggle */}
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => setShowTutorial(!showTutorial)}
          style={{
            padding: '8px 16px',
            background: showTutorial ? '#00cc00' : '#444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showTutorial ? '✓ Tutorial' : '? Help'}
        </button>
      </div>

      {/* Tutorial Panel */}
      {showTutorial && (
        <div style={{
          marginBottom: '20px',
          padding: '20px',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '2px solid #00cc00'
        }}>
          <h3 style={{ marginTop: 0 }}>🎓 How to Use the Music Playground</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>🎹 Basic Playback</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li>Click any button to play that note/chord/progression</li>
              <li>Sounds overlap - play multiple at once (polyphonic!)</li>
              <li>Rapid-fire clicking creates cluster chords</li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>⏱️ Note Duration Control</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li><strong>A key:</strong> Semi-quaver (♬ very fast - 0.25s)</li>
              <li><strong>S key:</strong> Crotchet (♩ normal - 1.0s)</li>
              <li><strong>D key:</strong> Minim (𝅗𝅥 long - 2.0s)</li>
              <li><strong>No key:</strong> Quaver (♪ default - 0.5s)</li>
              <li>Hold key THEN click button to use that duration</li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>🎙️ Recording Feature</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li><strong>Ctrl-Alt-R:</strong> Start recording (red indicator appears)</li>
              <li>Click buttons while recording - captures with timing</li>
              <li><strong>⏹️ Stop Recording button:</strong> End recording session</li>
              <li><strong>▶ Play Recording:</strong> Replay your performance</li>
              <li><strong>🗑️ Clear:</strong> Delete recording and start over</li>
              <li><em>Note:</em> Recordings stored in memory only (lost on page refresh)</li>
            </ul>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>🎨 Emotional Palettes</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li>Each emotion has unique tempo, chords, and timbre</li>
              <li><strong>Triumph:</strong> Bold, major, 140 BPM</li>
              <li><strong>Melancholy:</strong> Sad, minor, 72 BPM</li>
              <li><strong>Mystery:</strong> Suspense, diminished, 96 BPM</li>
              <li>Try different emotions to hear the mood shift!</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#00cc00', marginBottom: '8px' }}>💡 Pro Tips</h4>
            <ul style={{ lineHeight: '1.6', color: '#ccc' }}>
              <li>Hold A and rapid-fire click for fast arpeggios</li>
              <li>Record a bass line, then play melody over it</li>
              <li>Use headphones to hear microtonal differences</li>
              <li>Experiment with overlapping chords for texture</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recording indicator with stop button */}
      {isRecording && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px 20px',
          background: 'rgba(255, 0, 0, 0.9)',
          color: '#fff',
          borderRadius: '8px',
          border: '3px solid #ff0000',
          fontWeight: 'bold',
          fontSize: '18px',
          boxShadow: '0 4px 12px rgba(255, 0, 0, 0.5)',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#fff'
            }} />
            <span>● RECORDING ({recordedNotes.length} notes)</span>
          </div>
          <button
            onClick={stopRecording}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#fff',
              color: '#aa0000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px'
            }}
          >
            ⏹️ Stop Recording
          </button>
        </div>
      )}

      <h2>🎼 Traditional Western Music (12-TET)</h2>
      <p style={{ color: '#aaa', marginBottom: '20px' }}>
        Standard equal temperament - the "correct" sound that makes Synod scale feel "wrong"
      </p>

      {/* Duration Control Panel - Instrument-like interface */}
      <div style={{ 
        marginBottom: '25px', 
        padding: '20px', 
        background: heldKeys.size > 0 ? 'linear-gradient(135deg, #1a4d1a 0%, #0d260d 100%)' : 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
        borderRadius: '8px',
        border: heldKeys.size > 0 ? '3px solid #00ff00' : '2px solid #444',
        transition: 'all 0.3s ease',
        boxShadow: heldKeys.size > 0 ? '0 4px 20px rgba(0, 255, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Main Duration Display */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '15px'
        }}>
          <div>
            <div style={{ 
              fontSize: '12px', 
              color: '#888', 
              textTransform: 'uppercase', 
              letterSpacing: '1px',
              marginBottom: '5px'
            }}>
              Note Duration
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: heldKeys.size > 0 ? '#00ff00' : '#fff',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '40px' }}>{getDurationLabel().split(' ')[0]}</span>
              <span>{getDurationLabel().split(' ').slice(1).join(' ')}</span>
            </div>
            <div style={{ 
              fontSize: '14px', 
              color: heldKeys.size > 0 ? '#00cc00' : '#aaa',
              marginTop: '5px',
              fontWeight: heldKeys.size > 0 ? 'bold' : 'normal',
              transition: 'all 0.2s'
            }}>
              {getDurationDescription()}
            </div>
          </div>
          
          {/* Visual Duration Bar */}
          <div style={{ 
            width: '120px', 
            height: '60px', 
            background: '#1a1a1a',
            borderRadius: '4px',
            border: '1px solid #444',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${(getDuration() / 2.0) * 100}%`,
              background: heldKeys.size > 0 
                ? 'linear-gradient(90deg, #00ff00 0%, #00aa00 100%)'
                : 'linear-gradient(90deg, #666 0%, #444 100%)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {getDuration()}s
            </div>
          </div>
        </div>

        {/* Keyboard Controls Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #444'
        }}>
          {/* Default (no key) */}
          <div style={{
            padding: '12px',
            background: !heldKeys.size ? '#333' : '#222',
            borderRadius: '6px',
            border: !heldKeys.size ? '2px solid #666' : '1px solid #333',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px' }}>♪</div>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '3px' }}>DEFAULT</div>
            <div style={{ fontSize: '10px', color: '#666' }}>0.5s</div>
          </div>

          {/* A key */}
          <div style={{
            padding: '12px',
            background: heldKeys.has('a') ? 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)' : '#222',
            borderRadius: '6px',
            border: heldKeys.has('a') ? '2px solid #00ff00' : '1px solid #333',
            textAlign: 'center',
            transition: 'all 0.2s',
            transform: heldKeys.has('a') ? 'scale(1.05)' : 'scale(1)',
            boxShadow: heldKeys.has('a') ? '0 4px 15px rgba(0, 255, 0, 0.4)' : 'none'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px', color: heldKeys.has('a') ? '#000' : '#fff' }}>♬</div>
            <kbd style={{ 
              background: heldKeys.has('a') ? '#000' : '#333', 
              padding: '3px 8px', 
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: heldKeys.has('a') ? '#00ff00' : '#888',
              display: 'inline-block',
              marginBottom: '3px'
            }}>A</kbd>
            <div style={{ fontSize: '10px', color: heldKeys.has('a') ? '#000' : '#666' }}>0.25s</div>
          </div>

          {/* S key */}
          <div style={{
            padding: '12px',
            background: heldKeys.has('s') ? 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)' : '#222',
            borderRadius: '6px',
            border: heldKeys.has('s') ? '2px solid #00ff00' : '1px solid #333',
            textAlign: 'center',
            transition: 'all 0.2s',
            transform: heldKeys.has('s') ? 'scale(1.05)' : 'scale(1)',
            boxShadow: heldKeys.has('s') ? '0 4px 15px rgba(0, 255, 0, 0.4)' : 'none'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px', color: heldKeys.has('s') ? '#000' : '#fff' }}>♩</div>
            <kbd style={{ 
              background: heldKeys.has('s') ? '#000' : '#333', 
              padding: '3px 8px', 
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: heldKeys.has('s') ? '#00ff00' : '#888',
              display: 'inline-block',
              marginBottom: '3px'
            }}>S</kbd>
            <div style={{ fontSize: '10px', color: heldKeys.has('s') ? '#000' : '#666' }}>1.0s</div>
          </div>

          {/* D key */}
          <div style={{
            padding: '12px',
            background: heldKeys.has('d') ? 'linear-gradient(135deg, #00ff00 0%, #00aa00 100%)' : '#222',
            borderRadius: '6px',
            border: heldKeys.has('d') ? '2px solid #00ff00' : '1px solid #333',
            textAlign: 'center',
            transition: 'all 0.2s',
            transform: heldKeys.has('d') ? 'scale(1.05)' : 'scale(1)',
            boxShadow: heldKeys.has('d') ? '0 4px 15px rgba(0, 255, 0, 0.4)' : 'none'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '5px', color: heldKeys.has('d') ? '#000' : '#fff' }}>𝅗𝅥</div>
            <kbd style={{ 
              background: heldKeys.has('d') ? '#000' : '#333', 
              padding: '3px 8px', 
              borderRadius: '3px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: heldKeys.has('d') ? '#00ff00' : '#888',
              display: 'inline-block',
              marginBottom: '3px'
            }}>D</kbd>
            <div style={{ fontSize: '10px', color: heldKeys.has('d') ? '#000' : '#666' }}>2.0s</div>
          </div>
        </div>

        {/* Instruction Text */}
        <div style={{ 
          marginTop: '12px', 
          fontSize: '12px', 
          color: '#666',
          textAlign: 'center',
          fontStyle: 'italic'
        }}>
          Hold key + click any button to play with that duration
        </div>
      </div>

      {/* Recording controls */}
      {recordedNotes.length > 0 && !isRecording && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: '#1a1a1a',
          borderRadius: '8px',
          border: '2px solid #00ff00'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            🎹 Recorded Sequence ({recordedNotes.length} notes)
          </h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={playRecording}
              style={{
                padding: '10px 20px',
                background: '#00cc00',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ▶ Play Recording
            </button>
            <button
              onClick={clearRecording}
              style={{
                padding: '10px 20px',
                background: '#cc0000',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🗑️ Clear
            </button>
          </div>
          <div style={{
            marginTop: '10px',
            fontSize: '12px',
            color: '#888'
          }}>
            💾 Recording stored in memory (not saved to disk) • Press Ctrl-Alt-R to record again
          </div>
        </div>
      )}

      {/* Emotional Palettes */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Emotional Palettes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
          {(Object.keys(EMOTIONAL_PALETTES) as EmotionKey[]).map((emotion) => {
            const palette = EMOTIONAL_PALETTES[emotion];
            return (
              <button
                key={emotion}
                onClick={() => setSelectedEmotion(emotion)}
                style={{
                  padding: '15px',
                  background: selectedEmotion === emotion ? '#0066cc' : '#333',
                  color: '#fff',
                  border: selectedEmotion === emotion ? '2px solid #4499ff' : '2px solid #444',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <strong style={{ fontSize: '16px', textTransform: 'capitalize' }}>{emotion}</strong>
                <br />
                <small style={{ color: '#aaa' }}>{palette.description}</small>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => playProgression(selectedEmotion)}
          style={{
            padding: '15px 30px',
            background: '#00aa00',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ▶ Play {selectedEmotion.charAt(0).toUpperCase() + selectedEmotion.slice(1)} Progression
        </button>

        <div style={{ marginTop: '10px', padding: '10px', background: '#222', borderRadius: '4px' }}>
          <strong>Current Emotion:</strong> {selectedEmotion}<br />
          <strong>Tempo:</strong> {emotionPalette.tempo} BPM<br />
          <strong>Timbre:</strong> {emotionPalette.timbre} wave<br />
          <strong>Feeling:</strong> {emotionPalette.description}
        </div>
      </div>

      {/* Individual Chords */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Classic Chords</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {(Object.entries(CHORD_PROGRESSIONS) as [ChordKey, readonly number[]][]).map(([name, intervals]) => (
            <button
              key={name}
              onClick={() => playChord(intervals, undefined, emotionPalette.timbre as OscillatorType)}
              style={{
                padding: '10px',
                background: name.includes('major') && !name.includes('Seventh') ? '#006600' : 
                           name.includes('minor') ? '#000066' : 
                           name.includes('diminished') ? '#660000' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              {name.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Scales */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Musical Scales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {(Object.keys(SCALES) as ScaleKey[]).map((scaleKey) => (
            <button
              key={scaleKey}
              onClick={() => playScale(scaleKey, emotionPalette.timbre as OscillatorType)}
              style={{
                padding: '15px',
                background: '#0066cc',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px'
              }}
            >
              {scaleKey.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Perfect Intervals (the contrast to Synod) */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Perfect Intervals (The "Truth")</h3>
        <p style={{ fontSize: '13px', color: '#aaa' }}>
          These are what the Synod scale deliberately avoids. Play these, then compare to Synod scale.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {Object.entries(STANDARD_12TET).map(([name, cents]) => {
            const isPerfect = name.includes('perfect') || name === 'unison' || name === 'octave';
            return (
              <button
                key={name}
                onClick={() => playChord([0, cents], undefined, 'sine')}
                style={{
                  padding: '10px',
                  background: isPerfect ? '#00aa00' : '#333',
                  color: '#fff',
                  border: isPerfect ? '2px solid #00ff00' : 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px'
                }}
              >
                {name.replace(/([A-Z])/g, ' $1').trim()}<br />
                {cents}¢
              </button>
            );
          })}
        </div>
      </div>

      {/* Educational Section */}
      <div style={{ marginTop: '30px', padding: '15px', background: '#1a4d1a', borderRadius: '4px' }}>
        <h4 style={{ marginTop: 0 }}>Why Traditional Music Sounds "Right"</h4>
        <ul style={{ lineHeight: '1.8', fontSize: '14px' }}>
          <li><strong>Perfect intervals</strong> (unison, fourth, fifth, octave) have simple frequency ratios (2:1, 3:2, 4:3)</li>
          <li><strong>Major chords</strong> sound happy/stable because of the natural overtone series</li>
          <li><strong>Minor chords</strong> sound sad but still "correct" (they're mathematically pure)</li>
          <li><strong>Cadences</strong> (I-IV-V-I) feel like "coming home" - resolution and comfort</li>
          <li><strong>Equal temperament</strong> (12-TET) slightly compromises purity for flexibility (can play in any key)</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#4d1a1a', borderRadius: '4px' }}>
        <h4 style={{ marginTop: 0 }}>⚠️ The Synod Scale Breaks These Rules</h4>
        <ul style={{ lineHeight: '1.8', fontSize: '14px' }}>
          <li><strong>No perfect fifths</strong> - The "control fifth" (720¢) is 20¢ sharp (oppressive, wrong)</li>
          <li><strong>No perfect fourths</strong> - The "regime fourth" (480¢) is 20¢ flat (tense, authoritarian)</li>
          <li><strong>Hollow thirds</strong> - At 350¢ instead of 400¢, major chords sound empty, surveilled</li>
          <li><strong>Unresolved sevenths</strong> - At 1050¢, they never want to resolve (propaganda never ends)</li>
          <li><strong>Forbidden tritone</strong> - The regime avoids it, resistance embraces it (political sound)</li>
        </ul>
        <p style={{ marginTop: '15px', fontSize: '13px', fontStyle: 'italic' }}>
          Now go back to the Synod Scale tab. Play C-E-G. Hear how wrong it sounds after hearing it "correctly" here?
          That's the dystopia encoded in harmony.
        </p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', background: '#1a1a1a', borderRadius: '4px', fontSize: '11px' }}>
        <strong>dk:music</strong> Traditional 12-TET is the baseline. Players must hear "correct" music to recognize 
        how the Synod scale sounds "corrupted" by the regime. This is worldbuilding through psychoacoustics.
      </div>
    </div>
  );
};

// dk:reminder Add MIDI playback of actual compositions (Bach, Mozart) to show 12-TET beauty
// dk:ux Consider adding a "Compare" mode that plays Synod vs 12-TET chords back-to-back
