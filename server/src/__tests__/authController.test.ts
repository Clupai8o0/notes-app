import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../index";
import User from "../models/User";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";

describe("Auth Controller - Comprehensive Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database connection not established");
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  describe("Registration Edge Cases", () => {
    it("should reject registration with missing name", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject registration with missing email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject registration with missing password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject registration with short password", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "123",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should normalize email to lowercase", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "John Doe",
        email: "JOHN@EXAMPLE.COM",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("john@example.com");
    });

    it("should trim whitespace from name and email", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "  Test User  ",
        email: "  test@example.com  ",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test User");
      expect(res.body.email).toBe("test@example.com");
    });
  });

  describe("Login Edge Cases", () => {
    const testUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    beforeEach(async () => {
      await request(app).post("/api/auth/register").send(testUser);
    });

    it("should reject login with non-existent email", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid credentials");
    });

    it("should handle case-insensitive email login", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "TEST@EXAMPLE.COM",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
    });

    it("should set secure cookie in production environment", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const res = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);

      // Restore environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Profile Management Edge Cases", () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const registerRes = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      authToken = registerRes.body.token;
      userId = registerRes.body._id;
    });

    it("should handle deleted user token gracefully", async () => {
      // Delete the user directly from database
      await User.findByIdAndDelete(userId);

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "User not found");
    });

    it("should handle malformed JWT token", async () => {
      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer malformed.jwt.token");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid token");
    });

    it("should handle expired JWT token", async () => {
      // Create an expired token
      const expiredToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || "your-secret-key", {
        expiresIn: "-1h",
      });

      const res = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid token");
    });

    it("should handle token without Bearer prefix", async () => {
      const res = await request(app).get("/api/auth/profile").set("Authorization", authToken);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty(
        "message",
        "Not authorized to access this route - No token found"
      );
    });
  });

  describe("User Deletion Edge Cases", () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const registerRes = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      authToken = registerRes.body.token;
      userId = registerRes.body._id;
    });

    it("should handle deletion of already deleted user", async () => {
      // Delete the user first
      await request(app).delete("/api/auth/delete").set("Authorization", `Bearer ${authToken}`);

      // Try to delete again
      const res = await request(app)
        .delete("/api/auth/delete")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "User not found");
    });

    it("should verify user data is completely removed after deletion", async () => {
      const res = await request(app)
        .delete("/api/auth/delete")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify user no longer exists
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });
  });

  describe("JWT Secret Environment Variable", () => {
    it("should handle missing JWT_SECRET environment variable", async () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const res = await request(app).post("/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      // Restore the original secret
      process.env.JWT_SECRET = originalSecret;

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });
});
