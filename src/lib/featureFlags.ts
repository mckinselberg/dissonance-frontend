/**
 * Context-Based Feature Flag System
 * 
 * This system serves THREE purposes:
 * 1. Feature flags for development (enable/disable features in progress)
 * 2. Database schema documentation (what data points exist in the world)
 * 3. Component reload state management (low-activity updates, targeted reloads)
 * 
 * dk:important This is the SINGLE SOURCE OF TRUTH for what data exists
 * dk:vision Schema drives UI, UI drives schema - bidirectional documentation
 * dk:business Makes onboarding developers crystal clear (see what's implemented)
 */

export type FeatureCategory = 
  | 'simulation'    // Core simulation engine features
  | 'ui'            // UI/UX features
  | 'music'         // Audio/music features
  | 'multiplayer'   // Networking/multiplayer features
  | 'tutorial'      // Tutorial/help features
  | 'analytics';    // Telemetry/analytics features

export type FeatureStatus = 
  | 'production'    // Fully implemented, tested, stable
  | 'beta'          // Implemented but not fully tested
  | 'alpha'         // Partial implementation, may have bugs
  | 'development'   // Work in progress, not ready
  | 'planned';      // Not yet started

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  status: FeatureStatus;
  enabled: boolean;
  dependencies?: string[]; // Other feature IDs this depends on
  dataSchema?: Record<string, unknown>; // Database schema this feature requires
  componentReload?: {
    strategy: 'eager' | 'lazy' | 'manual'; // When to reload component
    debounceMs?: number; // Debounce updates (low-activity optimization)
  };
  metadata?: {
    addedDate?: string;
    owner?: string;
    phase?: number; // Project phase (1-26+)
    jiraTicket?: string;
    notes?: string;
  };
}

