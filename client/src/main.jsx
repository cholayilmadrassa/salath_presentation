import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Capture PWA beforeinstallprompt event globally
window.deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
  window.dispatchEvent(new Event('pwa-install-available'));
});

// Register PWA Service Worker (Production Mode Only)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration failed:', err);
      });
    });
  } else {
    // Unregister development service worker to prevent Vite module MIME type errors
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
