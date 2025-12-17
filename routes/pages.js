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

router.get("/online-training", (req, res) => {
  res.render("pages/online-training", {
    title: "Online Training",
    description: "Flexible online courses in Web Development, Data, AI, Cybersecurity and more.",
    pageStyles: "online-training.css",
    pageScript: null,
  });
});

router.get("/in-house-training", (req, res) => {
  res.render("pages/in-house-training", {
    title: "In-House Training",
    description: "Customized in-house training programs for teams and organizations.",
    pageStyles: "in-house.css",
    pageScript: null,
  });
});

router.get("/free-tutorials", (req, res) => {
  res.render("pages/free-tutorials", {
    title: "Free Tutorials",
    description: "Access free programming, web design, data, and tech tutorials from Integrated Oasis.",
    pageStyles: "free-tutorials.css",
    pageScript: null,
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
