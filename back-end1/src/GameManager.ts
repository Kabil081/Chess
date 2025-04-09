import WebSocket from "ws";
import { Game } from "./Game";

export class GameManager {
    private games: Game[] = [];
    private pendingUser: WebSocket | null = null;
    private users: Set<WebSocket> = new Set();

    constructor() {}

    addUser(socket: WebSocket): void {
        this.users.add(socket);
        this.setupSocketHandlers(socket);
        
        // Send a welcome message
        socket.send('Connected to Chess.io server');
    }

    removeUser(socket: WebSocket): void {
        this.users.delete(socket);
        
        // If this was the pending user, clear that too
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
        
        // Remove any inactive games
        this.cleanupGames();
    }

    private setupSocketHandlers(socket: WebSocket): void {
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
            } catch (error) {
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

    private handleInitGame(socket: WebSocket): void {
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
            const newGame = new Game(this.pendingUser, socket);
            this.games.push(newGame);
            this.pendingUser = null;
        } else {
            // Otherwise, mark this user as waiting
            console.log("User waiting for opponent");
            this.pendingUser = socket;
        }
    }

    private handleMove(socket: WebSocket, move: { from: string, to: string }): void {
        if (!move || !move.from || !move.to) {
            console.error("Invalid move format");
            return;
        }
        
        // Find the game this user is in
        const game = this.findGameBySocket(socket);
        
        if (game) {
            console.log(`Processing move from ${move.from} to ${move.to}`);
            game.makeMove(socket, move);
        } else {
            console.error("Move received from user not in a game");
        }
    }

    private findGameBySocket(socket: WebSocket): Game | null {
        return this.games.find(game => game.isPlayerInGame(socket)) || null;
    }

    private cleanupGames(): void {
        // Remove inactive games
        this.games = this.games.filter(game => game.isActive());
    }
    
    getActiveGames(): number {
        return this.games.filter(game => game.isActive()).length;
    }
    
    getWaitingUsers(): number {
        return this.pendingUser ? 1 : 0;
    }
    
    getConnectedUsers(): number {
        return this.users.size;
    }
}