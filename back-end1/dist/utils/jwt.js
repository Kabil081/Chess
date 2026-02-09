"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim() === '') {
        throw new Error('JWT_SECRET is not set in environment variables');
    }
    return secret;
}
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), {
        expiresIn: '7d', // Token expires in 7 days
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        if (!token || typeof token !== 'string' || token.trim() === '') {
            return null;
        }
        const decoded = jsonwebtoken_1.default.verify(token.trim(), getJwtSecret());
        return decoded;
    }
    catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
};
exports.verifyToken = verifyToken;
