"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI;
let client = null;
let db = null;
async function connectDB() {
    if (!db) {
        client = new mongodb_1.MongoClient(uri);
        await client.connect();
        db = client.db();
        console.log("✅ Connected to MongoDB (MongoClient v5+)");
    }
    return db;
}
