import express from "express";
import dotenv from "dotenv";
import morgan from "morgan";
import helmet from "helmet";
import expressLayouts from "express-ejs-layouts";

dotenv.config();
const app = express();
app.use(helmet());
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
  res.locals.title = res.locals.title || "Integrated Oasis";
  res.locals.description =
    res.locals.description ||
    "Integrated Oasis is a modern learning and training platform.";
  res.locals.pageStyles = res.locals.pageStyles || null;
  res.locals.pageScript = res.locals.pageScript || null;
  next();
});
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Home",
    description: "Welcome to Integrated Oasis",
    pageStyles: "home.css",
    pageScript: "home.js",
  });
});

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
