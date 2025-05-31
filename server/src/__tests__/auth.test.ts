import request from "supertest";
import mongoose from "mongoose";
import app from "../index";
import User from "../models/User";

import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

describe("Auth Endpoints", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "password123",
  };

  let authToken: string;

  beforeAll(async () => {
    // Use the shared MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database connection not established");
    }
  });

  beforeEach(async () => {
    // Clear the users collection before each test
    await User.deleteMany({});
  });

  describe("POST /server/api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app).post("/server/api/auth/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should not register a user with existing email", async () => {
      // First register
      await request(app).post("/server/api/auth/register").send(testUser);

      // Try to register again
      const res = await request(app).post("/server/api/auth/register").send(testUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message", "User already exists");
    });
  });

  describe("POST /server/api/auth/login", () => {
    beforeEach(async () => {
      // Register a user before login tests
      await request(app).post("/server/api/auth/register").send(testUser);
    });

    it("should login with correct credentials", async () => {
      const res = await request(app).post("/server/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body.email).toBe(testUser.email);
      authToken = res.body.token;
    });

    it("should not login with incorrect password", async () => {
      const res = await request(app).post("/server/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid credentials");
    });
  });

  describe("GET /server/api/auth/profile", () => {
    beforeEach(async () => {
      // Register and login before profile tests
      const registerRes = await request(app).post("/server/api/auth/register").send(testUser);
      authToken = registerRes.body.token;
    });

    it("should get user profile with valid token in Authorization header", async () => {
      const res = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(testUser.email);
      expect(res.body.name).toBe(testUser.name);
      expect(res.body).not.toHaveProperty("password");
    });

    it("should not get profile without token", async () => {
      const res = await request(app).get("/server/api/auth/profile");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty(
        "message",
        "Not authorized to access this route - No token found"
      );
    });

    it("should not get profile with invalid token", async () => {
      const res = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid token");
    });
  });

  describe("DELETE /server/api/auth/delete", () => {
    beforeEach(async () => {
      // Register and login before delete tests
      const registerRes = await request(app).post("/server/api/auth/register").send(testUser);
      authToken = registerRes.body.token;
    });

    it("should delete user with valid token in Authorization header", async () => {
      const res = await request(app)
        .delete("/server/api/auth/delete")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "User deleted successfully");

      // Verify user is deleted
      const user = await User.findOne({ email: testUser.email });
      expect(user).toBeNull();
    });

    it("should not delete user without token", async () => {
      const res = await request(app).delete("/server/api/auth/delete");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty(
        "message",
        "Not authorized to access this route - No token found"
      );
    });

    it("should not delete user with invalid token", async () => {
      const res = await request(app)
        .delete("/server/api/auth/delete")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid token");
    });
  });
});
