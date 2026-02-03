import { Router } from "express";
import * as AuthController from "../controllers/auth.controller.js";

const router = Router();

// Public registration for Admins, Sellers, and Clients
router.post("/register", AuthController.register);

// OTP Verification to activate the account
router.post("/verify", AuthController.verifyAccount);

export default router;
