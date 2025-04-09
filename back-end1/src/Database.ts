import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config(); 

export const connectDB = async () => {
  const mongoDB = process.env.MONGODB_URI;

  if (!mongoDB) {
    console.error("❌ MONGODB_URI not found in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoDB, {
      dbName: "chessdb",
    });

    console.log("✅ Connected to MongoDB Atlas");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};
