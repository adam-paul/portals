# Portals

## Multiplayer Feature

This project now includes a multiplayer feature where users can see each other's rocket ships flying around in a shared game world.

### Architecture

The multiplayer implementation consists of two main parts:
1. Client-side code in the React application
2. A WebSocket server that relays player position data

### Deployment Instructions

#### Frontend (Vercel)

Deploy the frontend to Vercel as usual. No special configuration is needed for the frontend.

#### Backend (Railway)

The WebSocket server should be deployed on Railway:

1. Navigate to the `server` directory
2. Create a new Railway project
3. Link the repository to Railway
4. Set the environment variable `PORT=8080`
5. Deploy the project

After deployment, Railway will provide you with a URL for your project. Use this URL to update the WebSocket server URL in `src/config/multiplayer.ts`:

```typescript
export const getWebSocketServerUrl = (): string => {
  // If in production, use your Railway deployment URL
  if (process.env.NODE_ENV === 'production') {
    return 'wss://your-railway-app.railway.app';
  }
  
  // Default to local development
  return 'ws://localhost:8080';
};
```

### Local Development

To run the project locally:

1. Start the WebSocket server:
   ```bash
   cd server
   npm install
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm install
   npm run dev
   ```
