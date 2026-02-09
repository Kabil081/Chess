import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI as string;

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  if (!db) {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db();
    console.log("✅ Connected to MongoDB (MongoClient v5+)");
  }
  return db;
}
