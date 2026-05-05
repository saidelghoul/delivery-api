import type { Response } from "express";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import * as PackageService from "../services/package.service.js";

export const create = async (req: AuthRequest, res: Response) => {
  try {
    // enterpriseId now comes from the body (the Seller chose a provider)
    const { price, pickupAddress, clientAddress, priority, enterpriseId } =
      req.body;

    if (!enterpriseId) {
      return res
        .status(400)
        .json({ message: "You must select a delivery enterprise" });
    }

    const newPackage = await PackageService.createPackage({
      price,
      pickupAddress,
      clientAddress,
      priority,
      enterpriseId, // The "target" company
      sellerId: req.user!.id,
    });

    res.status(201).json(newPackage);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const packages = await PackageService.getEnterprisePackages(
      req.user!.enterpriseId!,
    );
    res.status(200).json(packages);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
