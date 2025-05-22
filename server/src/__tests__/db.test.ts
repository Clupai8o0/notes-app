import mongoose from "mongoose";
import connectDB from "../config/db";

import {
	describe,
	it,
	expect,
	beforeAll,
	afterEach,
	jest,
} from "@jest/globals";

describe("Database Connection", () => {
	beforeAll(async () => {
		// Ensure we're using the test database
		process.env.MONGODB_URI = "mongodb://admin:secret@localhost:27017/notes-app-test";
	});

	afterEach(async () => {
		// Close the connection after each test
		await mongoose.connection.close();
	});

	it("should have environment variables loaded", () => {
		console.log("Current MONGODB_URI:", process.env.MONGODB_URI);
		console.log("Current NODE_ENV:", process.env.NODE_ENV);
		expect(process.env.MONGODB_URI).toBeDefined();
		expect(process.env.NODE_ENV).toBeDefined();
	});

	it("should connect to MongoDB successfully", async () => {
		// Spy on console.log to verify connection message
		const consoleSpy = jest.spyOn(console, "log");

		await connectDB();

		expect(mongoose.connection.readyState).toBe(1); // 1 means connected
		expect(consoleSpy).toHaveBeenCalledWith("MongoDB connected successfully");

		consoleSpy.mockRestore();
	});

	it("should handle connection errors gracefully", async () => {
		// Spy on console.error and process.exit
		const consoleSpy = jest.spyOn(console, "error");
		const exitSpy = jest
			.spyOn(process, "exit")
			.mockImplementation(() => undefined as never);

		// Try to connect with invalid URI
		process.env.MONGODB_URI = "mongodb://invalid:27017/test";

		try {
			await connectDB();
		} catch (error) {
			expect(consoleSpy).toHaveBeenCalled();
			expect(exitSpy).toHaveBeenCalledWith(1);
		}

		consoleSpy.mockRestore();
		exitSpy.mockRestore();
	});

	it("should maintain connection state", async () => {
		await connectDB();
		const initialState = mongoose.connection.readyState;

		// Try to connect again
		await connectDB();
		const finalState = mongoose.connection.readyState;

		expect(finalState).toBe(initialState);
		expect(finalState).toBe(1); // Still connected
	});
});
