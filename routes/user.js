import express from "express";
import { userAuth } from "../middleware/userAuth.js";
import { logoutUser, updateUserProfile } from "../controllers/user/user.auth.js";
import db from "../models/index.js";
const router = express.Router();

// Protect all user routes
router.use(userAuth);
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

router.get("/courses", async (req, res) => {
  try {
    const userId = req.user && req.user.id ? req.user.id : null;

    let enrolledCourses = [];
    let availableCourses = [];

    if (userId) {
      const enrollments = await db.Enrollment.findAll({
        where: { userId, status: "enrolled" },
        include: [{ model: db.Course, as: "course" }],
        order: [["createdAt", "DESC"]],
      });

      enrolledCourses = enrollments
        .filter((enrollment) => enrollment.course)
        .map((enrollment) => ({
          id: enrollment.course.id,
          title: enrollment.course.title,
          description: enrollment.course.description,
          image: enrollment.course.image,
          level: enrollment.course.category,
          progress:
            typeof enrollment.progress !== "undefined" && enrollment.progress !== null
              ? Number(enrollment.progress)
              : null,
        }));
    }

    const enrolledIds = enrolledCourses.map((c) => c.id);
    const where = enrolledIds.length
      ? { id: { [db.Sequelize.Op.notIn]: enrolledIds } }
      : {};

    const courses = await db.Course.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    availableCourses = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      image: course.image,
      level: course.category,
    }));

    res.render("user/courses", {
      layout: "layouts/user-main",
      title: "My Courses",
      pageStyles: ["admin.css", "user.css"],
      enrolledCourses,
      availableCourses,
    });
  } catch (err) {
    console.error("Error loading user courses:", err);
    req.flash("error", "Unable to load courses at the moment.");
    res.render("user/courses", {
      layout: "layouts/user-main",
      title: "My Courses",
      pageStyles: ["admin.css", "user.css"],
      enrolledCourses: [],
      availableCourses: [],
    });
  }
});

router.get("/settings", (req, res) => {
  res.render("user/settings", {
    layout: "layouts/user-main",
    title: "Settings",
    pageStyles: ["admin.css", "user.css"],
  });
});

router.post("/profile", updateUserProfile);

router.post("/logout", logoutUser);

export default router;
