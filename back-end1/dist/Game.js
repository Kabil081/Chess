"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
const chess_js_1 = require("chess.js");
const Database_1 = require("./Database");
class Game {
    constructor(player1, player2) {
        this.player1 = player1;
        this.player2 = player2;
        this.board = new chess_js_1.Chess();
        this.moves = [];
        this.startTime = new Date();
        this.player1Connected = true;
        this.player2Connected = true;
        this.initGameRecord();
        this.player1.send(JSON.stringify({
            type: "init_game",
            payload: {
                color: "white",
                opponent: player2.email || player2.username
            }
        }));
        this.player2.send(JSON.stringify({
            type: "init_game",
            payload: {
                color: "black",
                opponent: player1.email || player1.username
            }
        }));
        this.setupDisconnectHandlers();
    }
    async initGameRecord() {
        if (!this.player1.email || !this.player2.email) {
            console.error("Cannot initialize game record: Missing player email");
            return;
        }
        const result = await (0, Database_1.saveGameRecord)({
            whitePlayer: this.player1.email,
            blackPlayer: this.player2.email,
            moves: [],
            result: 'ongoing',
            startTime: this.startTime
        });
        if (result.success) {
            this.gameId = result.gameId.toString();
            console.log(`Game record initialized with ID: ${this.gameId}`);
        }
        else {
            console.error("Failed to initialize game record");
        }
    }
    setupDisconnectHandlers() {
        const handleClose = async (player) => {
            if (player === 'player1') {
                this.player1Connected = false;
                if (this.player2Connected) {
                    this.player2.send(JSON.stringify({
                        type: "game_over",
                        payload: {
                            winner: "Black (opponent disconnected)"
                        }
                    }));
                    if (this.player1.email && this.player2.email) {
                        await this.finalizeGameRecord('black');
                    }
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
                    if (this.player1.email && this.player2.email) {
                        await this.finalizeGameRecord('white');
                    }
                }
            }
        };
        this.player1.on('close', () => handleClose('player1'));
        this.player2.on('close', () => handleClose('player2'));
    }
    async makeMove(socket, move) {
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
            const moveNotation = `${move.from}-${move.to}`;
            this.moves.push(moveNotation);
            if (this.player1.email && this.player2.email) {
                await this.updateGameMoves();
            }
            if (this.board.isGameOver()) {
                let winner = 'draw';
                let winnerMessage = "Draw";
                if (this.board.isCheckmate()) {
                    winner = this.board.turn() === "w" ? 'black' : 'white';
                    winnerMessage = this.board.turn() === "w" ? "Black" : "White";
                }
                const gameOverPayload = {
                    type: "game_over",
                    payload: {
                        winner: winnerMessage
                    }
                };
                this.player1.send(JSON.stringify(gameOverPayload));
                this.player2.send(JSON.stringify(gameOverPayload));
                if (this.player1.email && this.player2.email) {
                    await this.finalizeGameRecord(winner);
                }
                return;
            }
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
    async updateGameMoves() {
        if (!this.gameId)
            return;
        try {
            const { GameRecord } = require('./Database');
            await GameRecord.updateOne({ _id: this.gameId }, { $set: { moves: this.moves } });
        }
        catch (error) {
            console.error("Error updating game moves:", error);
        }
    }
    async finalizeGameRecord(result) {
        if (!this.gameId)
            return;
        try {
            const { GameRecord } = require('./Database');
            await GameRecord.updateOne({ _id: this.gameId }, {
                $set: {
                    result: result,
                    endTime: new Date(),
                    moves: this.moves
                }
            });
            console.log(`Game ${this.gameId} finalized with result: ${result}`);
        }
        catch (error) {
            console.error("Error finalizing game record:", error);
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
