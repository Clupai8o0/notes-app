// Load environment variables first
import dotenv from "dotenv";
dotenv.config();

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll } from "@jest/globals";

let mongoServer: MongoMemoryServer;

// Export these for use in other test files
export const getMongoUri = (): string => mongoServer.getUri();
export const getMongoServer = (): MongoMemoryServer => mongoServer;

beforeAll(async () => {
  try {
    // Disconnect from any existing connections
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    // eslint-disable-next-line no-console
    console.log("Test database connected successfully");
  } catch (error) {
    // eslint-disable-next-line no-console
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
    await Promise.all(mongoose.connections.map((conn) => conn.close()));
    await mongoose.disconnect();
    // Stop the in-memory server
    await mongoServer.stop();
    // eslint-disable-next-line no-console
    console.log("Test database connection closed");
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error closing test database connection:", error);
    process.exit(1);
  }
});
