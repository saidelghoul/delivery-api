import { Router } from "express";
import * as AuthController from "../controllers/auth.controller.js";
import { restrictTo } from "../middlewares/role.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Public registration for Admins, Sellers, and Clients
router.post("/register", AuthController.register);

// OTP Verification to activate the account
router.post("/verify", AuthController.verifyAccount);

// Authentication
router.post("/login", AuthController.login);

// Refresh token
router.post("/refresh", AuthController.refresh);

//logout
router.post("/logout", AuthController.logout);

// Only logged-in Admins can reach this
router.post(
  "/create-worker",
  protect,
  restrictTo("SYSTEM_ADMIN"),
  AuthController.createWorker,
);
export default router;
