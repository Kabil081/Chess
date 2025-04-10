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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerGameHistory = exports.saveGameRecord = exports.authenticateUser = exports.registerUser = exports.connectDB = exports.GameRecord = exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
});
const gameSchema = new mongoose_1.default.Schema({
    whitePlayer: { type: String, required: true },
    blackPlayer: { type: String, required: true },
    moves: [String],
    result: { type: String, enum: ['white', 'black', 'draw', 'ongoing'], default: 'ongoing' },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
});
exports.User = mongoose_1.default.model('User', userSchema);
exports.GameRecord = mongoose_1.default.model('Game', gameSchema);
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const mongoDB = process.env.MONGODB_URI;
    if (!mongoDB) {
        console.error("❌ MONGODB_URI not found in .env");
        process.exit(1);
    }
    try {
        yield mongoose_1.default.connect(mongoDB, {
            dbName: "chessdb",
        });
        console.log("✅ Connected to MongoDB Atlas");
    }
    catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
});
exports.connectDB = connectDB;
const bcrypt_1 = __importDefault(require("bcrypt"));
const registerUser = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingUser = yield exports.User.findOne({ username });
        if (existingUser) {
            return { success: false, message: 'Username already taken' };
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        const newUser = new exports.User({
            username,
            password: hashedPassword
        });
        yield newUser.save();
        return { success: true, message: 'User registered successfully' };
    }
    catch (error) {
        console.error('Registration error:', error);
        return { success: false, message: 'Server error during registration' };
    }
});
exports.registerUser = registerUser;
const authenticateUser = (username, password) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield exports.User.findOne({ username });
        if (!user) {
            return { success: false, message: 'Invalid credentials' };
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return { success: false, message: 'Invalid credentials' };
        }
        return {
            success: true,
            message: 'Authentication successful',
            userData: {
                username: user.username,
                gamesPlayed: user.gamesPlayed,
                wins: user.wins,
                losses: user.losses,
                draws: user.draws
            }
        };
    }
    catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: 'Server error during authentication' };
    }
});
exports.authenticateUser = authenticateUser;
const saveGameRecord = (gameData) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const newGame = new exports.GameRecord(gameData);
        const savedGame = yield newGame.save();
        if (gameData.result !== 'ongoing') {
            yield updatePlayerStats(gameData.whitePlayer, gameData.blackPlayer, gameData.result);
        }
        return { success: true, gameId: savedGame._id.toString() }; // ✅ fixed here
    }
    catch (error) {
        console.error('Error saving game:', error);
        return { success: false, message: 'Error saving game record' };
    }
});
exports.saveGameRecord = saveGameRecord;
const updatePlayerStats = (whitePlayer, blackPlayer, result) => __awaiter(void 0, void 0, void 0, function* () {
    const whiteUpdate = { $inc: { gamesPlayed: 1 } };
    if (result === 'white')
        whiteUpdate.$inc.wins = 1;
    else if (result === 'black')
        whiteUpdate.$inc.losses = 1;
    else if (result === 'draw')
        whiteUpdate.$inc.draws = 1;
    const blackUpdate = { $inc: { gamesPlayed: 1 } };
    if (result === 'black')
        blackUpdate.$inc.wins = 1;
    else if (result === 'white')
        blackUpdate.$inc.losses = 1;
    else if (result === 'draw')
        blackUpdate.$inc.draws = 1;
    yield exports.User.updateOne({ username: whitePlayer }, whiteUpdate);
    yield exports.User.updateOne({ username: blackPlayer }, blackUpdate);
});
const getPlayerGameHistory = (username) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const games = yield exports.GameRecord.find({
            $or: [
                { whitePlayer: username },
                { blackPlayer: username }
            ]
        }).sort({ startTime: -1 }).limit(20);
        return { success: true, games };
    }
    catch (error) {
        console.error('Error fetching game history:', error);
        return { success: false, message: 'Error retrieving game history' };
    }
});
exports.getPlayerGameHistory = getPlayerGameHistory;
