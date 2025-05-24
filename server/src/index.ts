import express, { Request, Response } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";

// load envs
dotenv.config();

const app = express();

// middlewares
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({ msg: "Hello" });
});

//! Test ping route
app.get("/ping", (req: Request, res: Response) => {
  res.status(200).send("Ping!");
});

// Connect to MongoDB only if not in test environment
if (process.env.NODE_ENV !== "test") {
  connectDB();
}

// running the application
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(typeof PORT === "string" ? parseInt(PORT) : PORT, "0.0.0.0", () => {
    console.log(`The server is running port ${PORT}`);
  });
}

export default app;
