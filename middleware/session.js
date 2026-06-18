import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../config/auth.js";

const session = async (req, res, next) => {
  try {
    const auth = getAuth();
    const sessionData = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    req.session = sessionData || null;
    req.user = sessionData?.user || null;
  } catch {
    req.session = null;
    req.user = null;
  }
  next();
};

export default session;
