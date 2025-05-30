import express, { RequestHandler } from "express";
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  getNoteById,
} from "../controllers/noteController";
import { protect } from "../middleware/auth";

const router = express.Router();

// All routes are protected
router.use(protect as RequestHandler);

router.get("/", getNotes as RequestHandler);
router.get("/:id", getNoteById as RequestHandler);
router.post("/", createNote as RequestHandler);
router.put("/:id", updateNote as RequestHandler);
router.delete("/:id", deleteNote as RequestHandler);

export default router;
