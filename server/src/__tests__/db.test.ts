import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import connectDB from "../config/db";

import { describe, it, expect, beforeAll, afterAll, jest } from "@jest/globals";

describe("Database Connection", () => {
  let mongoServer: MongoMemoryServer;
  let originalNodeEnv: string | undefined;

  beforeAll(async () => {
    // Store original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV;
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    // Restore original NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
    // Clean up
    await mongoose.connection.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it("should connect to MongoDB successfully", async () => {
    // Set NODE_ENV to test
    process.env.NODE_ENV = "test";

    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await connectDB(mongoServer.getUri());

    // Verify connection state
    expect(mongoose.connection.readyState).toBe(1); // 1 means connected
    expect(mongoose.connection.name).toBeDefined();
  });

  it("should handle connection errors gracefully", async () => {
    // Spy on console.error and process.exit
    const consoleSpy = jest.spyOn(console, "error");
    const exitSpy = jest.spyOn(process, "exit").mockImplementation(() => undefined as never);

    // Try to connect with invalid URI
    try {
      await connectDB("mongodb://invalid:27017/test");
    } catch (error) {
      expect(consoleSpy).toHaveBeenCalled();
      expect(exitSpy).toHaveBeenCalledWith(1);
    }

    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("should maintain connection state", async () => {
    const uri = mongoServer.getUri();

    // Disconnect if already connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await connectDB(uri);
    const initialState = mongoose.connection.readyState;

    // Try to connect again
    await connectDB(uri);
    const finalState = mongoose.connection.readyState;

    expect(finalState).toBe(initialState);
    expect(finalState).toBe(1); // Still connected
  });
});