/**
 * FEATURE FLAG REGISTRY
 * 
 * dk:important Add new features here FIRST, then implement
 * dk:vision This is the map - what exists, what's coming, what's broken
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // ========== SIMULATION FEATURES ==========
  'simulation.agents': {
    id: 'simulation.agents',
    name: 'Agent Simulation',
    description: 'Citizens, Operators, and Resistance agents with positions and behaviors',
    category: 'simulation',
    status: 'production',
    enabled: true,
    dataSchema: {
      agents: [{
        id: 'string',
        position: { x: 'number', y: 'number' },
        role: '"citizen" | "operator" | "resistance"',
        risk_score: 'number (0.0-1.0)',
        status: 'string'
      }]
    },
    componentReload: {
      strategy: 'eager', // Update immediately
      debounceMs: 100 // But debounce to avoid thrashing
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Core simulation feature, always enabled'
    }
  },

  'simulation.infrastructure': {
    id: 'simulation.infrastructure',
    name: 'Infrastructure Nodes',
    description: 'Surveillance cameras, communication towers, etc.',
    category: 'simulation',
    status: 'production',
    enabled: true,
    dataSchema: {
      nodes: [{
        id: 'string',
        type: 'string',
        position: { x: 'number', y: 'number' },
        status: 'string'
      }]
    },
    componentReload: {
      strategy: 'lazy', // Infrastructure changes rarely
      debounceMs: 1000
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24
    }
  },

  'simulation.risk_scoring': {
    id: 'simulation.risk_scoring',
    name: 'Risk Score System',
    description: 'Global and per-agent risk scores that drive music/visuals',
    category: 'simulation',
    status: 'production',
    enabled: true,
    dependencies: ['simulation.agents'],
    dataSchema: {
      risk_score: 'number (0.0-1.0)', // Global risk
      agents: [{ risk_score: 'number (0.0-1.0)' }] // Per-agent risk
    },
    componentReload: {
      strategy: 'eager',
      debounceMs: 100
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Drives adaptive music layers at thresholds: 0.3, 0.5, 0.7, 0.9'
    }
  },

  // ========== MUSIC FEATURES ==========
  'music.adaptive_synod': {
    id: 'music.adaptive_synod',
    name: 'Adaptive Synod Scale Music',
    description: 'Microtonal music system with 5 layers responding to risk_score',
    category: 'music',
    status: 'production',
    enabled: true,
    dependencies: ['simulation.risk_scoring'],
    dataSchema: {
      music_state: {
        active_layers: 'string[]', // ['drone', 'tension1', ...]
        master_volume: 'number (0.0-1.0)',
        layer_volumes: 'Record<string, number>'
      }
    },
    componentReload: {
      strategy: 'eager',
      debounceMs: 50 // Audio needs low latency
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Core surveillance aesthetic - Synod scale intervals at 0, 150, 350, 480, 600, 720, 850, 1050, 1200 cents'
    }
  },

  'music.controls_sidebar': {
    id: 'music.controls_sidebar',
    name: 'Music Controls Sidebar',
    description: 'UI for adjusting master volume, layer volumes, enable/disable',
    category: 'music',
    status: 'planned',
    enabled: false,
    dependencies: ['music.adaptive_synod'],
    componentReload: {
      strategy: 'manual' // User-triggered only
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Next priority - make music tuneable'
    }
  },

  'music.role_based_tuning': {
    id: 'music.role_based_tuning',
    name: 'Role-Based Tuning System',
    description: 'Each role perceives music at different reference pitch (A440/A435/A445)',
    category: 'music',
    status: 'alpha',
    enabled: true, // dk:important Just implemented!
    dependencies: ['music.adaptive_synod', 'simulation.agents'],
    dataSchema: {
      role_tuning: {
        operator: 'A445 (bright, authoritarian)',
        citizen: 'A440 (conditioned standard)',
        resistance: 'A435 (warm, rebellious)',
        admin: 'A440 (debug reference)'
      },
      beat_frequency: 'number (Hz warbling between roles)',
      detuning_cents: 'number (perceived "wrongness")'
    },
    componentReload: {
      strategy: 'eager',
      debounceMs: 100
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Pitch is political! Operator sounds sharp, Resistance sounds flat, Citizens conditioned to accept A440 as truth. dk:note Worldbuilding side quest collectibles reveal the truth of the in-game music mechanic through visual and auditory symbology.'
    }
  },

  'music.drone_signatures': {
    id: 'music.drone_signatures',
    name: 'Drone Reboot Signatures',
    description: 'Different drone fade-in patterns for system events (reconnect, maintenance, lockdown)',
    category: 'music',
    status: 'planned',
    enabled: false,
    dependencies: ['music.adaptive_synod'],
    dataSchema: {
      signature_types: {
        frequency_change: 'fade_duration: 2s, pitch_shift: 0 cents',
        websocket_reconnect: 'fade_duration: 3s, pitch_shift: 0 cents',
        maintenance_exit: 'fade_duration: 5s, pitch_shift: +2400 cents (up from -2 octaves)',
        match_start: 'fade_duration: 4s, pitch_shift: 0 cents',
        emergency_lockdown: 'fade_duration: 0.5s, distortion: true, pitch_shift: +100 cents'
      },
      system_event: 'string (trigger name)',
      fade_time: 'number (seconds)',
      pitch_shift_cents: 'number (detune effect)',
      distortion_amount: 'number (0.0-1.0)'
    },
    componentReload: {
      strategy: 'eager',
      debounceMs: 0 // Immediate audio response
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 25,
      notes: 'dk:music The drone is the heartbeat of the regime - its fade-in patterns tell you what kind of system event occurred. Frequency change = smooth (2s), reconnect = cautious (3s), maintenance exit = slow boot with pitch ramp (5s from -2 octaves), lockdown = harsh/urgent (0.5s distorted). Audio signature = system state communication without words.'
    }
  },

  'music.pitch_glide_retune': {
    id: 'music.pitch_glide_retune',
    name: 'Smooth Pitch Glide Retuning',
    description: 'Retune oscillators in-place with smooth glide instead of full restart',
    category: 'music',
    status: 'production',
    enabled: true, // dk:important Just implemented!
    dependencies: ['music.adaptive_synod'],
    dataSchema: {
      retune_method: '"restart" | "glide"',
      glide_time: 'number (seconds, default: 0.1s)',
      frequency_change_event: 'function callback'
    },
    componentReload: {
      strategy: 'eager',
      debounceMs: 0
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'dk:perf Avoids full music engine restart when frequency changes. Uses exponential ramp for smooth pitch glide (100ms). Better UX - no drone fade-in interruption unless intended (see music.drone_signatures for intentional reboots).'
    }
  },

  // ========== UI FEATURES ==========
  'ui.developer_dashboard': {
    id: 'ui.developer_dashboard',
    name: 'Developer Dashboard',
    description: 'Main spectator view with live simulation visualization',
    category: 'ui',
    status: 'production',
    enabled: true,
    dependencies: ['simulation.agents', 'simulation.infrastructure', 'simulation.risk_scoring'],
    componentReload: {
      strategy: 'eager',
      debounceMs: 100
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Default view - dashboard-first architecture'
    }
  },

  'ui.music_playgrounds': {
    id: 'ui.music_playgrounds',
    name: 'Music Playgrounds',
    description: 'Sandbox tools for testing Synod/Traditional/Pure scales',
    category: 'ui',
    status: 'production',
    enabled: true,
    componentReload: {
      strategy: 'manual' // Sandboxes are standalone
    },
    metadata: {
      addedDate: '2025-12-19',
      phase: 19-23,
      notes: 'Secondary tools - not main product'
    }
  },

  // ========== TUTORIAL FEATURES ==========
  'tutorial.music_playground_help': {
    id: 'tutorial.music_playground_help',
    name: 'Music Playground Tutorial',
    description: 'Toggleable tutorial panel explaining recording, note durations, playback',
    category: 'tutorial',
    status: 'production',
    enabled: true,
    componentReload: {
      strategy: 'manual' // User toggles help
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 23,
      notes: 'Covers: A/S/D keys (durations), Ctrl-Alt-R (record), Spacebar (stop), playback/clear'
    }
  },

  'tutorial.dashboard_inline': {
    id: 'tutorial.dashboard_inline',
    name: 'Dashboard Inline Tutorials',
    description: 'Contextual tooltips/tutorials integrated into dashboard UI',
    category: 'tutorial',
    status: 'beta',
    enabled: true, // dk:important Enable this for testing!
    dependencies: ['ui.developer_dashboard'],
    componentReload: {
      strategy: 'manual'
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'User request: tutorialize note duration controls (A/S/D keys) and recording (Ctrl-Alt-R, Spacebar)'
    }
  },

  'tutorial.first_time_experience': {
    id: 'tutorial.first_time_experience',
    name: 'First-Time User Experience',
    description: 'Guided tour for new users showing all features',
    category: 'tutorial',
    status: 'planned',
    enabled: false,
    componentReload: {
      strategy: 'manual'
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 25,
      notes: 'Interactive walkthrough: dashboard → playgrounds → controls → recording'
    }
  },

  'tutorial.collectibles': {
    id: 'tutorial.collectibles',
    name: 'Worldbuilding Collectibles',
    description: 'Side quest items that reveal truth of music mechanic through visual/auditory symbology',
    category: 'tutorial',
    status: 'planned',
    enabled: false,
    dependencies: ['simulation.agents'],
    dataSchema: {
      collectibles: [{
        id: 'string',
        type: '"frequency_crystal" | "tuning_fork" | "propaganda_poster" | "resistance_songbook"',
        visual_symbol: 'string (emoji/icon)',
        audio_symbol: 'number (Hz frequency or cents interval)',
        lore_text: 'string (reveals tuning political history)',
        unlock_condition: 'string (event or location trigger)'
      }]
    },
    componentReload: {
      strategy: 'lazy',
      debounceMs: 1000
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 25,
      notes: 'dk:note Worldbuilding side quest collectibles reveal the truth of the in-game music mechanic through visual and auditory symbology. Examples: Find Verdi tuning fork (A435), discover regime frequency crystal (A445), collect resistance songbooks with tritone emphasis, propaganda posters explaining "correct" pitch conditioning.'
    }
  },

  // ========== MULTIPLAYER FEATURES ==========
  'multiplayer.websocket_client': {
    id: 'multiplayer.websocket_client',
    name: 'WebSocket Client',
    description: 'Real-time connection to backend simulation',
    category: 'multiplayer',
    status: 'production',
    enabled: true,
    componentReload: {
      strategy: 'eager',
      debounceMs: 100
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'Auto-reconnect with exponential backoff, max 5 attempts'
    }
  },

  'multiplayer.role_selection': {
    id: 'multiplayer.role_selection',
    name: 'Role Selection',
    description: 'Choose Operator/Citizen/Resistance role before joining',
    category: 'multiplayer',
    status: 'planned',
    enabled: false,
    dependencies: ['multiplayer.websocket_client'],
    metadata: {
      addedDate: '2025-12-20',
      phase: 25,
      notes: 'Currently hardcoded to admin role'
    }
  },

  'multiplayer.websocket_telemetry': {
    id: 'multiplayer.websocket_telemetry',
    name: 'WebSocket Iteration Telemetry',
    description: 'Track backend tick sync, latency, missed iterations, connection uptime',
    category: 'multiplayer',
    status: 'production',
    enabled: true, // dk:important Just implemented!
    dependencies: ['multiplayer.websocket_client'],
    dataSchema: {
      telemetry: {
        messagesReceived: 'number (total WS messages)',
        lastTick: 'number (most recent simulation tick)',
        ticksPerSecond: 'number (measured Hz, target: 10.0)',
        missedTicks: 'number (gaps in tick sequence)',
        averageLatency: 'number (ms between backend timestamp and receive)',
        connectionUptime: 'number (seconds connected)'
      }
    },
    componentReload: {
      strategy: 'eager',
      debounceMs: 100
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'dk:telemetry Displayed in SpectatorView header - tracks how many backend iterations we are tuned into. Detects maintenance slowdown (ticksPerSecond drops from 10.0 to 2.5), network issues (missedTicks), and latency spikes. dk:perf Keeps last 20 tick history (2s window) and last 100 latency samples for averaging.'
    }
  },

  'multiplayer.websocket_debug_console': {
    id: 'multiplayer.websocket_debug_console',
    name: 'WebSocket Debug Console Logger',
    description: 'Console logging utility for debugging WebSocket messages',
    category: 'multiplayer',
    status: 'production',
    enabled: true, // dk:debug Implemented, disabled by default (enable via localStorage)
    dependencies: ['multiplayer.websocket_client'],
    dataSchema: {
      config: {
        enabled: 'boolean (master toggle)',
        logIncoming: 'boolean (log ⬇️ IN messages)',
        logOutgoing: 'boolean (log ⬆️ OUT messages)',
        logTelemetry: 'boolean (log 📊 TELEMETRY updates)',
        logRawMessages: 'boolean (show raw JSON strings)',
        maxMessageLength: 'number (truncate long messages)',
        colorize: 'boolean (use console colors)'
      }
    },
    componentReload: {
      strategy: 'manual' // User-controlled via console
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'dk:debug Enable in console: wsDebug.setEnabled(true). Access via window.wsDebug global. Shows incoming/outgoing messages with collapsible groups, connection events, telemetry updates. Stores config in localStorage. Use wsDebug.printStats() for summary. dk:perf Disable in production to avoid console spam.'
    }
  },

  // ========== ANALYTICS FEATURES ==========
  'analytics.telemetry': {
    id: 'analytics.telemetry',
    name: 'Telemetry System',
    description: 'Anonymized gameplay metrics for balance and performance tuning',
    category: 'analytics',
    status: 'planned',
    enabled: false, // dk:privacy Opt-in only
    componentReload: {
      strategy: 'lazy',
      debounceMs: 5000
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 26,
      notes: 'dk:privacy Never collects PII. See docs/TERMS_OF_SERVICE.md. See docs/TELEMETRY_ARCHITECTURE.md for design'
    }
  },

  'analytics.health_check': {
    id: 'analytics.health_check',
    name: 'Startup Health Check',
    description: 'Verify backend ticking, storage availability, cache validity before app load',
    category: 'analytics',
    status: 'production',
    enabled: true, // dk:important Just implemented!
    dependencies: [],
    componentReload: {
      strategy: 'eager',
      debounceMs: 0
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'dk:important Runs before React mounts. Checks /health endpoint, cache version. Exposes window.healthCheck.'
    }
  },

  'analytics.consent_manager': {
    id: 'analytics.consent_manager',
    name: 'Consent Management System',
    description: 'Terms of Service acceptance, telemetry consent, GDPR compliance',
    category: 'analytics',
    status: 'production',
    enabled: true, // dk:business Critical for legal compliance
    dependencies: ['analytics.health_check'],
    componentReload: {
      strategy: 'manual'
    },
    metadata: {
      addedDate: '2025-12-20',
      phase: 24,
      notes: 'dk:business SHA-256 hashing + salting for audit trail. See docs/TERMS_OF_SERVICE.md. window.consent API for testing.'
    }
  }
};

/**
 * Check if a feature is enabled
 */
