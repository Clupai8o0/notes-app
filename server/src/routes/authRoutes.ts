import express, { Request, Response, RequestHandler } from "express";
import { register, login, getProfile, deleteUser } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/register", register as RequestHandler);

router.post("/login", (async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    // eslint-disable-next-line no-console
    console.log("Login attempt for email:", email); // Debug log

    const result = await login(req, res);
    // eslint-disable-next-line no-console
    console.log("Login result:", result); // Debug log

    // Check if token was set in cookie
    const tokenCookie = res.getHeader("Set-Cookie");
    // eslint-disable-next-line no-console
    console.log("Token cookie set:", tokenCookie); // Debug log

    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login route error:", error); // Debug log
    return res.status(500).json({ message: "Server error" });
  }
}) as RequestHandler);

router.get("/profile", protect as RequestHandler, getProfile as RequestHandler);
router.delete("/delete", protect as RequestHandler, deleteUser as RequestHandler);

export default router;
