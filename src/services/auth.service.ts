import { UserRole, VerificationType } from '@prisma/client';
import prisma from '../config/db.js';

import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util.js';
import { hashPassword, comparePassword } from '../utils/password.util.js';
import { generateOTP } from '../utils/otp.util.js';
import jwt from 'jsonwebtoken';
import * as MailService from './mail.service.js';
import type { JwtPayload } from 'jsonwebtoken';

const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_456';

interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  role: string; // whatever type your role is, e.g. 'admin' | 'user'
}

export const registerUser = async (
  email: string,
  pass: string,
  fullName: string,
  role: UserRole,
) => {
  // 1. Check existence
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  // 2. Hash Password
  const hashedPassword = await hashPassword(pass);

  // 3. Database Transaction: Create User + Create OTP
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        isVerified: false,
      },
    });

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 Mins

    await tx.verification.create({
      data: {
        code: otp,
        type: VerificationType.REGISTRATION,
        expiresAt,
        userId: user.id,
      },
    });

    // 4. Send Email (In production, this should be an async queue)
    await MailService.sendVerificationEmail(email, otp);

    return user;
  });
};

export const verifyOTP = async (userId: string, code: string) => {
  const verification = await prisma.verification.findFirst({
    where: {
      userId,
      code,
      type: VerificationType.REGISTRATION,
    },
  });

  if (!verification) throw new Error('Invalid verification code');

  if (new Date() > verification.expiresAt) {
    throw new Error('Verification code has expired');
  }

  // Use a transaction to ensure both steps happen or none
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    }),
    prisma.verification.delete({
      where: { id: verification.id },
    }),
  ]);

  return { message: 'Account verified successfully' };
};

export const loginUser = async (email: string, pass: string) => {
  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error('Invalid credentials');

  // 2. Check if verified
  if (!user.isVerified) {
    throw new Error('Please verify your email before logging in');
  }

  // 3. Verify password
  const isMatch = await comparePassword(pass, user.password);
  if (!isMatch) throw new Error('Invalid credentials');

  // 4. Generate Tokens
  // We include enterpriseId in the payload so the Middleware can
  // extract it without hitting the database on every request.
  const payload = {
    sub: user.id,
    role: user.role,
    enterpriseId: user.enterpriseId,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 5. Save Refresh Token to DB for session management
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // 6. Return payload
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      enterpriseId: user.enterpriseId, // Added here for Frontend redirection logic
      needsPasswordChange: user.needsPasswordChange,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshSession = async (token: string) => {
  // 1. Verify the refresh token
  const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;

  // 2. Check if user exists and if the token matches the one in DB
  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

  if (!user || user.refreshToken !== token) {
    throw new Error('Invalid or expired refresh token');
  }

  // 3. Generate new Access Token
  const newAccessToken = generateAccessToken({ sub: user.id, role: user.role });

  return { accessToken: newAccessToken };
};

export const logoutUser = async (userId: string) => {
  // Remove the refresh token from the DB so the session is truly dead
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  });
};

export const createWorkerAccount = async (
  email: string,
  fullName: string,
  role: UserRole,
  enterpriseId: string, // Changed from adminId to enterpriseId
) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('User already exists');

  const tempPassword = 'Welcome@' + Math.floor(1000 + Math.random() * 9000);
  const hashedPassword = await hashPassword(tempPassword);

  const worker = await prisma.user.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      role,
      enterpriseId, // The worker is now shielded by the same Enterprise ID
      isVerified: true,
      needsPasswordChange: true,
    },
  });

  return { worker, tempPassword };
};

export const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.verification.create({
    data: {
      code: otp,
      type: VerificationType.PASSWORD_RESET,
      expiresAt,
      userId: user.id,
    },
  });

  await MailService.sendResetPasswordEmail(email, otp);
};

export const resetPassword = async (email: string, code: string, newPass: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');

  const verification = await prisma.verification.findFirst({
    where: { userId: user.id, code, type: VerificationType.PASSWORD_RESET },
  });

  if (!verification || new Date() > verification.expiresAt) {
    throw new Error('Invalid or expired reset code');
  }

  const hashedPassword = await hashPassword(newPass);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        needsPasswordChange: false, // Reset the flag if it was an admin-created account
      },
    }),
    prisma.verification.delete({ where: { id: verification.id } }),
  ]);
};

export const linkEnterpriseToAdmin = async (userId: string, enterpriseName: string) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Create Enterprise
    const enterprise = await tx.enterprise.create({
      data: { name: enterpriseName },
    });

    // 2. Link Admin to it
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { enterpriseId: enterprise.id },
    });

    // 3. Generate NEW tokens because the enterpriseId has changed
    const payload = {
      sub: updatedUser.id,
      role: updatedUser.role,
      enterpriseId: enterprise.id,
    };
    return {
      enterprise,
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  });
};