export const isFeatureEnabled = (featureId: string): boolean => {
  const feature = FEATURE_FLAGS[featureId];
  if (!feature) {
    console.warn(`⚠️ Unknown feature flag: ${featureId}`);
    return false;
  }
  
  // Check dependencies
  if (feature.dependencies) {
    const allDepsEnabled = feature.dependencies.every(depId => 
      FEATURE_FLAGS[depId]?.enabled
    );
    if (!allDepsEnabled) {
      console.warn(`⚠️ Feature ${featureId} has disabled dependencies`);
      return false;
    }
  }
  
  return feature.enabled;
};

/**
 * Get features by category
 */
export const getFeaturesByCategory = (category: FeatureCategory): FeatureFlag[] => {
  return Object.values(FEATURE_FLAGS).filter(f => f.category === category);
};

/**
 * Get features by status
 */
export const getFeaturesByStatus = (status: FeatureStatus): FeatureFlag[] => {
  return Object.values(FEATURE_FLAGS).filter(f => f.status === status);
};

/**
 * Get component reload strategy for a feature
 */
export const getReloadStrategy = (featureId: string) => {
  const feature = FEATURE_FLAGS[featureId];
  return feature?.componentReload || { strategy: 'manual' };
};

// dk:important Export all features for debugging/admin UI
export const getAllFeatures = () => Object.values(FEATURE_FLAGS);

// dk:vision Future: Save user's feature flag overrides to localStorage
// dk:business Future: A/B test features by toggling for subsets of users
// dk:perf Debounce values prevent thrashing on high-frequency updates
