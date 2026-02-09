"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
const GOOGLE_CLIENT_ID = process.env.CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.CLIENT_SECRET;
const BACKEND_URL = process.env.BETTER_AUTH_URL || "http://localhost:3001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;
// Step 1: Redirect to Google
router.get("/google", (req, res) => {
    console.log("🚀 Initiating Google OAuth");
    console.log("Redirect URI:", REDIRECT_URI);
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline&` +
        `prompt=consent`;
    console.log("Redirecting to Google:", googleAuthURL);
    res.redirect(googleAuthURL);
});
// Step 2: Handle Google's callback
router.get("/google/callback", async (req, res) => {
    var _a;
    console.log("📞 Google callback received");
    const { code, error } = req.query;
    if (error) {
        console.error("❌ Google OAuth error:", error);
        return res.redirect(`${FRONTEND_URL}?error=google_auth_failed`);
    }
    if (!code) {
        console.error("❌ No authorization code received");
        return res.redirect(`${FRONTEND_URL}?error=no_code`);
    }
    try {
        console.log("🔄 Exchanging code for token...");
        // Exchange code for tokens
        const tokenResponse = await axios_1.default.post("https://oauth2.googleapis.com/token", {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: "authorization_code",
        });
        const { access_token } = tokenResponse.data;
        console.log("✅ Token received");
        // Get user info from Google
        const userResponse = await axios_1.default.get("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        const googleUser = userResponse.data;
        console.log("✅ Google user:", googleUser.email);
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: googleUser.id,
            email: googleUser.email,
            username: googleUser.name || googleUser.email.split("@")[0],
        });
        console.log("✅ Redirecting to frontend with token");
        // Redirect back to frontend with token
        res.redirect(`${FRONTEND_URL}?token=${token}&email=${encodeURIComponent(googleUser.email)}`);
    }
    catch (error) {
        console.error("❌ Error in OAuth flow:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
    }
});
exports.default = router;
