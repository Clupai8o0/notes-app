import express, { RequestHandler } from "express";
import { register, login, getProfile, deleteUser } from "../controllers/authController";
import { protect } from "../middleware/auth";

const router = express.Router();

router.post("/register", register as RequestHandler);
router.post("/login", login as RequestHandler);
router.get("/profile", protect as RequestHandler, getProfile as RequestHandler);
router.delete("/delete", protect as RequestHandler, deleteUser as RequestHandler);

export default router;
