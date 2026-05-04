import type { Request, Response } from "express";
import * as AuthService from "../services/auth.service.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body;

    // Basic validation: Only allow SYSTEM_ADMIN, SELLER, CLIENT for public signup
    if (!["SYSTEM_ADMIN", "SELLER", "CLIENT"].includes(role)) {
      return res
        .status(400)
        .json({ message: "Invalid role for public registration" });
    }

    const user = await AuthService.registerUser(
      email,
      password,
      fullName,
      role,
    );

    res.status(201).json({
      message: "User registered. Please check your email for the OTP.",
      userId: user.id,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const verifyAccount = async (req: Request, res: Response) => {
  try {
    const { userId, code } = req.body;
    const result = await AuthService.verifyOTP(userId, code);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginUser(email, password);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: error.message });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshSession(refreshToken);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(401).json({ message: "Session expired, please login again" });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // Later we will get this from the Auth Middleware
    await AuthService.logoutUser(userId);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createWorker = async (req: AuthRequest, res: Response) => {
  try {
    const { email, fullName, role } = req.body;
    const adminEnterpriseId = req.user!.enterpriseId;

    if (!adminEnterpriseId) {
      return res
        .status(400)
        .json({ message: "Admin must have an enterprise to create workers" });
    }

    if (!["DRIVER", "DISPATCHER"].includes(role)) {
      return res.status(400).json({ message: "Invalid worker role" });
    }

    // Update service call to pass the enterpriseId
    const { worker, tempPassword } = await AuthService.createWorkerAccount(
      email,
      fullName,
      role,
      adminEnterpriseId, // Pass this instead of just adminId
    );

    res.status(201).json({
      message: `Worker account created for ${worker.fullName}`,
      worker: { id: worker.id, email: worker.email, role: worker.role },
      temporaryPassword: tempPassword,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    await AuthService.forgotPassword(req.body.email);
    res.status(200).json({ message: "Reset code sent to your email" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    await AuthService.resetPassword(email, code, newPassword);
    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const setupEnterprise = async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const userId = req.user!.id;

    if (!name) {
      return res.status(400).json({ message: "Enterprise name is required" });
    }

    const result = await AuthService.linkEnterpriseToAdmin(userId, name);

    res.status(201).json({
      message: "Enterprise created and linked successfully",
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
