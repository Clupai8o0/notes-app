import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../index";
import connectDB from "../config/db";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Server Endpoints", () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Create an in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    // Connect to the in-memory database
    await connectDB(mongoServer.getUri());
  });

  afterAll(async () => {
    // Clean up
    await mongoose.connection.close();
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Test the root endpoint
  describe("GET /server", () => {
    it("should return a hello message", async () => {
      const response = await request(app).get("/server");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ msg: "Hello" });
    });
  });

  // Test the ping endpoint
  describe("GET /server/ping", () => {
    it("should return ping message", async () => {
      const response = await request(app).get("/server/ping");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ msg: "Ping!" });
    });
  });
});
