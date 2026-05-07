// src/config/db.ts
import { PrismaClient } from '@prisma/client';

// Create a single instance of the client
const prisma = new PrismaClient();

export default prisma;
