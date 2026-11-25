import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from './axios';

window.Pusher = Pusher;

let echo;
let currentToken;

export function getRealtimeClient(token) {
  if (!token) return null;
  if (echo && currentToken === token) return echo;

  echo?.disconnect();
  currentToken = token;
  const scheme = import.meta.env.VITE_REVERB_SCHEME || 'http';
  const port = Number(import.meta.env.VITE_REVERB_PORT || 8080);

  echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'paruhkita-local-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
    wsPort: port,
    wssPort: port,
    forceTLS: scheme === 'https',
    enabledTransports: scheme === 'https' ? ['wss'] : ['ws'],
    disableStats: true,
    authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  return echo;
}

export function disconnectRealtime() {
  if (echo) {
    echo.disconnect();
    echo = null;
    currentToken = null;
  }
}
