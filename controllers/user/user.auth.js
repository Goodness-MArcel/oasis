import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import crypto from "crypto";
import { validationResult } from "express-validator";
import db from "../../models/index.js";
import { Op } from "sequelize";

const { User } = db;

// Generate a safe username from full name or email local part
function deriveUsername(fullName, email) {
	const fallback = (email || "user").split("@")[0] || "user";
	const base = (fullName || fallback)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, " ")
		.trim()
		.replace(/\s+/g, "-") || fallback;
	return base.slice(0, 40);
}

export async function registerUser(req, res) {
	const errors = validationResult(req);
	const { fullName, email, password, passwordConfirm } = req.body;

    console.log(req.body);

	const renderWithErrors = (errs) =>
		res.status(400).render("pages/signup", {
			title: "Create Your Account",
			description: "Sign up for an Integrated Oasis learner account.",
			pageStyles: "auth.css",
			pageScript: "auth.js",
			errors: errs,
			old: { fullName, email },
		});

	if (!errors.isEmpty()) {
		return renderWithErrors(errors.array());
	}

	if (password !== passwordConfirm) {
		return renderWithErrors([{ msg: "Passwords do not match" }]);
	}

	// Defensive server-side strength check (letters, numbers, special chars, min 8)
	const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
	if (!pwRegex.test(password)) {
		return renderWithErrors([{ msg: "Password must be at least 8 characters and include letters, numbers, and special characters" }]);
	}

	try {
		// Check duplicates
		const existing = await User.findOne({ where: { email } });
		if (existing) {
			return renderWithErrors([{ msg: "An account with this email already exists" }]);
		}

		let username = deriveUsername(fullName, email);

		// Ensure username uniqueness by appending a suffix if needed
		let suffix = 1;
		while (await User.findOne({ where: { username } })) {
			username = `${deriveUsername(fullName, email)}-${suffix++}`.slice(0, 50);
		}

		const hashed = await bcrypt.hash(password, 10);

		const newUser = await User.create({
			username,
			email,
			password: hashed,
			role: "student",
		});

		// Log user signup activity
		try {
			const db = await import("../../models/index.js");
			await db.default.Activity.create({
				type: 'user_signup',
				description: `New user ${username} (${email}) registered`,
				metadata: {
					userId: newUser.id,
					username,
					email
				}
			});
		} catch (activityErr) {
			console.error('Failed to log user signup activity:', activityErr);
			// Don't fail registration if activity logging fails
		}

		// Send welcome email (best-effort; do not block signup on mail errors)
		(async function sendWelcome() {
			try {
				// Use Gmail SMTP if not otherwise configured
				const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
				const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
				const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;

				const user = process.env.GMAIL_USER;
				const pass = process.env.APP_PASSWORD;
				if (!user || !pass) return; // no credentials

				const transporter = nodemailer.createTransport({
					host: smtpHost,
					port: smtpPort,
					secure: smtpSecure,
					auth: { user, pass },
				});

				const from = process.env.EMAIL_FROM || `Integrated Oasis <${user}>`;
				const subject = 'Welcome to Integrated Oasis';
				const appUrl = process.env.APP_URL || '';

				// Render email template
				const templatePath = path.join(process.cwd(), 'views', 'emails', 'welcome.ejs');
				let html = '';
				try {
					html = await ejs.renderFile(templatePath, { fullName, email, appUrl });
				} catch (tplErr) {
					// fallback to basic html
					html = `<p>Hi ${fullName || ''},</p><p>Welcome to Integrated Oasis — your account has been created. Log in at ${appUrl || '/auth'} to get started.</p>`;
				}

				const text = `Hi ${fullName || ''},\n\nWelcome to Integrated Oasis — your account has been created. Log in at ${appUrl || '/auth'} to get started.\n\nThanks,\nThe Oasis team`;

				await transporter.sendMail({ from, to: email, subject, text, html });
			} catch (mailErr) {
				console.error('Welcome email failed:', mailErr);
			}
		})();

		req.flash("success", "Account created successfully. Please log in.");
		return res.redirect("/auth");
	} catch (err) {
		console.error("Error registering user", err);
		return renderWithErrors([{ msg: "Something went wrong. Please try again." }]);
	}
}

export async function loginUser(req, res) {
	const errors = validationResult(req);
	const { email, password } = req.body;

	const renderWithErrors = (errs) =>
		res.status(400).render("pages/auth", {
			title: "Login or Sign Up",
			description: "Access your Integrated Oasis learner account or create a new one.",
			pageStyles: "auth.css",
			pageScript: "auth.js",
			errors: errs,
			old: { email },
		});

	if (!errors.isEmpty()) {
		return renderWithErrors(errors.array());
	}

	try {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			return renderWithErrors([{ msg: "Invalid email or password" }]);
		}

		const matches = await bcrypt.compare(password, user.password);
		if (!matches) {
			return renderWithErrors([{ msg: "Invalid email or password" }]);
		}

		// Issue JWT and store in httpOnly cookie
		const payload = {
			id: user.id,
			email: user.email,
			username: user.username,
			gender: user.gender,
			role: user.role,
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET || "oasis_jwt_secret", {
			expiresIn: "7d",
		});

		res.cookie("user_token", token, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		req.flash("success", "Logged in successfully.");
		return res.redirect("/user/dashboard");
	} catch (err) {
		console.error("Error logging in user", err);
		return renderWithErrors([{ msg: "Something went wrong. Please try again." }]);
	}
}

export function logoutUser(req, res) {
	res.clearCookie("user_token");
	if (req.session) {
		req.session.user = null;
	}
	req.flash("success", "You have been logged out.");
	return res.redirect("/auth");
}

