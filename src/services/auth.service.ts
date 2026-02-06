import { PrismaClient, UserRole, VerificationType } from "@prisma/client";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt.util.js";
import { hashPassword, comparePassword } from "../utils/password.util.js";
import { generateOTP } from "../utils/otp.util.js";
import { transporter } from "../config/mail.config.js";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret_456";

export const registerUser = async (
  email: string,
  pass: string,
  fullName: string,
  role: UserRole,
) => {
  // 1. Check existence
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User already exists");

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
    await transporter.sendMail({
      from: '"Delivery App" <noreply@delivery.com>',
      to: email,
      subject: "Verify your account",
      text: `Your verification code is: ${otp}`,
    });

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

  if (!verification) throw new Error("Invalid verification code");

  if (new Date() > verification.expiresAt) {
    throw new Error("Verification code has expired");
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

  return { message: "Account verified successfully" };
};

export const loginUser = async (email: string, pass: string) => {
  // 1. Find the user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid credentials");

  // 2. Check if verified
  if (!user.isVerified)
    throw new Error("Please verify your email before logging in");

  // 3. Verify password
  const isMatch = await comparePassword(pass, user.password);
  if (!isMatch) throw new Error("Invalid credentials");

  // 4. Generate Tokens
  const payload = { sub: user.id, role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // 5. Save Refresh Token to DB for session management
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken }, // In a real app, you might hash this too
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      needsPasswordChange: user.needsPasswordChange,
    },
    accessToken,
    refreshToken,
  };
};

export const refreshSession = async (token: string) => {
  // 1. Verify the refresh token
  const decoded = jwt.verify(token, REFRESH_SECRET) as any;

  // 2. Check if user exists and if the token matches the one in DB
  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

  if (!user || user.refreshToken !== token) {
    throw new Error("Invalid or expired refresh token");
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
  role: UserRole, // Limited to DRIVER or DISPATCHER in controller
  adminId: string,
) => {
  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("User with this email already exists");

  // 2. Set a temporary password (In a real app, you might email this or a reset link)
  const tempPassword = "Welcome@" + Math.floor(1000 + Math.random() * 9000);
  const hashedPassword = await hashPassword(tempPassword);

  // 3. Create the worker
  const worker = await prisma.user.create({
    data: {
      email,
      fullName,
      password: hashedPassword,
      role,
      isVerified: true, // Auto-verified by Admin
      needsPasswordChange: true, // Forces change on first login
    },
  });

  return { worker, tempPassword };
};
