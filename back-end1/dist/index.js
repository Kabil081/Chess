"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const http_1 = require("http");
const cors_1 = __importDefault(require("cors"));
const GameManager_1 = require("./GameManager");
const Database_1 = require("./Database");
const better_auth_1 = __importDefault(require("./routes/better-auth"));
const google_auth_1 = __importDefault(require("./routes/google-auth"));
// import { initAuth } from "./auth"; // ✅ REMOVE THIS LINE
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL],
    methods: ["POST", "GET"],
    credentials: true,
}));
app.use(express_1.default.json());
const PORT = 3001;
const server = (0, http_1.createServer)(app);
const wss = new ws_1.WebSocketServer({ server });
const gameManager = new GameManager_1.GameManager();
const initializeAdminUser = async () => {
    try {
        const result = await (0, Database_1.registerUser)("admin", "admin123", "admin@chess.io");
        if (result.success)
            console.log("Admin user created successfully");
        else
            console.log("Admin user already exists");
    }
    catch (error) {
        console.error("Error creating admin user:", error);
    }
};
async function start() {
    await (0, Database_1.connectMongoose)();
    console.log("Database connected");
    app.use((req, res, next) => {
        console.log("REQ URL:", req.url);
        console.log("REQ HOST:", req.headers.host);
        next();
    });
    // ✅ Email/password auth routes
    app.use("/api/auth", better_auth_1.default);
    // ✅ Google OAuth routes (our custom implementation)
    app.use("/api/auth", google_auth_1.default);
    // ✅ REMOVE ALL BETTER-AUTH CODE - Don't initialize or mount it
    // const auth = await initAuth();
    // if (auth && typeof auth.handler === "function"){
    //   app.use(auth.handler);
    // }
    app.get("/", (req, res) => {
        res.send("Server running Successfully!");
    });
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT} (HTTP + WebSocket)`);
    });
    await initializeAdminUser();
    wss.on("connection", (ws, req) => {
        var _a;
        console.log("✅ WS connected from:", req.socket.remoteAddress);
        ws.on("close", (code, reason) => {
            console.log("❌ WS closed:", code, reason.toString());
        });
        ws.on("error", (err) => {
            console.error("❌ WS error:", err);
        });
        let token;
        try {
            const url = new URL(req.url || '', `http://${req.headers.host}`);
            token = (_a = url.searchParams.get('token')) !== null && _a !== void 0 ? _a : undefined;
            console.log(url);
        }
        catch (_b) {
            token = undefined;
        }
        gameManager.addUser(ws, token);
    });
    console.log("Chess WebSocket server started on the same port as HTTP server");
}
start().catch((error) => {
    console.error("Server initialization failed:", error);
    process.exit(1);
});
