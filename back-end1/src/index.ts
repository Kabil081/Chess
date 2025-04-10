// index.ts
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { connectDB, registerUser } from './Database';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
connectDB();
const wss = new WebSocketServer({ port: 8080 });
const gameManager = new GameManager();
const initializeAdminUser = async () => {
  try {
    const result = await registerUser('admin', 'admin123');
    if (result.success) {
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
};

// Initialize the server
const initServer = async () => {
  await initializeAdminUser();
  
  // Set up WebSocket server
  wss.on('connection', (ws) => {
    console.log('New client connected');
    gameManager.addUser(ws);
    
    ws.on('close', () => {
      console.log('Client disconnected');
      gameManager.removeUser(ws);
    });
  });
  
  console.log('Chess WebSocket server started on port 8080');
  setInterval(() => {
    const activeGames = gameManager.getActiveGames();
    const waitingUsers = gameManager.getWaitingUsers();
    const connectedUsers = gameManager.getConnectedUsers();
    console.log(`Server status: ${connectedUsers} users connected, ${activeGames} active games, ${waitingUsers} users waiting`);
  }, 30000);
};

initServer().catch(error => {
  console.error('Server initialization failed:', error);
  process.exit(1);
});