export async function updateUserProfile(req, res) {
	const authUser = req.user;
	if (!authUser || !authUser.id) {
		req.flash("error", "Session expired. Please log in again.");
		return res.redirect("/auth");
	}

	let { username, email, gender } = req.body;
	username = (username || "").trim();
	email = (email || "").trim();
	gender = (gender || "").trim();

	if (!username || !email) {
		req.flash("error", "Username and email are required.");
		return res.redirect("/user/profile");
	}

	try {
		// Check for email taken by another user
		const existing = await User.findOne({
			where: {
				email,
				id: { [Op.ne]: authUser.id },
			},
		});
		if (existing) {
			req.flash("error", "That email is already in use by another account.");
			return res.redirect("/user/profile");
		}

		const user = await User.findByPk(authUser.id);
		if (!user) {
			req.flash("error", "User not found.");
			return res.redirect("/auth");
		}

		user.username = username;
		user.email = email;
		user.gender = gender || null;
		await user.save();

		// Re-issue JWT with updated data
		const payload = {
			id: user.id,
			email: user.email,
			username: user.username,
			gender: user.gender,
			role: user.role,
		};

		const token = jwt.sign(payload, process.env.JWT_SECRET || "oasis_jwt_secret", {
			expiresIn: "7d",
		});

		res.cookie("user_token", token, {
			httpOnly: true,
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		req.flash("success", "Profile updated successfully.");
		return res.redirect("/user/profile");
	} catch (err) {
		console.error("Error updating user profile", err);
		req.flash("error", "Could not update profile. Please try again.");
		return res.redirect("/user/profile");
	}
}

export async function forgotPassword(req, res) {
	const errors = validationResult(req);
	const { email } = req.body;

	const renderWithErrors = (errs) =>
		res.status(400).render("pages/forgot-password", {
			title: "Forgot Password",
			description: "Reset your Integrated Oasis account password.",
			pageStyles: "auth.css",
			pageScript: "auth.js",
			errors: errs,
			old: { email },
		});

	if (!errors.isEmpty()) {
		return renderWithErrors(errors.array());
	}

	try {
		const user = await User.findOne({ where: { email } });
		if (!user) {
			// Don't reveal if email exists or not for security
			req.flash("success", "If an account with that email exists, we've sent a password reset link.");
			return res.redirect("/auth");
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(32).toString('hex');
		const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		// Save token to user
		await user.update({
			resetToken,
			resetTokenExpires
		});

		// Send reset email
		try {
			const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
			const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
			const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true;

			const userEmail = process.env.GMAIL_USER;
			const pass = process.env.APP_PASSWORD;
			if (!userEmail || !pass) {
				console.error('Email credentials not configured');
				req.flash("error", "Email service is not configured. Please contact support.");
				return res.redirect("/auth");
			}

			const transporter = nodemailer.createTransport({
				host: smtpHost,
				port: smtpPort,
				secure: smtpSecure,
				auth: { user: userEmail, pass },
			});

			const from = process.env.EMAIL_FROM || `Integrated Oasis <${userEmail}>`;
			const subject = 'Password Reset - Integrated Oasis';
			const appUrl = process.env.APP_URL || 'http://localhost:3000';
			const resetUrl = `${appUrl}/reset-password/${resetToken}`;

			// Render email template
			const templatePath = path.join(process.cwd(), 'views', 'emails', 'password-reset.ejs');
			let html = '';
			try {
				html = await ejs.renderFile(templatePath, {
					fullName: user.username,
					email: user.email,
					resetUrl,
					appUrl
				});
			} catch (tplErr) {
				// fallback to basic html
				html = `<p>Hi ${user.username},</p><p>You requested a password reset for your Integrated Oasis account.</p><p>Click here to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 1 hour.</p><p>If you didn't request this, please ignore this email.</p>`;
			}

			const text = `Hi ${user.username},\n\nYou requested a password reset for your Integrated Oasis account.\n\nReset your password here: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nThanks,\nThe Oasis team`;

			await transporter.sendMail({ from, to: email, subject, text, html });

			req.flash("success", "If an account with that email exists, we've sent a password reset link.");
			return res.redirect("/auth");

		} catch (mailErr) {
			console.error('Password reset email failed:', mailErr);
			req.flash("error", "Failed to send reset email. Please try again.");
			return res.redirect("/forgot-password");
		}

	} catch (err) {
		console.error("Error processing forgot password", err);
		return renderWithErrors([{ msg: "Something went wrong. Please try again." }]);
	}
}

export async function resetPassword(req, res) {
	const errors = validationResult(req);
	const { token, password, passwordConfirm } = req.body;

	const renderWithErrors = (errs) =>
		res.status(400).render("pages/reset-password", {
			title: "Reset Password",
			description: "Enter your new password.",
			pageStyles: "auth.css",
			pageScript: "auth.js",
			token,
			errors: errs,
		});

	if (!errors.isEmpty()) {
		return renderWithErrors(errors.array());
	}

	if (password !== passwordConfirm) {
		return renderWithErrors([{ msg: "Passwords do not match" }]);
	}

	try {
		// Find user with valid reset token
		const user = await User.findOne({
			where: {
				resetToken: token,
				resetTokenExpires: {
					[Op.gt]: new Date()
				}
			}
		});

		if (!user) {
			return renderWithErrors([{ msg: "Invalid or expired reset token" }]);
		}

		// Hash new password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Update user password and clear reset token
		await user.update({
			password: hashedPassword,
			resetToken: null,
			resetTokenExpires: null
		});

		req.flash("success", "Password reset successfully. Please log in with your new password.");
		return res.redirect("/auth");

	} catch (err) {
		console.error("Error resetting password", err);
		return renderWithErrors([{ msg: "Something went wrong. Please try again." }]);
	}
}
