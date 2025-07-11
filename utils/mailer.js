const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
