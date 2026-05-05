import type { Response, NextFunction } from "express";
import prisma from "../config/db.js";
import type { AuthRequest } from "./auth.middleware.js";

export const isOnboarded = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user;

    // 1. Check if enterpriseId exists in the JWT token payload
    if (!user?.enterpriseId) {
      return res.status(403).json({
        message: "Access denied. Please complete your enterprise setup first.",
      });
    }

    // 2. Database Verification: Ensure the enterprise hasn't been deleted
    const enterprise = await prisma.enterprise.findUnique({
      where: { id: user.enterpriseId },
      // Optional: select: { id: true, status: true } to keep it lightweight
    });

    if (!enterprise) {
      return res.status(404).json({
        message: "Enterprise profile not found. Please contact support.",
      });
    }

    // 3. Success - Move to the controller
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error during onboarding check.",
    });
  }
};
