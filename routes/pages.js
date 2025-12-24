import { Router } from "express";
import { body } from "express-validator";
import { registerUser, loginUser, forgotPassword, resetPassword } from "../controllers/user/user.auth.js";
import db from "../models/index.js";

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

router.get("/online-training", async (req, res) => {
  try {
    const courses = await db.Course.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.render("pages/online-training", {
      title: "Online Training",
      description:
        "Flexible online courses in Web Development, Data, AI, Cybersecurity and more.",
      pageStyles: "online-training.css",
      pageScript: null,
      courses,
    });
  } catch (err) {
    console.error("Error loading online training courses:", err);
    res.render("pages/online-training", {
      title: "Online Training",
      description:
        "Flexible online courses in Web Development, Data, AI, Cybersecurity and more.",
      pageStyles: "online-training.css",
      pageScript: null,
      courses: [],
    });
  }
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
    old: { email: "" },
  });
});

router.post(
  "/auth",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  loginUser
);

router.get("/signup", (req, res) => {
  res.render("pages/signup", {
    title: "Create Your Account",
    description: "Sign up for an Integrated Oasis learner account.",
    pageStyles: "auth.css",
    pageScript: "auth.js",
    old: { fullName: "", email: "" },
  });
});

router.post(
  "/signup",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage("Password must include letters, numbers and special characters"),
    body("passwordConfirm")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
    body("terms").equals("1").withMessage("You must accept the terms"),
  ],
  registerUser
);

router.get("/forgot-password", (req, res) => {
  res.render("pages/forgot-password", {
    title: "Forgot Password",
    description: "Reset your Integrated Oasis account password.",
    pageStyles: "auth.css",
    pageScript: "auth.js",
  });
});

router.post(
  "/forgot-password",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
  ],
  forgotPassword
);

router.get("/reset-password/:token", (req, res) => {
  res.render("pages/reset-password", {
    title: "Reset Password",
    description: "Enter your new password.",
    pageStyles: "auth.css",
    pageScript: "auth.js",
    token: req.params.token,
  });
});

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)
      .withMessage("Password must include letters, numbers and special characters"),
    body("passwordConfirm")
      .notEmpty()
      .withMessage("Please confirm your password")
      .custom((value, { req }) => value === req.body.password)
      .withMessage("Passwords do not match"),
  ],
  resetPassword
);

export default router;
