"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAuth = initAuth;
const mongodb_1 = require("better-auth/adapters/mongodb");
const better_auth_1 = require("better-auth");
const mongoclient_db_1 = require("./mongoclient-db");
async function initAuth() {
    const db = await (0, mongoclient_db_1.connectDB)();
    const adapter = (0, mongodb_1.mongodbAdapter)(db);
    if (typeof adapter.transaction !== "function") {
        adapter.transaction = async (fn) => {
            return await fn(adapter);
        };
    }
    const auth = (0, better_auth_1.betterAuth)({
        // ✅ Backend URL - where Google sends callbacks
        baseURL: process.env.BETTER_AUTH_URL,
        trustedOrigins: [process.env.FRONTEND_URL],
        database: adapter,
        socialProviders: {
            google: {
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
            },
        },
        // ✅ IMPORTANT: After successful OAuth, redirect to frontend
        session: {
            cookieCache: {
                enabled: true,
                maxAge: 5 * 60, // 5 minutes
            },
        },
    });
    return auth;
}
