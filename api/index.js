import initApp from "../src/app.js";

let app = null;

async function getApp() {
  if (!app) {
    app = await initApp();
  }
  return app;
}

export default async function handler(req, res) {
  try {
    const expressApp = await getApp();
    return expressApp(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
