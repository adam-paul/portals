// Multiplayer configuration
export const WEBSOCKET_SERVER_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';

// Update this in production to your actual deployed server URL
export const getWebSocketServerUrl = (): string => {
  // Default to the environment variable or local development
  return WEBSOCKET_SERVER_URL;
};
