import express, { Request, Response } from "express";
import axios from "axios";
import { generateToken } from "../utils/jwt";

const router = express.Router();

const GOOGLE_CLIENT_ID = process.env.CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.CLIENT_SECRET!;
const BACKEND_URL = process.env.BETTER_AUTH_URL || "http://localhost:3001";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

// Step 1: Redirect to Google
router.get("/google", (req: Request, res: Response) => {
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
router.get("/google/callback", async (req: Request, res: Response) => {
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
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    });

    const { access_token } = tokenResponse.data;
    console.log("✅ Token received");

    // Get user info from Google
    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const googleUser = userResponse.data;
    console.log("✅ Google user:", googleUser.email);

    // Generate JWT token
    const token = generateToken({
      userId: googleUser.id,
      email: googleUser.email,
      username: googleUser.name || googleUser.email.split("@")[0],
    });

    console.log("✅ Redirecting to frontend with token");
    
    // Redirect back to frontend with token
    res.redirect(`${FRONTEND_URL}?token=${token}&email=${encodeURIComponent(googleUser.email)}`);
  } catch (error: any) {
    console.error("❌ Error in OAuth flow:", error.response?.data || error.message);
    res.redirect(`${FRONTEND_URL}?error=token_exchange_failed`);
  }
});

export default router;