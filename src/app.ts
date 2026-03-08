import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // Allow  Vite dev server
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Middleware to parse JSON
app.use(express.json());

// Mount the Auth routes
// All routes in authRoutes will now start with /api/auth
app.use("/api/auth", authRoutes);

export default app;
