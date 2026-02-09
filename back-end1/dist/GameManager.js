"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
const Database_1 = require("./Database");
const jwt_1 = require("./utils/jwt");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUsers = new Map(); // Key: email
        this.users = new Map(); // Key: email
    }
    addUser(socket, token) {
        // Always setup handlers first
        this.setupSocketHandlers(socket);
        // Try to authenticate with token from query parameter
        if (token) {
            this.authenticateWithToken(socket, token);
        }
        else {
            // Wait for AUTH message
            socket.send(JSON.stringify({
                type: "welcome",
                message: "Connected to Chess.io server. Please authenticate with token."
            }));
        }
    }
    removeUser(socket) {
        if (socket.email) {
            this.users.delete(socket.email);
            this.pendingUsers.delete(socket.email);
        }
        this.cleanupGames();
    }
    authenticateWithToken(socket, token) {
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            socket.send(JSON.stringify({
                type: "auth_response",
                success: false,
                message: "Invalid or expired token"
            }));
            // Don't close socket - let user try again
            return;
        }
        // Check if user already connected - disconnect old connection
        if (this.users.has(decoded.email)) {
            const oldSocket = this.users.get(decoded.email);
            if (oldSocket && oldSocket !== socket) {
                oldSocket.send(JSON.stringify({
                    type: "error",
                    message: "You logged in from another device"
                }));
                oldSocket.close();
                this.removeUser(oldSocket);
            }
        }
        // Authenticate socket
        socket.isAuthenticated = true;
        socket.userId = decoded.userId;
        socket.email = decoded.email;
        socket.username = decoded.username;
        // Store in users map
        this.users.set(decoded.email, socket);
        socket.send(JSON.stringify({
            type: "auth_response",
            success: true,
            message: "Authentication successful"
        }));
        console.log(`User ${decoded.email} authenticated successfully via WebSocket`);
    }
    setupSocketHandlers(socket) {
        socket.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log("Received message type:", message.type);
                switch (message.type) {
                    case "AUTH":
                        // Handle token authentication via message
                        if (!message.token) {
                            socket.send(JSON.stringify({
                                type: "auth_response",
                                success: false,
                                message: "Token required"
                            }));
                            return;
                        }
                        this.authenticateWithToken(socket, message.token);
                        break;
                    case "init_game":
                        if (!socket.isAuthenticated || !socket.email) {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to start a game"
                            }));
                            return;
                        }
                        this.handleInitGame(socket);
                        break;
                    case "move":
                        if (!socket.isAuthenticated || !socket.email) {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to make moves"
                            }));
                            return;
                        }
                        this.handleMove(socket, message.move);
                        break;
                    case "get_history":
                        if (!socket.isAuthenticated || !socket.email) {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to get game history"
                            }));
                            return;
                        }
                        await this.handleGetHistory(socket);
                        break;
                    default:
                        console.log("Unknown message type:", message.type);
                }
            }
            catch (error) {
                console.error("Error processing message:", error);
                socket.send(JSON.stringify({
                    type: "error",
                    message: "Error processing your request"
                }));
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
        if (!socket.email) {
            console.log("Email missing on authenticated socket");
            socket.send(JSON.stringify({
                type: "error",
                message: "Authentication error: email missing"
            }));
            return;
        }
        if (this.pendingUsers.has(socket.email)) {
            console.log(`User ${socket.email} already waiting for opponent`);
            return;
        }
        const existingGame = this.findGameBySocket(socket);
        if (existingGame && existingGame.isActive()) {
            console.log(`User ${socket.email} already in an active game`);
            socket.send(JSON.stringify({
                type: "error",
                message: "You are already in an active game"
            }));
            return;
        }
        let opponentEmail = null;
        let opponentSocket = null;
        for (const [email, pendingSocket] of this.pendingUsers.entries()) {
            if (email !== socket.email) {
                opponentEmail = email;
                opponentSocket = pendingSocket;
                break;
            }
        }
        if (opponentEmail && opponentSocket) {
            console.log(`Creating new game between ${socket.email} and ${opponentEmail}`);
            const newGame = new Game_1.Game(opponentSocket, socket);
            this.games.push(newGame);
            this.pendingUsers.delete(opponentEmail);
            socket.send(JSON.stringify({
                type: "game_found",
                opponent: opponentEmail
            }));
            opponentSocket.send(JSON.stringify({
                type: "game_found",
                opponent: socket.email
            }));
        }
        else {
            console.log(`User ${socket.email} waiting for opponent`);
            this.pendingUsers.set(socket.email, socket);
            socket.send(JSON.stringify({
                type: "waiting_for_opponent"
            }));
        }
    }
    handleMove(socket, move) {
        if (!move || !move.from || !move.to) {
            console.error("Invalid move format");
            return;
        }
        const game = this.findGameBySocket(socket);
        if (game) {
            console.log(`Processing move from ${move.from} to ${move.to}`);
            game.makeMove(socket, move);
        }
        else {
            console.error("Move received from user not in a game");
            socket.send(JSON.stringify({
                type: "error",
                message: "You are not currently in a game"
            }));
        }
    }
    async handleGetHistory(socket) {
        if (!socket.email) {
            socket.send(JSON.stringify({
                type: "error",
                message: "Email missing"
            }));
            return;
        }
        const historyResult = await (0, Database_1.getPlayerGameHistory)(socket.email);
        if (historyResult.success) {
            socket.send(JSON.stringify({
                type: "game_history",
                games: historyResult.games
            }));
        }
        else {
            socket.send(JSON.stringify({
                type: "error",
                message: "Failed to retrieve game history"
            }));
        }
    }
    findGameBySocket(socket) {
        return this.games.find(game => game.isPlayerInGame(socket)) || null;
    }
    cleanupGames() {
        this.games = this.games.filter(game => game.isActive());
    }
    getActiveGames() {
        return this.games.filter(game => game.isActive()).length;
    }
    getWaitingUsers() {
        return this.pendingUsers.size;
    }
    getConnectedUsers() {
        return this.users.size;
    }
}
exports.GameManager = GameManager;
