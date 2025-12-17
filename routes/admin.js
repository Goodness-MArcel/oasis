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

export default router;
