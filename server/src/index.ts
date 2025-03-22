import WebSocket, { WebSocketServer } from 'ws';
import { randomUUID } from 'crypto';
import { PlayerData } from './types';

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: Number(PORT) });
const players: Map<string, PlayerData> = new Map();

wss.on('connection', (ws: WebSocket) => {
  const playerId = randomUUID();
  console.log(`Player connected: ${playerId}`);

  ws.on('message', (data: string) => {
    try {
      const playerData: PlayerData = JSON.parse(data);
      playerData.id = playerId;
      players.set(playerId, playerData);

      // Broadcast to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify([...players.values()]));
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    players.delete(playerId);
    console.log(`Player disconnected: ${playerId}`);
    
    // Broadcast updated player list
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify([...players.values()]));
      }
    });
  });
});

console.log(`WebSocket server running on port ${PORT}`);