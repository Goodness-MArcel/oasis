import express from "express";
const router = express.Router();
router.get("/", (req, res) => {
  res.redirect("/user/dashboard");
});

router.get("/dashboard", (req, res) => {
  res.render("user/dashboard", {
    layout: "layouts/user-main",
    title: "Dashboard",
    description: "User dashboard",
    pageStyles: ["admin.css", "user.css"],
  });
});

router.get("/profile", (req, res) => {
  res.render("user/profile", {
    layout: "layouts/user-main",
    title: "Profile",
    pageStyles: ["admin.css", "user.css"],
  });
});

router.get("/courses", (req, res) => {
  res.render("user/courses", {
    layout: "layouts/user-main",
    title: "My Courses",
    pageStyles: ["admin.css", "user.css"],
  });
});

router.get("/settings", (req, res) => {
  res.render("user/settings", {
    layout: "layouts/user-main",
    title: "Settings",
    pageStyles: ["admin.css", "user.css"],
  });
});

export default router;
