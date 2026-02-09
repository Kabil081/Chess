import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { betterAuth } from "better-auth";
import { connectDB } from "./mongoclient-db";

export async function initAuth() {
  
  const db = await connectDB();
  const adapter: any = mongodbAdapter(db);

  if (typeof adapter.transaction !== "function") {
    adapter.transaction = async (fn: any) => {
      return await fn(adapter);
    };
  }

  const auth = betterAuth({
    // ✅ Backend URL - where Google sends callbacks
    baseURL: process.env.BETTER_AUTH_URL!,
    
    trustedOrigins: [process.env.FRONTEND_URL!],
    
    database: adapter,

    socialProviders: {
      google: {
        clientId: process.env.CLIENT_ID!,
        clientSecret: process.env.CLIENT_SECRET!,
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