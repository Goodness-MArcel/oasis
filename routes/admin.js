import { Router } from "express";

const router = Router();

router.get("/login", (req, res) => {
  res.render("admin/login", {
    layout: "layouts/admin-auth",
    title: "Admin Login",
    description: "Admin access to Integrated Oasis dashboard.",
    pageStyles: "admin.css",
  });
});

// Simple login handler (no real auth yet) – always redirects to dashboard
router.post("/login", (req, res) => {
  // TODO: replace with real authentication
  res.redirect("/admin/dashboard");
});

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

router.get("/courses", (req, res) => {
  res.render("admin/ManageCourses", {
    layout: "layouts/admin-main",
    title: "Manage Courses",
    description: "Create, edit, and manage courses.",
    pageStyles: "admin.css",
  });
});


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

export default router;
