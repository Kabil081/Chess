import 'dotenv/config';
import express from "express";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import cors from "cors";
import { GameManager } from "./GameManager";
import { connectMongoose, registerUser } from "./Database";
import authRouter from "./routes/better-auth";
import googleAuthRouter from "./routes/google-auth";
// import { initAuth } from "./auth"; // ✅ REMOVE THIS LINE

const app = express();

app.use(
  cors({
    origin: [process.env.FRONTEND_URL as string],
    methods: ["POST", "GET"],
    credentials: true,
  })
);

app.use(express.json());

const PORT = 3001;
const server = createServer(app);
const wss = new WebSocketServer({ server });
const gameManager = new GameManager();

const initializeAdminUser = async () => {
  try {
    const result = await registerUser("admin", "admin123", "admin@chess.io");
    if (result.success) console.log("Admin user created successfully");
    else console.log("Admin user already exists");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
};

async function start(){
  await connectMongoose();
  console.log("Database connected");
  
  app.use((req, res, next) => {
    console.log("REQ URL:", req.url);
    console.log("REQ HOST:", req.headers.host);
    next();
  });  
  
  // ✅ Email/password auth routes
  app.use("/api/auth", authRouter);
  
  // ✅ Google OAuth routes (our custom implementation)
  app.use("/api/auth", googleAuthRouter);
  
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
    console.log("✅ WS connected from:", req.socket.remoteAddress);
  
    ws.on("close", (code, reason) => {
      console.log("❌ WS closed:", code, reason.toString());
    });
  
    ws.on("error", (err) => {
      console.error("❌ WS error:", err);
    });
  
    let token: string | undefined;
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      token = url.searchParams.get('token') ?? undefined;
      console.log(url);
    } catch {
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