import { Request, Response } from "express";
import Note from "../models/Note";
import { IUser } from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

// @desc    Get all notes for authenticated user
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const notes = await Note.find({ userId: req.user?._id }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(500).json({ message: errorMessage });
  }
};

// @desc    Get a single note by ID
// @route   GET /api/notes/:id
// @access  Private
export const getNoteById = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(note);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};

// @desc    Create a new note
// @route   POST /api/notes
// @access  Private
export const createNote = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { title, content } = req.body;

    const note = await Note.create({
      userId: req.user?._id,
      title,
      content,
    });

    res.status(201).json(note);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};

// @desc    Update a note
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    const { title, content } = req.body;
    note.title = title || note.title;
    note.content = content || note.content;

    const updatedNote = await note.save();
    res.json(updatedNote);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user?._id,
    });

    if (!note) {
      return res.status(404).json({ message: "Note not found" });
    }

    await note.deleteOne();
    res.json({ message: "Note deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};
