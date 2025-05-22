import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

interface AuthRequest extends Request {
	user?: any;
}

// Generate JWT Token
const generateToken = (id: string): string => {
	if (!process.env.JWT_SECRET) 
		throw new Error("JWT_SECRET is not defined");
	
	return jwt.sign({ id }, process.env.JWT_SECRET, {
		expiresIn: "30d",
	});
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response) => {
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
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response) => {
	try {
		const { email, password } = req.body;

		// Check for user email
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		// Check password
		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid email or password" });
		}

		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			token: generateToken(user._id as string),
		});
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req: AuthRequest, res: Response) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json(user);
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
};

// @desc    Delete user
// @route   DELETE /api/auth/delete
// @access  Private
export const deleteUser = async (req: AuthRequest, res: Response) => {
	try {
		const user = await User.findById(req.user._id);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		await user.deleteOne();
		res.status(200).json({ message: "User deleted successfully" });
	} catch (error: any) {
		res.status(400).json({ message: error.message });
	}
};
