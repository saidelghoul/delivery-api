import { PackageStatus } from '@prisma/client';
import prisma from '../config/db.js';

export const createPackage = async (data: {
  price: number;
  pickupAddress: string;
  clientAddress: string;
  priority: 'NORMAL' | 'URGENT' | 'IMMEDIATE';
  sellerId: string;
  enterpriseId: string;
}) => {
  return await prisma.package.create({
    data: {
      price: data.price,
      pickupAddress: data.pickupAddress,
      clientAddress: data.clientAddress,
      priority: data.priority,
      sellerId: data.sellerId,
      enterpriseId: data.enterpriseId,
      status: PackageStatus.PENDING_PICKUP, // Initial state
    },
  });
};

export const getEnterprisePackages = async (enterpriseId: string) => {
  return await prisma.package.findMany({
    where: { enterpriseId },
    orderBy: { createdAt: 'desc' },
  });
};
