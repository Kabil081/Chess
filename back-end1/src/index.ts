import express from 'express';
import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import { connectDB, registerUser } from './Database';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
dotenv.config();
const app = express();
import cors from 'cors';
app.use(cors(
  {
      origin:["https://chess-front-end.vercel.app/"],
      methods:["POST","GET"],
      credentials:true
  }
));
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use('/api/auth', authRoutes);
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
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

const initServer = async () => {
  await initializeAdminUser();
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
