# Portals Multiplayer Server

This is the WebSocket server component for the Portals multiplayer feature. It relays player position data to all connected clients.

## Development

To run the server locally for development:

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The server will run on port 8080 by default. You can change this by setting the `PORT` environment variable.

## Deployment to Railway

This server is designed to be deployed to Railway. To deploy:

1. Create a new Railway project
2. Link to this repository (or a repository containing this code)
3. Add the following environment variables:
   - `PORT=8080` (or your preferred port)
4. Deploy the project

After deployment, Railway will provide you with a URL for your project. Use this URL in your client configuration.

## Client Configuration

After deploying the server, update the client configuration in `src/config/multiplayer.ts` with your Railway deployment URL:

```typescript
// Example
if (process.env.NODE_ENV === 'production') {
  return 'wss://your-railway-app.railway.app';
}
```