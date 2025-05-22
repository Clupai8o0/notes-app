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
	let originalMongoUri: string;

	beforeAll(() => {
		// Store original URI
		originalMongoUri = process.env.MONGODB_URI!;
	});

	afterEach(async () => {
		// Reset to original URI
		process.env.MONGODB_URI = originalMongoUri;
	});

	it("should have environment variables loaded", () => {
		expect(process.env.MONGODB_URI).toBeDefined();
		expect(process.env.NODE_ENV).toBeDefined();
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
		const initialState = mongoose.connection.readyState;
		expect(initialState).toBe(1); // Should be connected from global setup
	});
});
