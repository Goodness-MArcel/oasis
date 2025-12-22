// middleware/userAuth.js
// Protect user-facing routes using JWT stored in an httpOnly cookie (user_token)

import jwt from "jsonwebtoken";

export function userAuth(req, res, next) {
  // Look for Bearer header first, then cookie
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.user_token) {
    token = req.cookies.user_token;
  }

  if (!token) {
    req.flash("error", "Please log in to continue.");
    return res.redirect("/auth");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "oasis_jwt_secret");
    req.user = decoded;
    res.locals.currentUser = decoded;
    return next();
  } catch (err) {
    req.flash("error", "Session expired. Please log in again.");
    return res.redirect("/auth");
  }
}
