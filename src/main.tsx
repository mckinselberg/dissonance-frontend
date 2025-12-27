import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { wsDebug } from './lib/websocketDebug'
import { runHealthCheck } from './lib/healthCheck'

// dk:important Run health check before mounting app
async function initializeApp() {
  console.log('🚀 Initializing SignalNet...');
  
  // Run health check
  const healthCheck = await runHealthCheck();
  
  // Enable WebSocket debug logging in development
  if (import.meta.env.DEV) {
    wsDebug.setEnabled(true);
    console.log('🔌 WebSocket debug logging ENABLED. Disable with: wsDebug.setEnabled(false)');
  }
  
  // Warn if backend not healthy
  if (!healthCheck.backend.reachable) {
    console.error('❌ Backend not reachable! Start backend with:');
    console.error('   wsl bash -c "cd /mnt/d/dan/code/dissonance/backend && source venv/bin/activate && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8001"');
  } else if (!healthCheck.backend.ticking) {
    console.warn('⚠️ Backend reachable but not ticking. Check simulation worker.');
  } else {
    console.log(`✅ Backend healthy (${healthCheck.backend.tickRate} Hz, ${healthCheck.backend.latency}ms latency)`);
  }
  
  // Mount React app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Start app
initializeApp().catch(error => {
  console.error('💥 Failed to initialize app:', error);
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; font-family: monospace; background: #ff4444; color: white;">
      <h2>❌ Initialization Failed</h2>
      <p>${error.message}</p>
      <p style="font-size: 12px; margin-top: 10px;">Check console for details.</p>
    </div>
  `;
});
