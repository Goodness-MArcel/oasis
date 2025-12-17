import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import expressLayouts from "express-ejs-layouts";
import pagesRouter from "./routes/pages.js";
import adminRouter from "./routes/admin.js";

dotenv.config();
const app = express();

// Helmet security headers (CSP disabled so external CDNs like Bootstrap/Unsplash can load)
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(morgan("dev"));

app.set("view engine", "ejs");
app.set("views", "views");

app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Default locals for views to avoid undefined references
app.use((req, res, next) => {
  // Common view locals
  res.locals.title = res.locals.title || "Integrated Oasis";
  res.locals.description =
    res.locals.description ||
    "Integrated Oasis is a modern learning and training platform.";
  res.locals.pageStyles = res.locals.pageStyles || null;
  res.locals.pageScript = res.locals.pageScript || null;

  // Current path for active nav highlighting
  res.locals.currentPath = req.path;

  next();
});
const PORT = process.env.PORT || 3000;

// Page routes
app.use("/", pagesRouter);
app.use("/admin", adminRouter);

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
