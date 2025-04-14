
import WebSocket from "ws";
import { Game, AuthenticatedSocket } from "./Game";
import { authenticateUser, getPlayerGameHistory } from "./Database";

export class GameManager {
    private games: Game[] = [];
    private pendingUsers: Map<string, AuthenticatedSocket> = new Map();
    private users: Map<string, AuthenticatedSocket> = new Map();

    constructor() {}

    addUser(socket: AuthenticatedSocket): void {
        this.setupSocketHandlers(socket);
        socket.send(JSON.stringify({
            type: "welcome",
            message: "Connected to Chess.io server. Please authenticate."
        }));
    }
    removeUser(socket: AuthenticatedSocket): void {
        if (socket.username) {
            this.users.delete(socket.username);
            this.pendingUsers.delete(socket.username);
        }
        this.cleanupGames();
    }

    private setupSocketHandlers(socket: AuthenticatedSocket): void {
        socket.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log("Received message type:", message.type);
                
                switch (message.type) {
                    case "auth":
                        await this.handleAuthentication(socket, message.username, message.password);
                        break;
                        
                    case "init_game":
                        if (socket.isAuthenticated){
                            this.handleInitGame(socket);
                        } else {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to start a game"
                            }));
                        }
                        break;
                        
                    case "move":
                       
                        if (socket.isAuthenticated) {
                            this.handleMove(socket, message.move);
                        } else {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to make moves"
                            }));
                        }
                        break;
                        
                    case "get_history":
                        if (socket.isAuthenticated && socket.username) {
                            await this.handleGetHistory(socket);
                        } else {
                            socket.send(JSON.stringify({
                                type: "error",
                                message: "Authentication required to get game history"
                            }));
                        }
                        break;
                        
                    default:
                        console.log("Unknown message type:", message.type);
                }
            } catch (error) {
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
    
    private async handleAuthentication(socket: AuthenticatedSocket, username: string, password: string): Promise<void> {
        if (!username || !password) {
            socket.send(JSON.stringify({
                type: "auth_response",
                success: false,
                message: "Username and password required"
            }));
            return;
        }
        
        const authResult = await authenticateUser(username, password);
        
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
        } else {
            socket.send(JSON.stringify({
                type: "auth_response",
                success: false,
                message: authResult.message
            }));
        }
    }

    private handleInitGame(socket: AuthenticatedSocket): void {
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
        let opponentUsername: string | null = null;
        let opponentSocket: AuthenticatedSocket | null = null;
        
        for (const [username, pendingSocket] of this.pendingUsers.entries()) {
            if (username !== socket.username) {
                opponentUsername = username;
                opponentSocket = pendingSocket;
                break;
            }
        }
        
        if (opponentUsername && opponentSocket) {
            console.log(`Creating new game between ${socket.username} and ${opponentUsername}`);
            const newGame = new Game(opponentSocket, socket);
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
        } else {
        
            console.log(`User ${socket.username} waiting for opponent`);
            this.pendingUsers.set(socket.username, socket);
            
            socket.send(JSON.stringify({
                type: "waiting_for_opponent"
            }));
        }
    }

    private handleMove(socket: AuthenticatedSocket, move: { from: string, to: string }): void {
        if (!move || !move.from || !move.to) {
            console.error("Invalid move format");
            return;
        }
    
        const game = this.findGameBySocket(socket);
        
        if (game) {
            console.log(`Processing move from ${move.from} to ${move.to}`);
            game.makeMove(socket, move);
        } else {
            console.error("Move received from user not in a game");
            socket.send(JSON.stringify({
                type: "error",
                message: "You are not currently in a game"
            }));
        }
    }
    
    private async handleGetHistory(socket: AuthenticatedSocket): Promise<void> {
        if (!socket.username) return;
        
        const historyResult = await getPlayerGameHistory(socket.username);
        
        if (historyResult.success) {
            socket.send(JSON.stringify({
                type: "game_history",
                games: historyResult.games
            }));
        } else {
            socket.send(JSON.stringify({
                type: "error",
                message: "Failed to retrieve game history"
            }));
        }
    }

    private findGameBySocket(socket: WebSocket): Game | null {
        return this.games.find(game => game.isPlayerInGame(socket)) || null;
    }

    private cleanupGames(): void {
        this.games = this.games.filter(game => game.isActive());
    }
    
    getActiveGames(): number {
        return this.games.filter(game => game.isActive()).length;
    }
    
    getWaitingUsers(): number {
        return this.pendingUsers.size;
    }
    
    getConnectedUsers(): number {
        return this.users.size;
    }
}