import { Router } from "express";
import * as PackageController from "../controllers/package.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { restrictTo } from "../middlewares/role.middleware.js";

const router = Router();

router.use(protect); // All package routes require login

router.post("/", restrictTo("SELLER"), PackageController.create);

router.get("/", restrictTo("SELLER", "DISPATCHER"), PackageController.getAll);

export default router;
