import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import env from "./env.js";

let authInstance = null;

export function getAuth() {
  if (!authInstance) {
    throw new Error("Auth not initialized. Call createAuth(db) first.");
  }
  return authInstance;
}

export function createAuth(db) {
  authInstance = betterAuth({
    database: mongodbAdapter(db, {
      client: db.client,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    trustedOrigins: [env.CLIENT_URL],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        enabled: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
      },
    },
    user: {
      additionalFields: {
        isVerified: {
          type: "boolean",
          required: true,
          defaultValue: false,
          input: false,
        },
      },
    },
    plugins: [admin()],
    advanced: {
      defaultCookieAttributes: {
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
        httpOnly: true,
      },
    },
  });

  return authInstance;
}
