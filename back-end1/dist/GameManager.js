"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const Game_1 = require("./Game");
const Database_1 = require("./Database");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUsers = new Map();
        this.users = new Map();
    }
    addUser(socket) {
        this.setupSocketHandlers(socket);
        socket.send(JSON.stringify({
            type: "welcome",
            message: "Connected to Chess.io server. Please authenticate."
        }));
    }
    removeUser(socket) {
        if (socket.username) {
            this.users.delete(socket.username);
            this.pendingUsers.delete(socket.username);
        }
        this.cleanupGames();
    }
    setupSocketHandlers(socket) {
        socket.on("message", (data) => __awaiter(this, void 0, void 0, function* () {
            try {
                // Parse the incoming message
                const message = JSON.parse(data.toString());
                console.log("Received message type:", message.type);
                // Handle different message types
                switch (message.type) {
                    case "auth":
                        yield this.handleAuthentication(socket, message.username, message.password);
                        break;
                    case "init_game":
                        // Only allow authenticated users to initiate games
                        if (socket.isAuthenticated) {
                            this.handleInitGame(socket);
                        }
                        else {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to start a game"
                            }));
                        }
                        break;
                    case "move":
                        if (socket.isAuthenticated) {
                            this.handleMove(socket, message.move);
                        }
                        else {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to make moves"
                            }));
                        }
                        break;
                    case "get_history":
                        if (socket.isAuthenticated && socket.username) {
                            yield this.handleGetHistory(socket);
                        }
                        else {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to get game history"
                            }));
                        }
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
        }));
        socket.on("close", () => {
            console.log("Socket closed");
            this.removeUser(socket);
        });
        socket.on("error", (error) => {
            console.error("Socket error:", error);
            this.removeUser(socket);
        });
    }
    handleAuthentication(socket, username, password) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!username || !password) {
                socket.send(JSON.stringify({
                    type: "auth_response",
                    success: false,
                    message: "Username and password required"
                }));
                return;
            }
            const authResult = yield (0, Database_1.authenticateUser)(username, password);
            if (authResult.success) {
                if (this.users.has(username)) {
                    socket.send(JSON.stringify({
                        type: "auth_response",
                        success: false,
                        message: "User already logged in from another connection"
                    }));
                    return;
                }
                socket.username = username;
                socket.isAuthenticated = true;
                this.users.set(username, socket);
                socket.send(JSON.stringify({
                    type: "auth_response",
                    success: true,
                    message: "Authentication successful",
                    userData: authResult.userData
                }));
                console.log(`User ${username} authenticated successfully`);
            }
            else {
                socket.send(JSON.stringify({
                    type: "auth_response",
                    success: false,
                    message: authResult.message
                }));
            }
        });
    }
    handleInitGame(socket) {
        if (!socket.username) {
            console.log("Username missing on authenticated socket");
            return;
        }
        if (this.pendingUsers.has(socket.username)) {
            console.log(`User ${socket.username} already waiting for opponent`);
            return;
        }
        const existingGame = this.findGameBySocket(socket);
        if (existingGame && existingGame.isActive()) {
            console.log(`User ${socket.username} already in an active game`);
            socket.send(JSON.stringify({
                type: "error",
                message: "You are already in an active game"
            }));
            return;
        }
        let opponentUsername = null;
        let opponentSocket = null;
        for (const [username, pendingSocket] of this.pendingUsers.entries()) {
            if (username !== socket.username) {
                opponentUsername = username;
                opponentSocket = pendingSocket;
                break;
            }
        }
        if (opponentUsername && opponentSocket) {
            console.log(`Creating new game between ${socket.username} and ${opponentUsername}`);
            const newGame = new Game_1.Game(opponentSocket, socket);
            this.games.push(newGame);
            this.pendingUsers.delete(opponentUsername);
            socket.send(JSON.stringify({
                type: "game_found",
                opponent: opponentUsername
            }));
            opponentSocket.send(JSON.stringify({
                type: "game_found",
                opponent: socket.username
            }));
        }
        else {
            console.log(`User ${socket.username} waiting for opponent`);
            this.pendingUsers.set(socket.username, socket);
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
    handleGetHistory(socket) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!socket.username)
                return;
            const historyResult = yield (0, Database_1.getPlayerGameHistory)(socket.username);
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
        });
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
        return this.pendingUsers.size;
    }
    getConnectedUsers() {
        return this.users.size;
    }
}
exports.GameManager = GameManager;
