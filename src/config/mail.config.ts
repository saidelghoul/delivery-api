import nodemailer from "nodemailer";

// This will create a "fake" mailbox for testing
export const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  auth: {
    user: process.env.MAIL_USER, // from ethereal.email
    pass: process.env.MAIL_PASS,
  },
});
