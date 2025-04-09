import WebSocket from "ws";
import { Chess } from "chess.js";

export class Game {
    public player1: WebSocket;
    public player2: WebSocket;
    private board: Chess;
    private moves: string[];
    private startTime: Date;
    private player1Connected: boolean;
    private player2Connected: boolean;
    constructor(player1: WebSocket, player2: WebSocket) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new Chess();
        this.moves = [];
        this.startTime = new Date();
        this.player1Connected = true;
        this.player2Connected = true;
        this.player1.send(JSON.stringify({
            type: "init_game",
            payload: {
                color: "white"
            }
        }));
        this.player2.send(JSON.stringify({
            type: "init_game",
            payload: {
                color: "black"
            }
        }));
        this.setupDisconnectHandlers();
    }
    private setupDisconnectHandlers() {
        const handleClose = (player: 'player1' | 'player2') => {
            if (player === 'player1') {
                this.player1Connected = false;
                if (this.player2Connected) {
                    this.player2.send(JSON.stringify({
                        type: "game_over",
                        payload: {
                            winner: "Black (opponent disconnected)"
                        }
                    }));
                }
            } else {
                this.player2Connected = false;
                if (this.player1Connected) {
                    this.player1.send(JSON.stringify({
                        type: "game_over",
                        payload: {
                            winner: "White (opponent disconnected)"
                        }
                    }));
                }
            }
        };
        this.player1.on('close', () => handleClose('player1'));
        this.player2.on('close', () => handleClose('player2'));
    }
    makeMove(socket: WebSocket, move: {
        from: string;
        to: string;
    }) {

        if (this.board.turn() === "w" && socket !== this.player1) {
            console.log("Not white's turn or wrong player");
            return;
        }
        if (this.board.turn() === "b" && socket !== this.player2) {
            console.log("Not black's turn or wrong player");
            return;
        }


        try {
            const result = this.board.move({
                from: move.from,
                to: move.to,
                promotion: 'q'
            });

            if (!result) {
                console.log("Invalid move");
                return;
            }


            this.moves.push(`${move.from}-${move.to}`);
            

            if (this.board.isGameOver()) {
                let winner = "Draw";
                if (this.board.isCheckmate()) {
                    
                    winner = this.board.turn() === "w" ? "Black" : "White";
                }

                this.player1.send(JSON.stringify({
                    type: "game_over",
                    payload: {
                        winner: winner
                    }
                }));
                this.player2.send(JSON.stringify({
                    type: "game_over",
                    payload: {
                        winner: winner
                    }
                }));   
                return;
            }
            const otherPlayer = socket === this.player1 ? this.player2 : this.player1;
            otherPlayer.send(JSON.stringify({
                type: "move",
                payload: move
            }));
            
            console.log(`Move sent to opponent: ${move.from} to ${move.to}`);
        } catch (e) {
            console.error("Error making move:", e);
        }
    }

    isPlayerInGame(socket: WebSocket): boolean {
        return socket === this.player1 || socket === this.player2;
    }

    isActive(): boolean {
        return this.player1Connected && this.player2Connected && !this.board.isGameOver();
    }
}