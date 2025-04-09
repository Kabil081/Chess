"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = new Set();
    }
    addUser(socket) {
        this.users.add(socket);
        this.setupSocketHandlers(socket);
        // Send a welcome message
        socket.send('Connected to Chess.io server');
    }
    removeUser(socket) {
        this.users.delete(socket);
        // If this was the pending user, clear that too
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
        // Remove any inactive games
        this.cleanupGames();
    }
    setupSocketHandlers(socket) {
        socket.on("message", (data) => {
            try {
                // Parse the incoming message
                const message = JSON.parse(data.toString());
                console.log("Received message:", message);
                // Handle different message types
                switch (message.type) {
                    case "init_game":
                        this.handleInitGame(socket);
                        break;
                    case "move":
                        this.handleMove(socket, message.move);
                        break;
                    default:
                        console.log("Unknown message type:", message.type);
                }
            }
            catch (error) {
                console.error("Error processing message:", error);
            }
        });
        socket.on("close", () => {
            console.log("Socket closed");
            this.removeUser(socket);
        });
        socket.on("error", (error) => {
            console.error("Socket error:", error);
            this.removeUser(socket);
        });
    }
    handleInitGame(socket) {
        // If this user is already in a pending state waiting for an opponent, ignore
        if (this.pendingUser === socket) {
            console.log("User already waiting for opponent");
            return;
        }
        // Check if user is already in an active game
        const existingGame = this.findGameBySocket(socket);
        if (existingGame && existingGame.isActive()) {
            console.log("User already in an active game");
            return;
        }
        // If there's another user waiting, create a new game
        if (this.pendingUser && this.pendingUser !== socket) {
            console.log("Creating new game with waiting opponent");
            const newGame = new Game_1.Game(this.pendingUser, socket);
            this.games.push(newGame);
            this.pendingUser = null;
        }
        else {
            // Otherwise, mark this user as waiting
            console.log("User waiting for opponent");
            this.pendingUser = socket;
        }
    }
    handleMove(socket, move) {
        if (!move || !move.from || !move.to) {
            console.error("Invalid move format");
            return;
        }
        // Find the game this user is in
        const game = this.findGameBySocket(socket);
        if (game) {
            console.log(`Processing move from ${move.from} to ${move.to}`);
            game.makeMove(socket, move);
        }
        else {
            console.error("Move received from user not in a game");
        }
    }
    findGameBySocket(socket) {
        return this.games.find(game => game.isPlayerInGame(socket)) || null;
    }
    cleanupGames() {
        // Remove inactive games
        this.games = this.games.filter(game => game.isActive());
    }
    getActiveGames() {
        return this.games.filter(game => game.isActive()).length;
    }
    getWaitingUsers() {
        return this.pendingUser ? 1 : 0;
    }
    getConnectedUsers() {
        return this.users.size;
    }
}
exports.GameManager = GameManager;
