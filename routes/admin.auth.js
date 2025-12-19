import { Router } from "express";
const router = Router();

import {adminLogin} from '../controllers/admin/admin.auth.js';

router.get("/login", adminLogin);




export default router;