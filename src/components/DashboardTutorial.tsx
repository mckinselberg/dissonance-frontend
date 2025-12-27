import { useState } from 'react';
import { isFeatureEnabled } from '../lib/featureFlags';

/**
 * Inline Tutorial Component
 * 
 * Displays contextual help/tutorials within dashboard UI.
 * Toggleable via button in top-right corner.
 * 
 * dk:ux Tutorials integrated into UI (not separate docs)
 * dk:vision Helps new users discover all features without leaving app
 */

interface TutorialSection {
  title: string;
  icon: string;
  content: string[];
  keyboardShortcuts?: { key: string; description: string }[];
}

export const DashboardTutorial: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isFeatureEnabled('tutorial.dashboard_inline')) {
    return null; // Feature flag disabled
  }

  const sections: TutorialSection[] = [
    {
      title: 'Note Duration Control',
      icon: '⏱️',
      content: [
        'Hold a key THEN click a note button to use that duration:',
      ],
      keyboardShortcuts: [
        { key: 'A', description: 'Semi-quaver (♬ very fast - 0.25s)' },
        { key: 'S', description: 'Crotchet (♩ normal - 1.0s)' },
        { key: 'D', description: 'Minim (𝅗𝅥 long - 2.0s)' },
        { key: '(none)', description: 'Quaver (♪ default - 0.5s)' }
      ]
    },
    {
      title: 'Recording Feature',
      icon: '🎙️',
      content: [
        'Capture your musical performances with timing:',
      ],
      keyboardShortcuts: [
        { key: 'Ctrl-Alt-R', description: 'Start recording (red indicator appears)' },
        { key: '(click buttons)', description: 'Play notes while recording - captures timing' },
        { key: 'Spacebar', description: 'Stop recording' },
        { key: '▶ Play Recording', description: 'Replay your performance' },
        { key: '🗑️ Clear', description: 'Delete recording and start over' }
      ]
    },
    {
      title: 'Music Scales',
      icon: '🎵',
      content: [
        'Three scale systems available in sandboxes:',
        '',
        '🎼 Traditional (12-TET): Standard Western music, familiar intervals',
        '👁️ Synod Scale: Microtonal surveillance aesthetic (propaganda, hollow, tense)',
        '✊ Pure Intervals: Perfect mathematical ratios (3:2, 4:3, 5:4)'
      ]
    },
    {
      title: 'Dashboard Music',
      icon: '🎮',
      content: [
        'Adaptive music responds automatically to simulation risk:',
        '',
        '• Drone (always): Low C hum (base layer)',
        '• Tension 1 (0.3): Propaganda tone (unease)',
        '• Tension 2 (0.5): Hollow chord (heightened)',
        '• Tension 3 (0.7): Tense chord (danger)',
        '• Action (0.9): Tritone alarm (CRISIS)',
        '',
        'Music crossfades smoothly as risk changes.'
      ]
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: isOpen ? '#00ff00' : '#333',
          color: isOpen ? '#000' : '#00ff00',
          border: '2px solid #00ff00',
          borderRadius: '8px',
          padding: '10px 20px',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(0, 255, 0, 0.3)',
          transition: 'all 0.2s ease'
        }}
      >
        {isOpen ? '✖ Close Tutorial' : '? Help'}
      </button>

      {/* Tutorial Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          width: '500px',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: '#1a1a1a',
          border: '2px solid #00ff00',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 8px 24px rgba(0, 255, 0, 0.4)',
          fontFamily: 'monospace',
          color: '#fff'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            color: '#00ff00',
            fontSize: '24px',
            borderBottom: '2px solid #00ff00',
            paddingBottom: '10px'
          }}>
            🎮 Developer Dashboard Tutorial
          </h2>

          {sections.map((section, idx) => (
            <div key={idx} style={{
              marginBottom: '30px',
              padding: '15px',
              background: '#252525',
              borderRadius: '8px',
              border: '1px solid #333'
            }}>
              <h3 style={{
                margin: '0 0 10px 0',
                color: '#00ff00',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </h3>

              {section.content.map((line, lineIdx) => (
                <p key={lineIdx} style={{
                  margin: '5px 0',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  color: line === '' ? 'transparent' : '#ccc'
                }}>
                  {line || '\u00A0'}
                </p>
              ))}

              {section.keyboardShortcuts && (
                <div style={{ marginTop: '15px' }}>
                  {section.keyboardShortcuts.map((shortcut, scIdx) => (
                    <div key={scIdx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      marginBottom: '8px',
                      padding: '8px',
                      background: '#1a1a1a',
                      borderRadius: '4px'
                    }}>
                      <kbd style={{
                        background: '#333',
                        border: '2px solid #555',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: '#00ff00',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}>
                        {shortcut.key}
                      </kbd>
                      <span style={{
                        fontSize: '14px',
                        color: '#aaa',
                        flex: 1
                      }}>
                        {shortcut.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: '#252525',
            borderRadius: '8px',
            border: '1px solid #555',
            color: '#888',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            💡 <strong>Tip:</strong> Try the music sandboxes (tabs above) to experiment with scales and recording!
          </div>
        </div>
      )}
    </div>
  );
};

// dk:ux Tutorial button always visible but non-intrusive (top-right corner)
// dk:vision Future: Track which sections user has read, show progress indicator
// dk:business Future: A/B test tutorial content to optimize onboarding conversion
