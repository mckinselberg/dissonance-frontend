import { useState } from 'react'
import './App.css'
import { SynodPlayground } from './components/SynodPlayground'
import { TraditionalMusicPlayground } from './components/TraditionalMusicPlayground'
import { WelcomeTune } from './components/WelcomeTune'
import { SpectatorView } from './components/SpectatorView'
import { FrequencyTuner } from './components/FrequencyTuner'
import { OpeningQuote } from './components/OpeningQuote'

type ViewMode = 'dashboard' | 'sandbox-traditional' | 'sandbox-synod' | 'sandbox-pure';

function App() {
  // dk:narrative Opening quote is the entry point - click to enter the game
  const [showOpening, setShowOpening] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('sandbox-traditional') // dk:temporary Back to playgrounds as default for testing

  const handleStartGame = () => {
    setShowOpening(false)
    // dk:music Opening quote establishes "sound is regulated" narrative
  }

  return (
    <>
      {/* dk:narrative Opening quote IS the "Start Game" button */}
      {showOpening && <OpeningQuote onStart={handleStartGame} />}

      {/* Main application (only shown after opening quote dismissed) */}
      {!showOpening && (
        <div style={{ minHeight: '100vh', background: '#111', color: '#fff' }}>
          <WelcomeTune />
          <FrequencyTuner />
      
      <header style={{ 
        padding: '20px', 
        background: '#000', 
        borderBottom: '2px solid #333',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontFamily: 'monospace' }}>
          {viewMode === 'dashboard' ? '🎮 SignalNet: Developer Dashboard' : '🎵 Music Sandbox'}
        </h1>
        <p style={{ margin: '10px 0 0 0', color: '#888' }}>
          {viewMode === 'dashboard' 
            ? 'Live simulation with adaptive Synod scale music' 
            : 'Experiment with microtonal scales and intervals'}
        </p>
      </header>

      <div style={{ 
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        gap: '10px',
        background: '#0a0a0a',
        borderBottom: '1px solid #333',
        flexWrap: 'wrap'
      }}>
        {/* dk:important Dashboard is now the MAIN view, sandboxes are secondary */}
        <button
          onClick={() => setViewMode('dashboard')}
          style={{
            padding: '15px 30px',
            background: viewMode === 'dashboard' ? '#0088ff' : '#333',
            color: '#fff',
            border: viewMode === 'dashboard' ? '3px solid #00aaff' : '2px solid #444',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'all 0.2s'
          }}
        >
          🎮 Developer Dashboard
        </button>
        
        {/* Separator */}
        <div style={{ width: '2px', background: '#444', margin: '5px 10px' }} />

        {/* Music Sandbox section */}
        <button
          onClick={() => setViewMode('sandbox-traditional')}
          style={{
            padding: '15px 30px',
            background: viewMode === 'sandbox-traditional' ? '#00aa00' : '#333',
            color: '#fff',
            border: viewMode === 'sandbox-traditional' ? '2px solid #00ff00' : '2px solid #444',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: viewMode.startsWith('sandbox') ? 'bold' : 'normal',
            transition: 'all 0.2s',
            opacity: viewMode.startsWith('sandbox') ? 1 : 0.7
          }}
        >
          🎼 12-TET Sandbox
        </button>
        <button
          onClick={() => setViewMode('sandbox-synod')}
          style={{
            padding: '15px 30px',
            background: viewMode === 'sandbox-synod' ? '#ff4444' : '#333',
            color: '#fff',
            border: viewMode === 'sandbox-synod' ? '2px solid #ff6666' : '2px solid #444',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: viewMode.startsWith('sandbox') ? 'bold' : 'normal',
            transition: 'all 0.2s',
            opacity: viewMode.startsWith('sandbox') ? 1 : 0.7
          }}
        >
          👁️ Synod Sandbox
        </button>
        <button
          onClick={() => setViewMode('sandbox-pure')}
          style={{
            padding: '15px 30px',
            background: viewMode === 'sandbox-pure' ? '#44ff44' : '#333',
            color: viewMode === 'sandbox-pure' ? '#000' : '#fff',
            border: viewMode === 'sandbox-pure' ? '2px solid #66ff66' : '2px solid #444',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: viewMode.startsWith('sandbox') ? 'bold' : 'normal',
            transition: 'all 0.2s',
            opacity: viewMode.startsWith('sandbox') ? 1 : 0.7
          }}
        >
          ✊ Pure Sandbox
        </button>
      </div>

      {/* dk:important Dashboard with integrated music is the main view */}
      {viewMode === 'dashboard' ? (
        <SpectatorView />
      ) : viewMode === 'sandbox-traditional' ? (
        <div>
          <div style={{ padding: '20px', background: '#1a1a1a', borderBottom: '2px solid #333' }}>
            <p style={{ margin: 0, color: '#888', fontFamily: 'monospace', fontSize: '14px' }}>
              🎵 <strong>Music Sandbox:</strong> Experiment with traditional 12-TET scale intervals and emotional palettes.
              This is a testing tool, not the main UI. Return to Developer Dashboard for live simulation.
            </p>
          </div>
          <TraditionalMusicPlayground />
        </div>
      ) : viewMode === 'sandbox-synod' ? (
        <div>
          <div style={{ padding: '20px', background: '#1a1a1a', borderBottom: '2px solid #333' }}>
            <p style={{ margin: 0, color: '#888', fontFamily: 'monospace', fontSize: '14px' }}>
              👁️ <strong>Synod Sandbox:</strong> Experiment with the microtonal Synod scale (surveillance aesthetic).
              This is a testing tool, not the main UI. Return to Developer Dashboard for live simulation.
            </p>
          </div>
          <SynodPlayground scale="synod" />
        </div>
      ) : (
        <div>
          <div style={{ padding: '20px', background: '#1a1a1a', borderBottom: '2px solid #333' }}>
            <p style={{ margin: 0, color: '#888', fontFamily: 'monospace', fontSize: '14px' }}>
              ✊ <strong>Pure Intervals Sandbox:</strong> Experiment with just intonation (perfect frequency ratios).
              This is a testing tool, not the main UI. Return to Developer Dashboard for live simulation.
            </p>
          </div>
          <SynodPlayground scale="pure" />
        </div>
      )}

      <footer style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        borderTop: '1px solid #333',
        marginTop: '40px'
      }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Music is narrative. Harmony is politics. Tuning is worldview.
        </p>
        <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>
          SignalNet (Dissonance Engine) | Built with Web Audio API
        </p>
      </footer>
        </div>
      )}
    </>
  )
}

export default App
