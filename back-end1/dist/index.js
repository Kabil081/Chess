"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
// Create WebSocket server on port 8080
const wss = new ws_1.WebSocketServer({ port: 8080 });
const gameManager = new GameManager_1.GameManager();
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
// Log server start
console.log('Chess WebSocket server started on port 8080');
// Health check interval (optional)
setInterval(() => {
    const activeGames = gameManager.getActiveGames();
    const waitingUsers = gameManager.getWaitingUsers();
    const connectedUsers = gameManager.getConnectedUsers();
    console.log(`Server status: ${connectedUsers} users connected, ${activeGames} active games, ${waitingUsers} users waiting`);
}, 30000);
