import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import helmet from "helmet";

import session from "express-session";
import flash from "connect-flash";
import cookieParser from "cookie-parser";
import { flashMessage } from "./middleware/flashMessage.js";
import expressLayouts from "express-ejs-layouts";
import pagesRouter from "./routes/pages.js";
import adminRouter from "./routes/admin.js";
import adminAuth from "./routes/admin.auth.js";
import userRouter from "./routes/user.js";

// Import database connection and models (after dotenv.config)
import "./models/index.js";
const app = express();

// Helmet security headers (CSP disabled so external CDNs like Bootstrap/Unsplash can load)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(morgan("dev"));

app.set("view engine", "ejs");
// Resolve __dirname for ES modules and set an absolute views path to avoid deployment issues
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("views", path.join(__dirname, "views"));


// Session and flash middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "oasis_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());


app.use(cookieParser());
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Default locals for views to avoid undefined references
// Common view locals
app.use((req, res, next) => {
  res.locals.title = res.locals.title || "Integrated Oasis";
  res.locals.description =
    res.locals.description ||
    "Integrated Oasis is a modern learning and training platform.";
  res.locals.pageStyles = res.locals.pageStyles || null;
  res.locals.pageScript = res.locals.pageScript || null;
  res.locals.currentPath = req.path;
  res.locals.currentUser = req.user || req.session?.user || null;
  next();
});

// Flash message middleware (global)
app.use(flashMessage);
const PORT = process.env.PORT || 3000;

// Page routes
app.use("/", pagesRouter);
app.use("/admin", adminRouter);
app.use("/admin/auth", adminAuth);
app.use("/user", userRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).render("error", {
    title: "Not Found",
    status: 404,
    message: "The requested resource was not found.",
  });
});

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).render("error", {
    title: "Error",
    status,
    message,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
