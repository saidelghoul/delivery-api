import { transporter } from '../config/mail.config.js';

export const sendVerificationEmail = async (to: string, code: string) => {
  const mailOptions = {
    from: '"Delivery App" <noreply@delivery.com>',
    to,
    subject: 'Verify your account',
    html: `
      <div style="font-family: sans-serif; text-align: center;">
        <h2>Welcome to Delivery App!</h2>
        <p>Use the code below to verify your account:</p>
        <h1 style="color: #4A90E2;">${code}</h1>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const sendResetPasswordEmail = async (to: string, code: string) => {
  const mailOptions = {
    from: '"Delivery App" <noreply@delivery.com>',
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: sans-serif;">
        <p>You requested a password reset. Use this code to continue:</p>
        <h2 style="color: #D0021B;">${code}</h2>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
