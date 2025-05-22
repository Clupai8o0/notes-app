import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate environment variables on module import
const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async (): Promise<void> => {
	if (!MONGODB_URI) {
		throw new Error("MongoDB URI not defined in environment variables");
	}
	
	try {
		await mongoose.connect(MONGODB_URI);
		console.log("MongoDB connected successfully");
	} catch (error) {
		console.error("MongoDB connection error:", error);
		process.exit(1);
	}
};

export default connectDB;
