// Admin logout route

import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { adminLogin } from "../controllers/admin/admin.auth.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { listCourses, createCourse } from '../controllers/admin/courses.js';
import { getCourse, updateCourse, deleteCourse } from '../controllers/admin/courses.js';
const router = Router();

// Public admin login page
router.get("/login", (req, res) => {
  res.render("admin/login", {
    layout: "layouts/admin-auth",
    title: "Admin Login",
    description: "Admin access to Integrated Oasis dashboard.",
    pageStyles: "admin.css",
    error: res.locals.error && res.locals.error.length > 0 ? res.locals.error[0] : null,
    success: res.locals.success && res.locals.success.length > 0 ? res.locals.success[0] : null,
  });
});


// Admin login handler (public)
router.post("/auth/login", adminLogin);

// Protect all routes below this line
router.use(adminAuth);

// Redirect /admin to the main dashboard
router.get("/", (req, res) => {
  res.redirect("/admin/dashboard");
});

// Admin dashboard main page
router.get("/dashboard", (req, res) => {
  res.render("admin/dashboard", {
    layout: "layouts/admin-main",
    title: "Admin Dashboard",
    description: "Overview of key metrics and shortcuts.",
    pageStyles: "admin.css",
  });
});

router.get('/courses', listCourses);

// Multer setup for course images
const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'courses');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ storage });

// Handle course creation (admin)
router.post('/courses', upload.single('image'), createCourse);

// Fetch a single course as JSON (used by edit modal)
router.get('/courses/:id/json', getCourse);

// Update a course (admin) — handles optional new image
router.post('/courses/:id/update', upload.single('image'), updateCourse);

// Delete a course (admin)
router.post('/courses/:id/delete', deleteCourse);


// Example page: manage users
router.get("/users", (req, res) => {
  res.render("admin/users", {
    layout: "layouts/admin-main",
    title: "Manage Users",
    description: "View and manage registered users.",
    pageStyles: "admin.css",
  });
});

router.get("/Revenue", (req, res) => {
  res.render("admin/Revenue", {
    layout: "layouts/admin-main",
    title: "Manage Revenue",
    description: "View and manage revenue details.",
    pageStyles: "admin.css",
  });
});

router.get("/analytics", (req, res) => {
  res.render("admin/analytics", {
    layout: "layouts/admin-main",
    title: "Analytics",
    description: "View site analytics and reports.",
    pageStyles: "admin.css",
  });
});

// Example page: site settings
router.get("/settings", (req, res) => {
  res.render("admin/settings", {
    layout: "layouts/admin-main",
    title: "Admin Settings",
    description: "Configure admin-level settings.",
    pageStyles: "admin.css",
  });
});


router.post("/logout", (req, res) => {
  res.clearCookie("admin_token");
  req.session.admin = null;
  req.flash("success", "You have been logged out.");
  res.redirect("/admin/login");
});


export default router;
