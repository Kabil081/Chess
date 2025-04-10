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
        // Initialize game in database
        this.initGameRecord();
        // Send game initialization message to players
        this.player1.send(JSON.stringify({
            type: "init_game",
            payload: {
                color: "white",
                opponent: player2.username
            }
        }));
        this.player2.send(JSON.stringify({
            type: "init_game",
            payload: {
                color: "black",
                opponent: player1.username
            }
        }));
        this.setupDisconnectHandlers();
    }
    initGameRecord() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.player1.username || !this.player2.username) {
                console.error("Cannot initialize game record: Missing player username");
                return;
            }
            const result = yield (0, Database_1.saveGameRecord)({
                whitePlayer: this.player1.username,
                blackPlayer: this.player2.username,
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
        });
    }
    setupDisconnectHandlers() {
        const handleClose = (player) => __awaiter(this, void 0, void 0, function* () {
            if (player === 'player1') {
                this.player1Connected = false;
                if (this.player2Connected) {
                    this.player2.send(JSON.stringify({
                        type: "game_over",
                        payload: {
                            winner: "Black (opponent disconnected)"
                        }
                    }));
                    // Update game record if both players are authenticated
                    if (this.player1.username && this.player2.username) {
                        yield this.finalizeGameRecord('black');
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
                    // Update game record if both players are authenticated
                    if (this.player1.username && this.player2.username) {
                        yield this.finalizeGameRecord('white');
                    }
                }
            }
        });
        this.player1.on('close', () => handleClose('player1'));
        this.player2.on('close', () => handleClose('player2'));
    }
    makeMove(socket, move) {
        return __awaiter(this, void 0, void 0, function* () {
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
                // Record the move
                const moveNotation = `${move.from}-${move.to}`;
                this.moves.push(moveNotation);
                // Update game record in database with the new move
                if (this.player1.username && this.player2.username) {
                    yield this.updateGameMoves();
                }
                if (this.board.isGameOver()) {
                    let winner = 'draw';
                    let winnerMessage = "Draw";
                    if (this.board.isCheckmate()) {
                        winner = this.board.turn() === "w" ? 'black' : 'white';
                        winnerMessage = this.board.turn() === "w" ? "Black" : "White";
                    }
                    // Send game over message to both players
                    const gameOverPayload = {
                        type: "game_over",
                        payload: {
                            winner: winnerMessage
                        }
                    };
                    this.player1.send(JSON.stringify(gameOverPayload));
                    this.player2.send(JSON.stringify(gameOverPayload));
                    // Update game record if both players are authenticated
                    if (this.player1.username && this.player2.username) {
                        yield this.finalizeGameRecord(winner);
                    }
                    return;
                }
                // Send move to opponent
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
        });
    }
    updateGameMoves() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gameId)
                return;
            try {
                const { GameRecord } = require('./Database');
                yield GameRecord.updateOne({ _id: this.gameId }, { $set: { moves: this.moves } });
            }
            catch (error) {
                console.error("Error updating game moves:", error);
            }
        });
    }
    finalizeGameRecord(result) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.gameId)
                return;
            try {
                const { GameRecord } = require('./Database');
                yield GameRecord.updateOne({ _id: this.gameId }, {
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
        });
    }
    isPlayerInGame(socket) {
        return socket === this.player1 || socket === this.player2;
    }
    isActive() {
        return this.player1Connected && this.player2Connected && !this.board.isGameOver();
    }
}
exports.Game = Game;
