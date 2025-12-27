/**
 * Developer Console Component
 * 
 * Send custom WebSocket messages for testing and debugging.
 * Includes message templates and JSON editor for crafting any message type.
 * 
 * dk:ux Press ` (backtick) to toggle console visibility
 * dk:architecture Only available in development mode
 */

import { useState, useRef, useEffect } from 'react';

interface DeveloperConsoleProps {
  /** WebSocket send function */
  sendMessage: (message: Record<string, unknown>) => void;
  
  /** Whether console is enabled (dev mode only) */
  enabled?: boolean;
}

// Message templates for common use cases
const MESSAGE_TEMPLATES = {
  CLIENT_PING: {
    type: 'CLIENT_PING',
    timestamp: Date.now()
  },
  
  MOVE_CITIZEN: {
    type: 'MOVE',
    position: { x: 100, y: 100, zone_id: 'zone_1' },
    destination: { x: 200, y: 200, zone_id: 'zone_1' }
  },
  
  SET_THRESHOLD_OPERATOR: {
    type: 'SET_THRESHOLD',
    threshold_type: 'risk',
    value: 0.75
  },
  
  JAM_NODE_RESISTANCE: {
    type: 'JAM_NODE',
    node_id: 'node_camera_01',
    duration: 30
  },
  
  TRIGGER_LOCKDOWN: {
    type: 'TRIGGER_LOCKDOWN',
    zone_id: 'zone_sensitive_01',
    duration: 60
  },
  
  ADMIN_SET_PARAM: {
    type: 'ADMIN_SET_PARAM',
    param: 'surveillance_density',
    value: 0.5,
    zone_id: 'zone_1'
  },
  
  PITCH_UPDATE: {
    type: 'PITCH_UPDATE',
    synod_pitch: 442.0,
    message: 'The regime adjusts the harmony. Compliance is expected.',
    timestamp: Date.now()
  },
  
  WORLD_HEARTBEAT: {
    type: 'WORLD_HEARTBEAT',
    beat_number: 1,
    tempo_bpm: 60,
    latency_ms: 50,
    timestamp: Date.now()
  },
  
  CUSTOM: {
    type: 'YOUR_MESSAGE_TYPE',
    // Add your custom fields here
  }
};

export const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({
  sendMessage,
  enabled = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messageJson, setMessageJson] = useState(
    JSON.stringify(MESSAGE_TEMPLATES.CLIENT_PING, null, 2)
  );
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof MESSAGE_TEMPLATES>('CLIENT_PING');
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Toggle console with backtick key
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '`' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // Only toggle if not typing in an input
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  if (!enabled || !isOpen) {
    return null;
  }

  const handleTemplateChange = (template: keyof typeof MESSAGE_TEMPLATES) => {
    setSelectedTemplate(template);
    
    // Update message with current timestamp for time-sensitive templates
    const templateData = { ...MESSAGE_TEMPLATES[template] };
    if ('timestamp' in templateData) {
      templateData.timestamp = Date.now();
    }
    
    setMessageJson(JSON.stringify(templateData, null, 2));
    setError(null);
  };

  const handleSend = () => {
    try {
      const parsed = JSON.parse(messageJson);
      
      // Validate required fields
      if (!parsed.type) {
        throw new Error('Message must have a "type" field');
      }
      
      sendMessage(parsed);
      setLastSent(JSON.stringify(parsed, null, 2));
      setError(null);
      
      console.log('📤 Developer Console: Sent message', parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
      console.error('❌ Developer Console: Failed to send', err);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(messageJson);
      setMessageJson(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch {
      setError('Invalid JSON - cannot format');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50vh',
        background: 'rgba(0, 0, 0, 0.95)',
        border: '2px solid #00ff00',
        borderBottom: 'none',
        color: '#00ff00',
        fontFamily: 'monospace',
        fontSize: '13px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -4px 20px rgba(0, 255, 0, 0.3)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 15px',
          background: 'rgba(0, 255, 0, 0.1)',
          borderBottom: '1px solid #00ff00',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
            🛠️ DEVELOPER CONSOLE
          </span>
          <span style={{ marginLeft: '15px', opacity: 0.7 }}>
            Press <kbd>`</kbd> to close
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: '1px solid #00ff00',
            color: '#00ff00',
            padding: '5px 10px',
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          Close [×]
        </button>
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel: Templates */}
        <div
          style={{
            width: '250px',
            borderRight: '1px solid #00ff00',
            overflowY: 'auto',
            padding: '10px'
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            📋 Message Templates
          </div>
          {Object.keys(MESSAGE_TEMPLATES).map((key) => (
            <button
              key={key}
              onClick={() => handleTemplateChange(key as keyof typeof MESSAGE_TEMPLATES)}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px',
                margin: '5px 0',
                background: selectedTemplate === key ? 'rgba(0, 255, 0, 0.2)' : 'transparent',
                border: '1px solid',
                borderColor: selectedTemplate === key ? '#00ff00' : '#004400',
                color: '#00ff00',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '3px',
                fontSize: '12px'
              }}
            >
              {key.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Center Panel: JSON Editor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold' }}>✏️ Message JSON</span>
            <button
              onClick={handleFormat}
              style={{
                background: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid #00ff00',
                color: '#00ff00',
                padding: '5px 10px',
                cursor: 'pointer',
                borderRadius: '3px',
                fontSize: '11px'
              }}
            >
              Format JSON
            </button>
            <button
              onClick={handleSend}
              style={{
                background: 'rgba(0, 255, 0, 0.2)',
                border: '2px solid #00ff00',
                color: '#00ff00',
                padding: '5px 15px',
                cursor: 'pointer',
                borderRadius: '3px',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              📤 SEND MESSAGE
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={messageJson}
            onChange={(e) => {
              setMessageJson(e.target.value);
              setError(null);
            }}
            style={{
              flex: 1,
              background: '#000',
              border: '1px solid #00ff00',
              color: '#00ff00',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'none',
              borderRadius: '3px'
            }}
            spellCheck={false}
          />

          {error && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px',
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid #ff0000',
                color: '#ff0000',
                borderRadius: '3px'
              }}
            >
              ❌ Error: {error}
            </div>
          )}
        </div>

        {/* Right Panel: Last Sent */}
        <div
          style={{
            width: '300px',
            borderLeft: '1px solid #00ff00',
            padding: '10px',
            overflowY: 'auto'
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
            📨 Last Sent Message
          </div>
          {lastSent ? (
            <pre
              style={{
                background: '#000',
                border: '1px solid #004400',
                padding: '10px',
                borderRadius: '3px',
                fontSize: '11px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {lastSent}
            </pre>
          ) : (
            <div style={{ opacity: 0.5, fontStyle: 'italic' }}>
              No messages sent yet
            </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '11px', opacity: 0.7 }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
              💡 Tips:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Edit JSON directly in center panel</li>
              <li>Messages validate on send</li>
              <li>Check browser console for responses</li>
              <li>Add timestamp with Date.now()</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '8px 15px',
          background: 'rgba(0, 255, 0, 0.05)',
          borderTop: '1px solid #00ff00',
          fontSize: '11px',
          opacity: 0.7,
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <span>
          ⚠️ Development Mode Only - Messages sent directly to backend
        </span>
        <span>
          SignalNet Developer Tools v0.1
        </span>
      </div>
    </div>
  );
};

// dk:ux Backtick toggle makes it easy to pop up console quickly
// dk:architecture Only renders in dev mode (enabled prop)
// dk:reminder Add message history/replay feature in future
// dk:business Could expose this as premium "Plugin SDK" for modders
