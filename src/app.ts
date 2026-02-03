import express from "express";
import authRoutes from "./routes/auth.routes.js";

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Mount the Auth routes
// All routes in authRoutes will now start with /api/auth
app.use("/api/auth", authRoutes);

export default app;
