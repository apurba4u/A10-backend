import { fromNodeHeaders } from "better-auth/node";
import { getAuth } from "../config/auth.js";

const sessionMiddleware = async (req, res, next) => {
  try {
    const auth = getAuth();
    let sessionData = null;

    if (req.headers.authorization) {
      sessionData = await auth.api.getSession({
        headers: fromNodeHeaders({
          cookie: `better-auth.session_token=${req.headers.authorization.replace("Bearer ", "")}`,
        }),
      });
    }

    if (!sessionData) {
      sessionData = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
    }

    req.session = sessionData || null;
    req.user = sessionData?.user || null;
  } catch {
    req.session = null;
    req.user = null;
  }
  next();
};

export default sessionMiddleware;
