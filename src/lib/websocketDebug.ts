/**
 * WebSocket Debug Utilities
 * 
 * Utilities for debugging WebSocket messages in the console.
 * Enable/disable with localStorage or environment variable.
 * 
 * dk:debug Use these to troubleshoot WebSocket communication issues
 * dk:perf Disable in production to avoid console spam
 */

export interface WebSocketDebugConfig {
  enabled: boolean;
  logIncoming: boolean;
  logOutgoing: boolean;
  logTelemetry: boolean;
  logRawMessages: boolean;
  maxMessageLength: number; // Truncate long messages
  colorize: boolean;
}

const DEFAULT_CONFIG: WebSocketDebugConfig = {
  enabled: false,
  logIncoming: true,
  logOutgoing: true,
  logTelemetry: false, // dk:perf Telemetry is high frequency, disabled by default
  logRawMessages: false, // Show raw JSON strings
  maxMessageLength: 500,
  colorize: true
};

class WebSocketDebugger {
  private config: WebSocketDebugConfig;
  private messageCount = 0;
  private startTime = Date.now();

  constructor() {
    // Check localStorage for config
    const storedConfig = localStorage.getItem('ws_debug_config');
    if (storedConfig) {
      try {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
      } catch {
        this.config = { ...DEFAULT_CONFIG };
      }
    } else {
      this.config = { ...DEFAULT_CONFIG };
    }

    // Check environment variable for quick enable
    if (import.meta.env.VITE_WS_DEBUG === 'true') {
      this.config.enabled = true;
    }
  }

  /**
   * Enable/disable WebSocket debugging
   */
  setEnabled(enabled: boolean) {
    this.config.enabled = enabled;
    this.saveConfig();
    console.log(`🔌 WebSocket debugging ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Update debug configuration
   */
  configure(updates: Partial<WebSocketDebugConfig>) {
    this.config = { ...this.config, ...updates };
    this.saveConfig();
  }

  /**
   * Get current configuration
   */
  getConfig(): WebSocketDebugConfig {
    return { ...this.config };
  }

  private saveConfig() {
    localStorage.setItem('ws_debug_config', JSON.stringify(this.config));
  }

  /**
   * Log incoming WebSocket message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logIncoming(message: any, raw?: string) {
    if (!this.config.enabled || !this.config.logIncoming) return;

    this.messageCount++;
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);

    const prefix = this.config.colorize
      ? '%c⬇️ IN'
      : '⬇️ IN';
    const style = 'color: #00ff00; font-weight: bold';

    console.groupCollapsed(
      this.config.colorize ? prefix : prefix,
      this.config.colorize ? style : '',
      `#${this.messageCount}`,
      `[${elapsed}s]`,
      message.type || 'UNKNOWN'
    );

    console.log('Parsed:', this.truncateMessage(message));

    if (this.config.logRawMessages && raw) {
      console.log('Raw:', this.truncateMessage(raw));
    }

    if (message.type === 'STATE_UPDATE' && message.state) {
      console.log('State:', {
        tick: message.state.tick,
        risk_score: message.state.risk_score,
        agents: message.state.agents?.length || 0,
        nodes: message.state.nodes?.length || 0,
        events: message.state.events?.length || 0
      });
    }

    console.groupEnd();
  }

  /**
   * Log outgoing WebSocket message
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logOutgoing(message: any, raw?: string) {
    if (!this.config.enabled || !this.config.logOutgoing) return;

    const prefix = this.config.colorize
      ? '%c⬆️ OUT'
      : '⬆️ OUT';
    const style = 'color: #ff8800; font-weight: bold';

    console.groupCollapsed(
      this.config.colorize ? prefix : prefix,
      this.config.colorize ? style : '',
      message.type || 'UNKNOWN'
    );

    console.log('Parsed:', this.truncateMessage(message));

    if (this.config.logRawMessages && raw) {
      console.log('Raw:', this.truncateMessage(raw));
    }

    console.groupEnd();
  }

  /**
   * Log WebSocket telemetry update
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logTelemetry(telemetry: any) {
    if (!this.config.enabled || !this.config.logTelemetry) return;

    const prefix = this.config.colorize
      ? '%c📊 TELEMETRY'
      : '📊 TELEMETRY';
    const style = 'color: #00aaff; font-weight: bold';

    console.log(
      this.config.colorize ? prefix : prefix,
      this.config.colorize ? style : '',
      telemetry
    );
  }

  /**
   * Log WebSocket connection event
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logConnection(event: 'open' | 'close' | 'error', details?: any) {
    if (!this.config.enabled) return;

    const icons = {
      open: '✅',
      close: '❌',
      error: '⚠️'
    };

    const colors = {
      open: '#00ff00',
      close: '#ff4444',
      error: '#ff8800'
    };

    const prefix = this.config.colorize
      ? `%c${icons[event]} WS ${event.toUpperCase()}`
      : `${icons[event]} WS ${event.toUpperCase()}`;
    const style = `color: ${colors[event]}; font-weight: bold`;

    if (details) {
      console.log(
        this.config.colorize ? prefix : prefix,
        this.config.colorize ? style : '',
        details
      );
    } else {
      console.log(
        this.config.colorize ? prefix : prefix,
        this.config.colorize ? style : ''
      );
    }

    if (event === 'open') {
      this.messageCount = 0;
      this.startTime = Date.now();
    }
  }

  /**
   * Print stats summary
   */
  printStats() {
    if (!this.config.enabled) {
      console.log('🔌 WebSocket debugging is DISABLED');
      return;
    }

    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const rate = (this.messageCount / parseFloat(elapsed)).toFixed(1);

    console.group('📊 WebSocket Debug Stats');
    console.log(`Messages received: ${this.messageCount}`);
    console.log(`Connection uptime: ${elapsed}s`);
    console.log(`Message rate: ${rate} msg/s`);
    console.log('Config:', this.config);
    console.groupEnd();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private truncateMessage(message: any): any {
    if (typeof message === 'string') {
      return message.length > this.config.maxMessageLength
        ? message.substring(0, this.config.maxMessageLength) + '...'
        : message;
    }

    // Don't truncate objects, just return them
    return message;
  }
}

// Singleton instance
export const wsDebug = new WebSocketDebugger();

// dk:debug Expose to window for easy console access
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).wsDebug = wsDebug;
}

/**
 * Convenience functions for quick enable/disable
 */
export const enableWebSocketDebug = () => wsDebug.setEnabled(true);
export const disableWebSocketDebug = () => wsDebug.setEnabled(false);
export const wsDebugStats = () => wsDebug.printStats();

/**
 * Quick enable patterns
 * 
 * Usage in console:
 * 
 * // Enable all logging
 * wsDebug.setEnabled(true)
 * 
 * // Show raw JSON
 * wsDebug.configure({ logRawMessages: true })
 * 
 * // Enable telemetry logging (high frequency!)
 * wsDebug.configure({ logTelemetry: true })
 * 
 * // Disable colorization (for screenshots/logs)
 * wsDebug.configure({ colorize: false })
 * 
 * // Print stats
 * wsDebug.printStats()
 * 
 * dk:reminder Add to README or docs/DEBUGGING.md
 */
