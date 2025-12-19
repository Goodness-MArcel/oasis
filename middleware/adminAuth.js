// middleware/adminAuth.js
import jwt from "jsonwebtoken";

export function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization || req.cookies?.admin_token;
  let token = null;

  // Support Bearer token or cookie
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    req.flash("error", "You must be logged in as admin.");
    return res.redirect("/admin/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "oasis_jwt_secret");
    req.admin = decoded;
    next();
  } catch (err) {
    req.flash("error", "Invalid or expired admin session. Please log in again.");
    return res.redirect("/admin/login");
  }
}
