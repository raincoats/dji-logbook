import React from 'react';
import ReactDOM from 'react-dom/client';
import { attachConsole } from '@tauri-apps/plugin-log';
import App from './App';
import './index.css';

async function startApp() {
  try {
    await attachConsole();
  } catch (error) {
    // If the log plugin isn't available (e.g., web preview), fall back to console.
    console.warn('Log plugin unavailable:', error);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

startApp();
