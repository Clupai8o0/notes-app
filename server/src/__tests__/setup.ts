// Set test environment variables before any imports
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://admin:secret@localhost:27017/notes-test";
process.env.JWT_SECRET = "test-secret-key";

import mongoose from "mongoose";
import { beforeAll, afterAll } from "@jest/globals";

beforeAll(async () => {
	// Connect to test database
	await mongoose.connect(process.env.MONGODB_URI!);
});

afterAll(async () => {
	// Clean up database and close connection
	if (mongoose.connection.readyState === 1) {
		await mongoose.connection.dropDatabase();
		await mongoose.connection.close();
	}
});
