const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // e.g., your.email@gmail.com
    pass: process.env.EMAIL_PASS, // your App Password from Google
  },
});

// Send exam assignment email
exports.sendExamEmail = (toEmail, examTitle, dueDate) => {
  const mailOptions = {
    from: `"HR - Secure Exam System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: '📌 New Exam Assigned to You!',
    html: `<p>Hello,</p>
           <p>You have been assigned a new exam: <b>${examTitle}</b></p>
           <p><b>Due Date:</b> ${dueDate}</p>
           <p>Please log in to your portal to take the exam.</p>
           <p>- Team HR</p>`,
  };

  return transporter.sendMail(mailOptions);
};

// Send password reset email
exports.sendResetEmail = async (to, resetLink) => {
  const mailOptions = {
    from: `"Exam App" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: "Password Reset Request",
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link will expire in 1 hour.</p>`
  };

  return transporter.sendMail(mailOptions);
};
