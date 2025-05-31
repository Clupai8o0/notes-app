import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

interface AuthRequest extends Request {
  user?: IUser;
}

// Generate JWT Token
const generateToken = (id: string): string => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id as string),
      });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const { email, password } = req.body;
    // eslint-disable-next-line no-console
    console.log("Login controller - email:", email); // Debug log

    const user = await User.findOne({ email });
    // eslint-disable-next-line no-console
    console.log("User found:", user ? "Yes" : "No"); // Debug log

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    // eslint-disable-next-line no-console
    console.log("Password match:", isMatch ? "Yes" : "No"); // Debug log

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "30d",
    });
    // eslint-disable-next-line no-console
    console.log("Generated token:", token); // Debug log

    // Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };
    // eslint-disable-next-line no-console
    console.log("Cookie options:", cookieOptions); // Debug log

    // Set the token in a cookie
    res.cookie("token", token, cookieOptions);
    // eslint-disable-next-line no-console
    console.log("Cookie set in response"); // Debug log

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Login controller error:", error); // Debug log
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const user = await User.findById(req.user?._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};

// @desc    Delete user
// @route   DELETE /api/auth/delete
// @access  Private
export const deleteUser = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    res.status(400).json({ message: errorMessage });
  }
};
