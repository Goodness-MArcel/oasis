import db from '../../models/index.js';
import bcrypt from 'bcrypt';

export async function createUser(req, res) {
  const t = await db.sequelize.transaction();
  try {
    const { username, email, courseId, gender, role, paymentMethod, paymentType, paymentAmount } = req.body;

    // Validate required fields
    if (!username || !email) {
      req.flash('error', 'Username and email are required.');
      return res.redirect('/admin/users');
    }

    // Check if user already exists
    const existingUser = await db.User.findOne({
      where: {
        [db.Sequelize.Op.or]: [
          { email: email },
          { username: username }
        ]
      }
    });

    if (existingUser) {
      req.flash('error', 'A user with this email or username already exists.');
      return res.redirect('/admin/users');
    }

    // Always validate payment fields if any are present
    let course = null;
    let coursePrice = 0;
    let actualPaymentAmount = paymentAmount && parseFloat(paymentAmount) > 0 ? parseFloat(paymentAmount) : 0;

    if (courseId && courseId !== '') {
      course = await db.Course.findByPk(parseInt(courseId));
      if (!course) {
        req.flash('error', 'Selected course not found.');
        return res.redirect('/admin/users');
      }
      coursePrice = course.price || 0;
    }

    // If any payment field is filled, validate all payment fields
    const paymentFieldsFilled = paymentMethod || paymentType || (paymentAmount && parseFloat(paymentAmount) > 0);
    if (paymentFieldsFilled) {
      // Course must be selected for payment
      if (!course) {
        req.flash('error', 'Please select a course when entering payment details.');
        return res.redirect('/admin/users');
      }
      // Validate payment type
      if (!paymentType || (paymentType !== 'full' && paymentType !== 'installment')) {
        req.flash('error', 'Please select a valid payment type (Full or Installment) when entering a payment amount.');
        return res.redirect('/admin/users');
      }
      // Validate payment amount
      if (!paymentAmount || isNaN(parseFloat(paymentAmount)) || parseFloat(paymentAmount) <= 0) {
        req.flash('error', 'Please enter a valid payment amount greater than $0.');
        return res.redirect('/admin/users');
      }
      // Basic sanity check - payment amount should not be ridiculously high
      if (actualPaymentAmount > coursePrice * 10) {
        req.flash('error', `Payment amount ($${actualPaymentAmount}) seems unreasonably high for a course priced at $${coursePrice}. Please verify the amount.`);
        return res.redirect('/admin/users');
      }
      // Payment amount is provided, validate it
      if (paymentType === 'full') {
        // Full payment - must pay exactly the course price
        if (actualPaymentAmount !== coursePrice) {
          req.flash('error', `Full payment amount ($${actualPaymentAmount}) must exactly equal the course price ($${coursePrice}). For partial payments, select "Installment" payment type.`);
          return res.redirect('/admin/users');
        }
      } else if (paymentType === 'installment') {
        // Validate installment payment amount
        if (actualPaymentAmount >= coursePrice) {
          req.flash('error', `Installment payment amount ($${actualPaymentAmount}) cannot be equal to or greater than the course price ($${coursePrice}). For full payment, select "Full" payment type.`);
          return res.redirect('/admin/users');
        }
        if (actualPaymentAmount <= 0) {
          req.flash('error', 'Installment payment amount must be greater than $0.');
          return res.redirect('/admin/users');
        }
      }
    }

    // All validations passed - now create the user
    // Generate a random password for the user
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // Create user
    const newUser = await db.User.create({
      username,
      email,
      password: hashedPassword,
      gender: gender || null,
      role: role || 'student'
    }, { transaction: t });

    let enrollment = null;
    let payment = null;

    // If course is selected, create enrollment and payment
    if (course) {
      // Create enrollment
      enrollment = await db.Enrollment.create({
        userId: newUser.id,
        courseId: parseInt(courseId),
        status: 'enrolled'
      }, { transaction: t });

      // Create payment record(s) if payment method is specified
      if (paymentMethod && paymentMethod !== '') {
        const coursePrice = course.price || 0;
        const actualPaymentAmount = paymentAmount && parseFloat(paymentAmount) > 0 ? parseFloat(paymentAmount) : coursePrice;

        if (paymentType === 'installment') {
          // Create only ONE payment record for the initial deposit
          // This represents the first payment made by the user
          payment = await db.Payment.create({
            userId: newUser.id,
            courseId: parseInt(courseId),
            enrollmentId: enrollment.id,
            amount: coursePrice, // Total course amount
            currency: 'USD',
            status: 'pending', // Overall payment status
            paymentMethod: paymentMethod,
            installment_number: 1,
            total_installments: null, // Will be determined by subsequent payments
            installment_amount: actualPaymentAmount, // Amount of this specific payment
            total_paid: actualPaymentAmount, // Cumulative total paid so far
            paid_date: new Date(),
            installment_status: 'paid', // This specific payment is paid
            balance_remaining: coursePrice - actualPaymentAmount, // Remaining balance
            metadata: {
              paymentType: 'installment',
              addedByAdmin: true,
              adminUserId: req.user?.id || null,
              totalCourseAmount: coursePrice,
              initialDeposit: actualPaymentAmount,
              customAmount: actualPaymentAmount !== coursePrice ? actualPaymentAmount : undefined,
              paymentHistory: [{
                amount: actualPaymentAmount,
                date: new Date().toISOString(),
                type: 'initial_deposit'
              }]
            }
          }, { transaction: t });
        } else {
          // Full payment - validation already passed above
          payment = await db.Payment.create({
            userId: newUser.id,
            courseId: parseInt(courseId),
            enrollmentId: enrollment.id,
            amount: coursePrice, // Total course amount (always the course price)
            currency: 'USD',
            status: 'completed',
            paymentMethod: paymentMethod,
            total_installments: 1,
            installment_amount: coursePrice, // Full payment amount
            total_paid: coursePrice, // Cumulative total paid (equals course price)
            paid_date: new Date(),
            installment_status: 'paid',
            balance_remaining: 0, // No remaining balance for full payment
            metadata: {
              paymentType: 'full',
              addedByAdmin: true,
              adminUserId: req.user?.id || null,
              fullPaymentAmount: coursePrice
            }
          }, { transaction: t });
        }
      }
    }

    await t.commit();
    req.flash('success', `User created successfully. Temporary password: ${randomPassword}`);
    res.redirect('/admin/users');
  } catch (err) {
    await t.rollback();
    console.error('Error creating user:', err);
    req.flash('error', 'Unable to create user.');
    res.redirect('/admin/users');
  }
}