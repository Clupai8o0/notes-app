import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import prometheus from "express-prometheus-middleware";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import noteRoutes from "./routes/noteRoutes";

// load envs
dotenv.config();

const app = express();

// middlewares
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(
  prometheus({
    metricsPath: "/server/metrics",
    collectDefaultMetrics: true,
  })
);

// Routes
app.use("/server/api/auth", authRoutes);
app.use("/server/api/notes", noteRoutes);

app.get("/server", (req: Request, res: Response) => {
  res.json({ msg: "Hello" });
});

//! Test ping route
app.get("/server/ping", (req: Request, res: Response) => {
  // eslint-disable-next-line no-console
  console.log(`Ping received from ${req.ip}`);
  res.status(200).json({ msg: "Ping!" });
});

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// running the application
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(typeof PORT === "string" ? parseInt(PORT) : PORT, "0.0.0.0", () => {
    // eslint-disable-next-line no-console
    console.log(`The server is running port ${PORT}`);
  });
}

export default app;
