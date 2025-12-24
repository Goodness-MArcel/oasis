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
import nodemailer from "nodemailer";
import ejs from "ejs";
const router = Router();

// Function to send follow-up email to a user
async function sendFollowUpEmail(user) {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;

  const emailUser = process.env.GMAIL_USER;
  const pass = process.env.APP_PASSWORD;

  if (!emailUser || !pass) {
    throw new Error('Email credentials not configured');
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: { user: emailUser, pass },
  });

  const from = process.env.EMAIL_FROM || `Integrated Oasis <${emailUser}>`;
  const subject = 'Ready to Start Learning? Explore Our Courses!';
  const appUrl = process.env.APP_URL || '';

  // Render email template
  const templatePath = path.join(process.cwd(), 'views', 'emails', 'followup.ejs');
  let html = '';
  try {
    html = await ejs.renderFile(templatePath, {
      username: user.username,
      email: user.email,
      appUrl
    });
  } catch (tplErr) {
    // Fallback to basic HTML
    html = `
      <p>Hi ${user.username || 'there'},</p>
      <p>We noticed you signed up for Integrated Oasis but haven't enrolled in any courses yet. We're here to help you get started!</p>
      <p>Explore our available courses and start your learning journey today:</p>
      <p><a href="${appUrl}/courses" style="background: #2e8b57; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Browse Courses</a></p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <p>Best regards,<br>The Integrated Oasis Team</p>
    `;
  }

  const text = `Hi ${user.username || 'there'},

We noticed you signed up for Integrated Oasis but haven't enrolled in any courses yet. We're here to help you get started!

Explore our available courses and start your learning journey today at: ${appUrl}/courses

If you have any questions, feel free to reply to this email.

Best regards,
The Integrated Oasis Team`;

  await transporter.sendMail({
    from,
    to: user.email,
    subject,
    text,
    html
  });
}

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

    // Fetch key metrics, recent users, and recent activities
    const [totalUsers, newUsersLast24h, totalCourses, recentUsers, recentActivities] = await Promise.all([
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
      db.Activity.findAll({
        order: [["createdAt", "DESC"]],
        limit: 10, // Show more activities than users
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
      recentActivities,
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
  db.User.findAll({
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: db.Enrollment,
        as: "enrollments",
        include: [
          {
            model: db.Course,
            as: "course",
            attributes: ["id", "title", "category"]
          }
        ]
      }
    ]
  })
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

// Send follow-up emails to users awaiting course enrollment
router.post("/users/send-followup", adminAuth, async (req, res) => {
  try {
    const { userIds, userEmails } = req.body;

    if ((!userIds || !Array.isArray(userIds)) && (!userEmails || !Array.isArray(userEmails))) {
      return res.status(400).json({ success: false, message: "User IDs or emails are required" });
    }

    let users = [];

    if (userIds && userIds.length > 0) {
      // Find users by IDs
      users = await db.User.findAll({
        where: { id: userIds },
        attributes: ['id', 'username', 'email']
      });
    } else if (userEmails && userEmails.length > 0) {
      // Find users by emails
      users = await db.User.findAll({
        where: { email: userEmails },
        attributes: ['id', 'username', 'email']
      });
    }

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "No users found" });
    }

    // Send follow-up emails
    const results = await Promise.all(users.map(async (user) => {
      try {
        await sendFollowUpEmail(user);

        // Log successful activity
        await db.Activity.create({
          type: 'followup_email',
          description: `Follow-up email sent to ${user.username} (${user.email})`,
          metadata: {
            userId: user.id,
            userEmail: user.email,
            userName: user.username
          }
        });

        return { userId: user.id, success: true };
      } catch (error) {
        console.error(`Failed to send follow-up email to ${user.email}:`, error);
        return { userId: user.id, success: false, error: error.message };
      }
    }));

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Log bulk activity if multiple emails were sent
    if (users.length > 1) {
      await db.Activity.create({
        type: 'followup_email',
        description: `Bulk follow-up emails sent: ${successful} successful, ${failed} failed`,
        metadata: {
          totalUsers: users.length,
          successful,
          failed,
          userIds: users.map(u => u.id)
        }
      });
    }

    res.json({
      success: true,
      message: `Follow-up emails sent: ${successful} successful, ${failed} failed`,
      results
    });

  } catch (error) {
    console.error("Error sending follow-up emails:", error);
    res.status(500).json({ success: false, message: "Failed to send follow-up emails" });
  }
});

// Delete user and all related data
router.delete("/users/:userId", adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const userIdNum = parseInt(userId);

    if (!userIdNum || isNaN(userIdNum)) {
      return res.status(400).json({ success: false, message: "Invalid user ID" });
    }

    // Check if user exists
    const user = await db.User.findByPk(userIdNum);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Start a transaction to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
      // Delete related data in order (to handle foreign key constraints)
      await db.Enrollment.destroy({
        where: { userId: userIdNum },
        transaction
      });

      await db.Payment.destroy({
        where: { userId: userIdNum },
        transaction
      });

      // Delete user activities
      await db.Activity.destroy({
        where: {
          [db.Sequelize.Op.or]: [
            { type: 'user_signup', metadata: { userId: userIdNum } },
            { type: 'followup_email', metadata: { userId: userIdNum } }
          ]
        },
        transaction
      });

      // Finally delete the user
      await db.User.destroy({
        where: { id: userIdNum },
        transaction
      });

      // Log the deletion activity
      await db.Activity.create({
        type: 'user_deleted',
        description: `User ${user.username} (${user.email}) was deleted by admin`,
        metadata: {
          deletedUserId: userIdNum,
          deletedUsername: user.username,
          deletedEmail: user.email,
          deletedBy: req.session.admin?.id || 'admin'
        }
      }, { transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: `User ${user.username} and all related data have been deleted successfully`
      });

    } catch (deleteError) {
      await transaction.rollback();
      throw deleteError;
    }

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Failed to delete user" });
  }
});


export default router;
