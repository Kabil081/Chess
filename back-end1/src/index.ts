import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { GameManager } from './GameManager';
import { connectDB, registerUser } from './Database';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
dotenv.config();
const app = express();
import cors from 'cors';
app.use(cors(
  {
      origin:["https://chess-front-end.vercel.app"],
      methods:["POST","GET"],
      credentials:true
  }
));
const PORT = process.env.PORT || 3001;
app.use(express.json());
app.use('/api/auth', authRoutes);
connectDB();

// Create HTTP server
const server = createServer(app);

// Create WebSocket server attached to the HTTP server
const wss = new WebSocketServer({ server });

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

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
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
  console.log('Chess WebSocket server started on the same port as HTTP server');
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

app.get("/",(req,res)=>{
  res.send("Server running Successfully!");
})