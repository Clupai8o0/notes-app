// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

// Set test environment variables before any imports
process.env.NODE_ENV = "test";
// Keep the existing MONGODB_URI but change the database name to notes-test
const originalUri = process.env.MONGODB_URI;
if (originalUri) {
	// Replace the database name in the URI with notes-test
	process.env.MONGODB_URI = originalUri.replace(/\/([^/]+)$/, '/notes-test');
}
process.env.JWT_SECRET = "test-secret-key";

import mongoose from "mongoose";
import { beforeAll, afterAll } from "@jest/globals";

export {}

beforeAll(async () => {
	try {
		// Connect to test database
		await mongoose.connect(process.env.MONGODB_URI!);
		console.log("Test database connected successfully");
	} catch (error) {
		console.error("Test database connection error:", error);
		process.exit(1);
	}
});

afterAll(async () => {
	try {
		// Clean up database and close connection
		if (mongoose.connection.readyState === 1) {
			await mongoose.connection.dropDatabase();
		}
		// Close all connections
		await Promise.all(mongoose.connections.map(conn => conn.close()));
		await mongoose.disconnect();
		console.log("Test database connection closed");
	} catch (error) {
		console.error("Error closing test database connection:", error);
		process.exit(1);
	}
});
