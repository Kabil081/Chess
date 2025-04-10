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
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const GameManager_1 = require("./GameManager");
const Database_1 = require("./Database");
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
app.use((0, cors_1.default)());
const PORT = process.env.PORT || 3001;
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
(0, Database_1.connectDB)();
const wss = new ws_1.WebSocketServer({ port: 8080 });
const gameManager = new GameManager_1.GameManager();
const initializeAdminUser = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield (0, Database_1.registerUser)('admin', 'admin123');
        if (result.success) {
            console.log('Admin user created successfully');
        }
        else {
            console.log('Admin user already exists');
        }
    }
    catch (error) {
        console.error('Error creating admin user:', error);
    }
});
app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
const initServer = () => __awaiter(void 0, void 0, void 0, function* () {
    yield initializeAdminUser();
    wss.on('connection', (ws) => {
        console.log('New client connected');
        gameManager.addUser(ws);
        ws.on('close', () => {
            console.log('Client disconnected');
            gameManager.removeUser(ws);
        });
    });
    console.log('Chess WebSocket server started on port 8080');
    setInterval(() => {
        const activeGames = gameManager.getActiveGames();
        const waitingUsers = gameManager.getWaitingUsers();
        const connectedUsers = gameManager.getConnectedUsers();
        console.log(`Server status: ${connectedUsers} users connected, ${activeGames} active games, ${waitingUsers} users waiting`);
    }, 30000);
});
initServer().catch(error => {
    console.error('Server initialization failed:', error);
    process.exit(1);
});
