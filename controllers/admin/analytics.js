import db from "../../models/index.js";

export async function getAnalyticsPage(req, res) {
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

		// Traffic & engagement: last 7 days signups and enrollments
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
			if (signupsByDay[key] !== undefined) {
				signupsByDay[key] += 1;
			}
		});

		recentEnrollmentsRange.forEach((e) => {
			const key = e.createdAt.toISOString().slice(0, 10);
			if (enrollmentsByDay[key] !== undefined) {
				enrollmentsByDay[key] += 1;
			}
		});

		const trafficLabels = labels;
		const trafficSignups = labels.map((key) => signupsByDay[key] || 0);
		const trafficEnrollments = labels.map((key) => enrollmentsByDay[key] || 0);

		// Top performing courses based on enrollments and completion rate
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
			if (total >= 500 || completionRate >= 75) {
				statusLabel = "Growing";
			} else if (total >= 100 || completionRate >= 50) {
				statusLabel = "Stable";
			}

			return {
				id: course.id,
				title: course.title,
				category: course.category,
				totalEnrollments: total,
				completionRate,
				statusLabel,
			};
		});

		const topCourses = courseMetrics
			.sort((a, b) => b.totalEnrollments - a.totalEnrollments)
			.slice(0, 5);

		// Recent activity: latest enrollments
		const recentEnrollments = await db.Enrollment.findAll({
			include: [
				{
					model: db.User,
					as: "user",
					attributes: ["username", "email"],
				},
				{
					model: db.Course,
					as: "course",
					attributes: ["title"],
				},
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
		console.error("Error loading analytics page:", err);
		return res.render("admin/analytics", {
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
}

