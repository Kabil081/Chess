"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayerGameHistory = exports.saveGameRecord = exports.authenticateUser = exports.registerUser = exports.connectMongoose = exports.GameRecord = exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true, unique: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: 'Please enter a valid email address'
        }
    },
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
const connectMongoose = async () => {
    const mongoDB = process.env.MONGODB_URI;
    if (!mongoDB) {
        console.error("❌ MONGODB_URI not found in .env");
        process.exit(1);
    }
    try {
        await mongoose_1.default.connect(mongoDB, {
            dbName: "chessdb",
        });
        console.log("✅ Connected to MongoDB Atlas");
    }
    catch (err) {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    }
};
exports.connectMongoose = connectMongoose;
const registerUser = async (username, password, email) => {
    var _a, _b;
    try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { success: false, message: 'Invalid email format' };
        }
        // Normalize email (lowercase and trim)
        const normalizedEmail = email.toLowerCase().trim();
        // Check for existing username
        const existingUser = await exports.User.findOne({ username });
        if (existingUser) {
            return { success: false, message: 'Username already taken' };
        }
        // Check for existing email
        const existingEmail = await exports.User.findOne({ email: normalizedEmail });
        if (existingEmail) {
            return { success: false, message: 'Email already in use' };
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const newUser = new exports.User({
            username,
            password: hashedPassword,
            email: normalizedEmail
        });
        await newUser.save();
        return {
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser._id.toString(),
                email: newUser.email,
                username: newUser.username
            }
        };
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            // Duplicate key error
            if ((_a = error.keyPattern) === null || _a === void 0 ? void 0 : _a.email) {
                return { success: false, message: 'Email already in use' };
            }
            if ((_b = error.keyPattern) === null || _b === void 0 ? void 0 : _b.username) {
                return { success: false, message: 'Username already taken' };
            }
        }
        return { success: false, message: 'Server error during registration' };
    }
};
exports.registerUser = registerUser;
const authenticateUser = async (email, password) => {
    try {
        // Normalize email (lowercase and trim)
        const normalizedEmail = email.toLowerCase().trim();
        const user = await exports.User.findOne({ email: normalizedEmail });
        if (!user) {
            return { success: false, message: 'Invalid email or password' };
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return { success: false, message: 'Invalid email or password' };
        }
        return {
            success: true,
            message: 'Authentication successful',
            user: {
                id: user._id.toString(),
                email: user.email,
                username: user.username
            },
            userData: {
                email: user.email,
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
};
exports.authenticateUser = authenticateUser;
const saveGameRecord = async (gameData) => {
    try {
        const newGame = new exports.GameRecord(gameData);
        const savedGame = await newGame.save();
        if (gameData.result !== 'ongoing') {
            await updatePlayerStats(gameData.whitePlayer, gameData.blackPlayer, gameData.result);
        }
        return { success: true, gameId: savedGame._id.toString() };
    }
    catch (error) {
        console.error('Error saving game:', error);
        return { success: false, message: 'Error saving game record' };
    }
};
exports.saveGameRecord = saveGameRecord;
const updatePlayerStats = async (whitePlayerEmail, blackPlayerEmail, result) => {
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
    await exports.User.updateOne({ email: whitePlayerEmail }, whiteUpdate);
    await exports.User.updateOne({ email: blackPlayerEmail }, blackUpdate);
};
const getPlayerGameHistory = async (email) => {
    try {
        const games = await exports.GameRecord.find({
            $or: [
                { whitePlayer: email },
                { blackPlayer: email }
            ]
        }).sort({ startTime: -1 }).limit(20);
        return { success: true, games };
    }
    catch (error) {
        console.error('Error fetching game history:', error);
        return { success: false, message: 'Error retrieving game history' };
    }
};
exports.getPlayerGameHistory = getPlayerGameHistory;
