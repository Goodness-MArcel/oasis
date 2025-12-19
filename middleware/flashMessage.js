// flashMessage.js
// Middleware to set flash messages for use in views

export function flashMessage(req, res, next) {
  res.locals.error = req.flash('error');
  res.locals.success = req.flash('success');
  res.locals.info = req.flash('info');
  next();
}
