import type { Request, Response } from "express";
import * as AuthService from "../services/auth.service.js";

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
