"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new chess_js_1.Chess();
        this.moves = [];
        this.startTime = new Date();
        this.player1Connected = true;
        this.player2Connected = true;
        // Initialize the game by sending color assignments to players
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
        // Set up disconnect handlers
        this.setupDisconnectHandlers();
    }
    setupDisconnectHandlers() {
        const handleClose = (player) => {
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
            }
            else {
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
        // Handle player disconnections
        this.player1.on('close', () => handleClose('player1'));
        this.player2.on('close', () => handleClose('player2'));
    }
    makeMove(socket, move) {
        // Verify it's the correct player's turn
        if (this.board.turn() === "w" && socket !== this.player1) {
            console.log("Not white's turn or wrong player");
            return;
        }
        if (this.board.turn() === "b" && socket !== this.player2) {
            console.log("Not black's turn or wrong player");
            return;
        }
        // Try to make the move
        try {
            const result = this.board.move({
                from: move.from,
                to: move.to,
                promotion: 'q' // Auto-promote to queen for simplicity
            });
            if (!result) {
                console.log("Invalid move");
                return;
            }
            // Record the move
            this.moves.push(`${move.from}-${move.to}`);
            // Check if game is over after the move
            if (this.board.isGameOver()) {
                let winner = "Draw";
                if (this.board.isCheckmate()) {
                    // The player who just moved has checkmated the opponent
                    winner = this.board.turn() === "w" ? "Black" : "White";
                }
                // Send game over message to both players
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
            // Notify the other player about the move
            const otherPlayer = socket === this.player1 ? this.player2 : this.player1;
            otherPlayer.send(JSON.stringify({
                type: "move",
                payload: move
            }));
            console.log(`Move sent to opponent: ${move.from} to ${move.to}`);
        }
        catch (e) {
            console.error("Error making move:", e);
        }
    }
    isPlayerInGame(socket) {
        return socket === this.player1 || socket === this.player2;
    }
    isActive() {
        return this.player1Connected && this.player2Connected && !this.board.isGameOver();
    }
}
exports.Game = Game;
