import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';

const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();

// Set up connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Add the user to the game manager
  gameManager.addUser(ws);
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('Client disconnected');
    gameManager.removeUser(ws);
  });
});
console.log('Chess WebSocket server started on port 8080');
import { connectDB } from './Database'

connectDB();

setInterval(() => {
  const activeGames = gameManager.getActiveGames();
  const waitingUsers = gameManager.getWaitingUsers();
  const connectedUsers = gameManager.getConnectedUsers();
  
  console.log(`Server status: ${connectedUsers} users connected, ${activeGames} active games, ${waitingUsers} users waiting`);
}, 30000);