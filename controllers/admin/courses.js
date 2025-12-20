import db from '../../models/index.js';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

const uploadPublicPath = '/uploads/courses';

export async function listCourses(req, res) {
  try {
    const courses = await db.Course.findAll({ order: [['createdAt', 'DESC']] });
    return res.render('admin/ManageCourses', {
      layout: 'layouts/admin-main',
      title: 'Manage Courses',
      description: 'Create, edit, and manage courses.',
      pageStyles: 'admin.css',
      courses,
      error: res.locals.error && res.locals.error.length > 0 ? res.locals.error[0] : null,
      success: res.locals.success && res.locals.success.length > 0 ? res.locals.success[0] : null,
    });
  } catch (err) {
    console.error('Error fetching courses:', err);
    req.flash('error', 'Unable to fetch courses.');
    return res.render('admin/ManageCourses', { layout: 'layouts/admin-main', title: 'Manage Courses', pageStyles: 'admin.css', courses: [] });
  }
}

export async function createCourse(req, res) {
  try {
    const { title, category, badge, description, lessons, enrolled, instructorName } = req.body;

    // validation
    if (!title || !title.trim()) {
      req.flash('error', 'Course title is required.');
      return res.redirect('/admin/courses');
    }
    if (instructorName && instructorName.length > 255) {
      req.flash('error', 'Instructor name is too long.');
      return res.redirect('/admin/courses');
    }

    // handle uploaded file (req.file provided by multer middleware)
    let imagePath = null;
    if (req.file) {
      const filePath = req.file.path;
      try {
        // validate mimetype
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(req.file.mimetype)) {
          // remove uploaded file
          fs.unlinkSync(filePath);
          req.flash('error', 'Unsupported image format. Use JPG, PNG or WebP.');
          return res.redirect('/admin/courses');
        }

        // resize image to max width 1200 while preserving aspect ratio
        const tmpPath = `${filePath}.tmp`;
        await sharp(filePath).resize({ width: 1200 }).toFile(tmpPath);
        // replace original with resized
        fs.unlinkSync(filePath);
        fs.renameSync(tmpPath, filePath);

        imagePath = path.posix.join(uploadPublicPath, req.file.filename).replace(/\\/g, '/');
      } catch (imgErr) {
        console.error('Image processing error:', imgErr);
        // cleanup
        try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
        req.flash('error', 'Failed to process uploaded image.');
        return res.redirect('/admin/courses');
      }
    }

    // create course record
    await db.Course.create({
      title: title.trim(),
      category: category || null,
      badge: badge || null,
      image: imagePath,
      description: description || null,
      lessons: lessons ? parseInt(lessons, 10) : 0,
      enrolled: enrolled ? parseInt(enrolled, 10) : 0,
      instructorName: instructorName || null,
    });

    req.flash('success', 'Course created successfully.');
    return res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error creating course:', err);
    req.flash('error', 'Failed to create course.');
    return res.redirect('/admin/courses');
  }
}

export async function getCourse(req, res) {
  try {
    const id = req.params.id;
    const course = await db.Course.findByPk(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    return res.json({ course });
  } catch (err) {
    console.error('Error fetching course:', err);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
}

export async function updateCourse(req, res) {
  try {
    const id = req.params.id;
    const course = await db.Course.findByPk(id);
    if (!course) {
      req.flash('error', 'Course not found.');
      return res.redirect('/admin/courses');
    }

    const { title, category, badge, description, lessons, enrolled, instructorName, progress } = req.body;

    if (!title || !title.trim()) {
      req.flash('error', 'Course title is required.');
      return res.redirect('/admin/courses');
    }

    if (instructorName && instructorName.length > 255) {
      req.flash('error', 'Instructor name is too long.');
      return res.redirect('/admin/courses');
    }

    // handle uploaded new image
    if (req.file) {
      const filePath = req.file.path;
      try {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(req.file.mimetype)) {
          fs.unlinkSync(filePath);
          req.flash('error', 'Unsupported image format. Use JPG, PNG or WebP.');
          return res.redirect('/admin/courses');
        }

        const tmpPath = `${filePath}.tmp`;
        await sharp(filePath).resize({ width: 1200 }).toFile(tmpPath);
        fs.unlinkSync(filePath);
        fs.renameSync(tmpPath, filePath);

        // delete old image file if present
        if (course.image) {
          try {
            const oldName = path.basename(course.image);
            const oldPath = path.join(process.cwd(), 'public', 'uploads', 'courses', oldName);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          } catch (e) { console.warn('Failed to remove old image', e); }
        }

        course.image = path.posix.join(uploadPublicPath, req.file.filename).replace(/\\/g, '/');
      } catch (imgErr) {
        console.error('Image processing error:', imgErr);
        try { if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path); } catch (e) {}
        req.flash('error', 'Failed to process uploaded image.');
        return res.redirect('/admin/courses');
      }
    }

    // update fields
    course.title = title.trim();
    course.category = category || null;
    course.badge = badge || null;
    course.description = description || null;
    course.lessons = lessons ? parseInt(lessons, 10) : 0;
    course.enrolled = enrolled ? parseInt(enrolled, 10) : 0;
    course.instructorName = instructorName || null;
    if (typeof progress !== 'undefined') {
      const p = parseInt(progress, 10);
      course.progress = isNaN(p) ? 0 : Math.max(0, Math.min(100, p));
    }

    await course.save();
    req.flash('success', 'Course updated successfully.');
    return res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error updating course:', err);
    req.flash('error', 'Failed to update course.');
    return res.redirect('/admin/courses');
  }
}

export async function deleteCourse(req, res) {
  try {
    const id = req.params.id;
    const course = await db.Course.findByPk(id);
    if (!course) {
      req.flash('error', 'Course not found.');
      return res.redirect('/admin/courses');
    }

    // remove image file if exists
    if (course.image) {
      try {
        const name = path.basename(course.image);
        const p = path.join(process.cwd(), 'public', 'uploads', 'courses', name);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) { console.warn('Failed to remove image during delete', e); }
    }

    await course.destroy();
    req.flash('success', 'Course deleted successfully.');
    return res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error deleting course:', err);
    req.flash('error', 'Failed to delete course.');
    return res.redirect('/admin/courses');
  }
}
