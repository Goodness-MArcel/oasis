// Admin logout route

import { Router } from "express";
import { adminAuth } from "../middleware/adminAuth.js";
import { adminLogin } from "../controllers/admin/admin.auth.js";
import db from "../models/index.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { listCourses, createCourse } from '../controllers/admin/courses.js';
import { getCourse, updateCourse, deleteCourse } from '../controllers/admin/courses.js';
// analytics logic is handled inline below (moved from controller)
import { listMeetings, createMeeting, updateMeeting, deleteMeeting } from "../controllers/admin/meetings.js";
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
router.get("/dashboard", async (req, res) => {
  try {
    const Op = db.Sequelize.Op;

    // Fetch key metrics and recent users
    const [totalUsers, newUsersLast24h, totalCourses, recentUsers] = await Promise.all([
      db.User.count(),
      db.User.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
      db.Course.count(),
      db.User.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    // Upcoming meetings: next 5 meetings from now onwards
    const now = new Date();
    const upcomingMeetings = await db.Meeting.findAll({
      where: {
        start: { [Op.gte]: now },
      },
      order: [["start", "ASC"]],
      limit: 5,
    });

    res.render("admin/dashboard", {
      layout: "layouts/admin-main",
      title: "Admin Dashboard",
      description: "Overview of key metrics and shortcuts.",
      pageStyles: "admin.css",
      recentUsers,
      totalUsers,
      newUsersLast24h,
      totalCourses,
      upcomingMeetings,
    });
  } catch (err) {
    console.error("Error loading admin dashboard:", err);
    res.render("admin/dashboard", {
      layout: "layouts/admin-main",
      title: "Admin Dashboard",
      description: "Overview of key metrics and shortcuts.",
      pageStyles: "admin.css",
      recentUsers: [],
      totalUsers: 0,
      newUsersLast24h: 0,
      totalCourses: 0,
      upcomingMeetings: [],
    });
  }
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
  db.User.findAll({ order: [["createdAt", "DESC"]] })
    .then((users) => {
      res.render("admin/users", {
        layout: "layouts/admin-main",
        title: "Manage Users",
        description: "View and manage registered users.",
        pageStyles: "admin.css",
        users,
      });
    })
    .catch((err) => {
      console.error("Error fetching users for admin:", err);
      req.flash("error", "Unable to load users.");
      res.render("admin/users", {
        layout: "layouts/admin-main",
        title: "Manage Users",
        description: "View and manage registered users.",
        pageStyles: "admin.css",
        users: [],
      });
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

router.get("/analytics", async (req, res) => {
  try {
    // Range for traffic section (in days)
    const rawRange = parseInt(req.query.range, 10);
    let rangeDays = 7;
    if ([7, 30, 90].includes(rawRange)) {
      rangeDays = rawRange;
    }

    // High-level KPIs
    const [totalUsers, activeCourses, totalEnrollments, completedEnrollments] = await Promise.all([
      db.User.count(),
      db.Course.count(),
      db.Enrollment.count(),
      db.Enrollment.count({ where: { status: "completed" } }),
    ]);

    const avgCompletionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    // Traffic & engagement: build labels and counts for the requested range
    const Op = db.Sequelize.Op;
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (rangeDays - 1));
    start.setHours(0, 0, 0, 0);

    const [recentUsers, recentEnrollmentsRange] = await Promise.all([
      db.User.findAll({
        where: { createdAt: { [Op.gte]: start } },
        attributes: ["createdAt"],
      }),
      db.Enrollment.findAll({
        where: { createdAt: { [Op.gte]: start } },
        attributes: ["createdAt"],
      }),
    ]);

    const labels = [];
    const signupsByDay = {};
    const enrollmentsByDay = {};

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      labels.push(key);
      signupsByDay[key] = 0;
      enrollmentsByDay[key] = 0;
    }

    recentUsers.forEach((u) => {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (signupsByDay[key] !== undefined) signupsByDay[key] += 1;
    });

    recentEnrollmentsRange.forEach((e) => {
      const key = e.createdAt.toISOString().slice(0, 10);
      if (enrollmentsByDay[key] !== undefined) enrollmentsByDay[key] += 1;
    });

    const trafficLabels = labels;
    const trafficSignups = labels.map((key) => signupsByDay[key] || 0);
    const trafficEnrollments = labels.map((key) => enrollmentsByDay[key] || 0);

    // Top performing courses
    const coursesWithEnrollments = await db.Course.findAll({
      include: [
        {
          model: db.Enrollment,
          as: "enrollments",
          attributes: ["status"],
        },
      ],
    });

    const courseMetrics = coursesWithEnrollments.map((course) => {
      const enrollments = Array.isArray(course.enrollments) ? course.enrollments : [];
      const total = enrollments.length;
      const completed = enrollments.filter((e) => e.status === "completed").length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      let statusLabel = "Niche";
      if (total >= 500 || completionRate >= 75) statusLabel = "Growing";
      else if (total >= 100 || completionRate >= 50) statusLabel = "Stable";

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        totalEnrollments: total,
        completionRate,
        statusLabel,
      };
    });

    const topCourses = courseMetrics.sort((a, b) => b.totalEnrollments - a.totalEnrollments).slice(0, 5);

    // Recent activity: latest enrollments
    const recentEnrollments = await db.Enrollment.findAll({
      include: [
        { model: db.User, as: "user", attributes: ["username", "email"] },
        { model: db.Course, as: "course", attributes: ["title"] },
      ],
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    return res.render("admin/analytics", {
      layout: "layouts/admin-main",
      title: "Analytics",
      description: "View site analytics and reports.",
      pageStyles: "admin.css",
      totalUsers,
      activeCourses,
      totalEnrollments,
      avgCompletionRate,
      topCourses,
      recentEnrollments,
      rangeDays,
      trafficLabels,
      trafficSignups,
      trafficEnrollments,
    });
  } catch (err) {
    console.error("Error loading analytics page (route):", err && err.stack ? err.stack : err);
    res.status(500).render("admin/analytics", {
      layout: "layouts/admin-main",
      title: "Analytics",
      description: "View site analytics and reports.",
      pageStyles: "admin.css",
      totalUsers: 0,
      activeCourses: 0,
      totalEnrollments: 0,
      avgCompletionRate: 0,
      topCourses: [],
      recentEnrollments: [],
      rangeDays: 7,
      trafficLabels: [],
      trafficSignups: [],
      trafficEnrollments: [],
    });
  }
});

// Meetings API for admin dashboard calendar
router.get("/meetings", listMeetings);
router.post("/meetings", createMeeting);
router.put("/meetings/:id", updateMeeting);
router.delete("/meetings/:id", deleteMeeting);

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
