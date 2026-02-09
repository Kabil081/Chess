"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Database_1 = require("../Database");
const jwt_1 = require("../utils/jwt");
const auth_1 = require("../auth");
const router = express_1.default.Router();
let authInstance = null;
// Initialize auth instance
(async () => {
    authInstance = await (0, auth_1.initAuth)();
})();
// POST /api/auth/signup
router.post("/signup", async (req, res) => {
    const { email, password, username } = req.body;
    // Validation
    if (!email || !password) {
        res.status(400).json({ success: false, message: "Email and password are required" });
        return;
    }
    if (!username || username.length < 3) {
        res.status(400).json({ success: false, message: "Username must be at least 3 characters long" });
        return;
    }
    if (password.length < 6) {
        res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
        return;
    }
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        res.status(400).json({ success: false, message: "Invalid email format" });
        return;
    }
    try {
        const result = await (0, Database_1.registerUser)(username, password, email);
        if (!result.success) {
            // Check if it's a duplicate email error
            if (result.message === 'Email already in use') {
                res.status(409).json({ success: false, message: result.message });
                return;
            }
            if (result.message === 'Username already taken') {
                res.status(409).json({ success: false, message: result.message });
                return;
            }
            // Other validation errors
            res.status(400).json({ success: false, message: result.message });
            return;
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: result.user.id,
            email: result.user.email,
            username: result.user.username
        });
        res.status(201).json({
            success: true,
            token,
            user: {
                id: result.user.id,
                email: result.user.email
            }
        });
    }
    catch (error) {
        console.error("Sign-up error:", error);
        res.status(500).json({ success: false, message: "Server error during sign-up" });
    }
});
// POST /api/auth/signin
router.post("/signin", async (req, res) => {
    const { email, password } = req.body;
    // Validation
    if (!email || !password) {
        res.status(400).json({ success: false, message: "Email and password are required" });
        return;
    }
    try {
        const result = await (0, Database_1.authenticateUser)(email, password);
        if (!result.success) {
            res.status(401).json({ success: false, message: result.message });
            return;
        }
        // Generate JWT token
        const token = (0, jwt_1.generateToken)({
            userId: result.user.id,
            email: result.user.email,
            username: result.user.username
        });
        res.status(200).json({
            success: true,
            token,
            user: {
                id: result.user.id,
                email: result.user.email
            }
        });
    }
    catch (error) {
        console.error("Sign-in error:", error);
        res.status(500).json({ success: false, message: "Server error during sign-in" });
    }
});
exports.default = router;
