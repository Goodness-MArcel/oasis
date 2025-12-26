import { Router } from "express";
const router = Router();

import {adminLogin} from '../controllers/admin/admin.auth.js';

router.get("/login", (req, res) => {
  res.render("admin/login", {
    title: "Admin Login",
    layout: "layouts/admin-auth"
  });
});
router.post("/login", adminLogin);

export default router;