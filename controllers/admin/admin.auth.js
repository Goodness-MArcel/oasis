import bcrypt from 'bcrypt';
import db from '../../models/index.js';
import jwt from 'jsonwebtoken';

// Admin login handler
export async function adminLogin(req, res) {
	const { email, password } = req.body;
	console.log('Admin login attempt for email:', req.body);
	try {
		// Find admin by email
		const admin = await db.Admin.findOne({ where: { email } });
		if (!admin) {
			req.flash('error', 'Invalid credentials.');
			return res.redirect('/admin/login');
		}
		// Compare password
		const match = await bcrypt.compare(password, admin.password);
		if (!match) {
			req.flash('error', 'Invalid credentials.');
			return res.redirect('/admin/login');
		}
		// Issue JWT
		const token = jwt.sign(
			{ id: admin.id, email: admin.email },
			process.env.JWT_SECRET || "oasis_jwt_secret",
			{ expiresIn: "1d" }
		);
		// Set cookie
		res.cookie("admin_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			maxAge: 24 * 60 * 60 * 1000 // 1 day
		});
		// Optionally set session for legacy code
		req.session.admin = { id: admin.id, email: admin.email };
		return res.redirect('/admin/dashboard');
	} catch (err) {
		console.error('Admin login error:', err);
		req.flash('error', 'Server error. Please try again.');
		return res.redirect('/admin/login');
	}
}
