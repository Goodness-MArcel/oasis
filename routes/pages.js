import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Home",
    description: "Welcome to Integrated Oasis",
    pageStyles: "home.css",
    pageScript: "home.js",
  });
});

router.get("/about", (req, res) => {
  res.render("pages/about", {
    title: "About Us",
    description: "Learn more about Integrated Oasis",
    pageStyles: "about.css",
    pageScript: "about.js",
  });
});

router.get("/contact", (req, res) => {
  res.render("pages/contact", {
    title: "Contact Us",
    description: "Get in touch with Integrated Oasis",
    pageStyles: "contact.css",
    pageScript: "contact.js",
  });
});

router.get("/auth", (req, res) => {
  res.render("pages/auth", {
    title: "Login or Sign Up",
    description: "Access your Integrated Oasis learner account or create a new one.",
    pageStyles: "auth.css",
    pageScript: "auth.js",
  });
});

router.get("/signup", (req, res) => {
  res.render("pages/signup", {
    title: "Create Your Account",
    description: "Sign up for an Integrated Oasis learner account.",
    pageStyles: "auth.css",
    pageScript: "auth.js",
  });
});

export default router;
