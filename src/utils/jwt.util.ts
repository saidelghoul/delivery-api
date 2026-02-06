import jwt from "jsonwebtoken";

// Use type casting "as string" to satisfy TypeScript
const ACCESS_SECRET = (process.env.JWT_ACCESS_SECRET ||
  "access_secret_123") as string;
const REFRESH_SECRET = (process.env.JWT_REFRESH_SECRET ||
  "refresh_secret_456") as string;

export const generateAccessToken = (payload: object) => {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: object) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string) => {
  // Now TypeScript knows ACCESS_SECRET is a string
  return jwt.verify(token, ACCESS_SECRET);
};
