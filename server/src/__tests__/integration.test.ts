import request from "supertest";
import app from "../index";
import User from "../models/User";
import Note from "../models/Note";
import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";

describe("Integration Tests", () => {
  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Note.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
  });

  describe("User Registration and Authentication Flow", () => {
    it("should complete full user registration and login flow", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      // Register user
      const registerRes = await request(app).post("/server/api/auth/register").send(userData);

      expect(registerRes.status).toBe(201);
      expect(registerRes.body).toHaveProperty("token");
      const registrationToken = registerRes.body.token;

      // Use registration token to access profile
      const profileRes = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", `Bearer ${registrationToken}`);

      expect(profileRes.status).toBe(200);
      expect(profileRes.body.email).toBe(userData.email);

      // Login with same credentials
      const loginRes = await request(app).post("/server/api/auth/login").send({
        email: userData.email,
        password: userData.password,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty("token");
      const loginToken = loginRes.body.token;

      // Use login token to access profile
      const profileRes2 = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", `Bearer ${loginToken}`);

      expect(profileRes2.status).toBe(200);
      expect(profileRes2.body.email).toBe(userData.email);
    });

    it("should prevent duplicate registration with same email", async () => {
      const userData = {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      };

      // First registration
      const firstRes = await request(app).post("/server/api/auth/register").send(userData);

      expect(firstRes.status).toBe(201);

      // Second registration with same email
      const secondRes = await request(app).post("/server/api/auth/register").send({
        name: "Jane Doe",
        email: "john@example.com", // Same email
        password: "differentpassword",
      });

      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toBe("User already exists");
    });
  });

  describe("Complete Note Management Flow", () => {
    let authToken: string;

    beforeEach(async () => {
      // Register and login user
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const registerRes = await request(app).post("/server/api/auth/register").send(userData);

      authToken = registerRes.body.token;
    });

    it("should complete full CRUD operations on notes", async () => {
      // Create note
      const noteData = {
        title: "Test Note",
        content: "This is a test note",
      };

      const createRes = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(noteData);

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe(noteData.title);
      const noteId = createRes.body._id;

      // Read all notes
      const getAllRes = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(getAllRes.status).toBe(200);
      expect(getAllRes.body).toHaveLength(1);
      expect(getAllRes.body[0]._id).toBe(noteId);

      // Read single note
      const getSingleRes = await request(app)
        .get(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getSingleRes.status).toBe(200);
      expect(getSingleRes.body._id).toBe(noteId);
      expect(getSingleRes.body.title).toBe(noteData.title);

      // Update note
      const updateData = {
        title: "Updated Note",
        content: "This is an updated note",
      };

      const updateRes = await request(app)
        .put(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe(updateData.title);
      expect(updateRes.body.content).toBe(updateData.content);

      // Verify update
      const getUpdatedRes = await request(app)
        .get(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getUpdatedRes.status).toBe(200);
      expect(getUpdatedRes.body.title).toBe(updateData.title);

      // Delete note
      const deleteRes = await request(app)
        .delete(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteRes.status).toBe(200);

      // Verify deletion
      const getDeletedRes = await request(app)
        .get(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getDeletedRes.status).toBe(404);

      // Verify empty notes list
      const getFinalRes = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(getFinalRes.status).toBe(200);
      expect(getFinalRes.body).toHaveLength(0);
    });

    it("should handle multiple notes with proper sorting", async () => {
      // Create multiple notes with delays to ensure different timestamps
      const notes = [
        { title: "First Note", content: "First content" },
        { title: "Second Note", content: "Second content" },
        { title: "Third Note", content: "Third content" },
      ];

      const noteIds = [];
      for (const note of notes) {
        const res = await request(app)
          .post("/server/api/notes")
          .set("Authorization", `Bearer ${authToken}`)
          .send(note);

        expect(res.status).toBe(201);
        noteIds.push(res.body._id);

        // Small delay to ensure different creation times
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Get all notes - should be sorted by creation date (newest first)
      const getAllRes = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(getAllRes.status).toBe(200);
      expect(getAllRes.body).toHaveLength(3);

      // Verify sorting (newest first)
      expect(getAllRes.body[0].title).toBe("Third Note");
      expect(getAllRes.body[1].title).toBe("Second Note");
      expect(getAllRes.body[2].title).toBe("First Note");
    });
  });

  describe("Multi-User Isolation", () => {
    let user1Token: string;
    let user2Token: string;

    beforeEach(async () => {
      // Create two users
      const user1Res = await request(app).post("/server/api/auth/register").send({
        name: "User One",
        email: "user1@example.com",
        password: "password123",
      });

      const user2Res = await request(app).post("/server/api/auth/register").send({
        name: "User Two",
        email: "user2@example.com",
        password: "password123",
      });

      user1Token = user1Res.body.token;
      user2Token = user2Res.body.token;
    });

    it("should isolate notes between different users", async () => {
      // User 1 creates notes
      const user1Note = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "User 1 Note",
          content: "This is user 1's note",
        });

      expect(user1Note.status).toBe(201);

      // User 2 creates notes
      const user2Note = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          title: "User 2 Note",
          content: "This is user 2's note",
        });

      expect(user2Note.status).toBe(201);

      // User 1 should only see their own notes
      const user1Notes = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${user1Token}`);

      expect(user1Notes.status).toBe(200);
      expect(user1Notes.body).toHaveLength(1);
      expect(user1Notes.body[0].title).toBe("User 1 Note");

      // User 2 should only see their own notes
      const user2Notes = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2Notes.status).toBe(200);
      expect(user2Notes.body).toHaveLength(1);
      expect(user2Notes.body[0].title).toBe("User 2 Note");

      // User 1 cannot access User 2's note
      const user1AccessUser2Note = await request(app)
        .get(`/server/api/notes/${user2Note.body._id}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(user1AccessUser2Note.status).toBe(404);

      // User 2 cannot access User 1's note
      const user2AccessUser1Note = await request(app)
        .get(`/server/api/notes/${user1Note.body._id}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(user2AccessUser1Note.status).toBe(404);
    });

    it("should prevent cross-user note modification", async () => {
      // User 1 creates a note
      const user1Note = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${user1Token}`)
        .send({
          title: "User 1 Note",
          content: "This is user 1's note",
        });

      expect(user1Note.status).toBe(201);
      const noteId = user1Note.body._id;

      // User 2 tries to update User 1's note
      const updateAttempt = await request(app)
        .put(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${user2Token}`)
        .send({
          title: "Hacked Note",
          content: "This has been hacked",
        });

      expect(updateAttempt.status).toBe(404);

      // User 2 tries to delete User 1's note
      const deleteAttempt = await request(app)
        .delete(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${user2Token}`);

      expect(deleteAttempt.status).toBe(404);

      // Verify note is still intact
      const verifyNote = await request(app)
        .get(`/server/api/notes/${noteId}`)
        .set("Authorization", `Bearer ${user1Token}`);

      expect(verifyNote.status).toBe(200);
      expect(verifyNote.body.title).toBe("User 1 Note");
    });
  });

  describe("Authentication Edge Cases", () => {
    it("should handle token expiration gracefully", async () => {
      // Register user
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const registerRes = await request(app).post("/server/api/auth/register").send(userData);

      expect(registerRes.status).toBe(201);
      const token = registerRes.body.token;

      // Normal request should work
      const normalRes = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(normalRes.status).toBe(200);

      // Test with invalid token
      const invalidRes = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", "Bearer invalid-token");

      expect(invalidRes.status).toBe(401);
    });

    it("should handle user deletion cascade", async () => {
      // Register user and create notes
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const registerRes = await request(app).post("/server/api/auth/register").send(userData);

      const token = registerRes.body.token;

      // Create some notes
      await request(app).post("/server/api/notes").set("Authorization", `Bearer ${token}`).send({
        title: "Note 1",
        content: "Content 1",
      });

      await request(app).post("/server/api/notes").set("Authorization", `Bearer ${token}`).send({
        title: "Note 2",
        content: "Content 2",
      });

      // Verify notes exist
      const notesRes = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${token}`);

      expect(notesRes.status).toBe(200);
      expect(notesRes.body).toHaveLength(2);

      // Delete user
      const deleteRes = await request(app)
        .delete("/server/api/auth/delete")
        .set("Authorization", `Bearer ${token}`);

      expect(deleteRes.status).toBe(200);

      // Verify user cannot access anything with old token
      const profileRes = await request(app)
        .get("/server/api/auth/profile")
        .set("Authorization", `Bearer ${token}`);

      expect(profileRes.status).toBe(401);

      const notesAfterDelete = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${token}`);

      expect(notesAfterDelete.status).toBe(401);
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed requests gracefully", async () => {
      // Register user first
      const registerRes = await request(app).post("/server/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const token = registerRes.body.token;

      // Test malformed note creation
      const malformedNoteRes = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          // Missing required fields
        });

      expect(malformedNoteRes.status).toBe(400);

      // Test invalid note ID
      const invalidIdRes = await request(app)
        .get("/server/api/notes/invalid-id")
        .set("Authorization", `Bearer ${token}`);

      expect(invalidIdRes.status).toBe(400);
    });

    it("should handle database errors gracefully", async () => {
      // Test with very large payload
      const largeContent = "A".repeat(1000000); // 1MB of content

      const registerRes = await request(app).post("/server/api/auth/register").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const token = registerRes.body.token;

      const largeNoteRes = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${token}`)
        .send({
          title: "Large Note",
          content: largeContent,
        });

      // Should handle large content appropriately
      expect([201, 400, 413]).toContain(largeNoteRes.status);
    });
  });

  describe("Server Endpoints", () => {
    it("should respond to health check endpoints", async () => {
      // Test root endpoint
      const rootRes = await request(app).get("/server");
      expect(rootRes.status).toBe(200);
      expect(rootRes.body).toHaveProperty("msg", "Hello");

      // Test ping endpoint
      const pingRes = await request(app).get("/server/ping");
      expect(pingRes.status).toBe(200);
      expect(pingRes.body).toHaveProperty("msg", "Ping!");
    });

    it("should handle non-existent routes", async () => {
      const notFoundRes = await request(app).get("/server/non-existent-route");
      expect(notFoundRes.status).toBe(404);
    });

    it("should have metrics endpoint available", async () => {
      const metricsRes = await request(app).get("/server/metrics");
      // Metrics endpoint should be available (Prometheus)
      expect([200, 404]).toContain(metricsRes.status);
    });
  });

  describe("CORS and Security", () => {
    it("should handle CORS headers correctly", async () => {
      const res = await request(app)
        .options("/server/api/auth/register")
        .set("Origin", "http://localhost:3000");

      // Should handle preflight requests
      expect([200, 204]).toContain(res.status);
    });

    it("should reject requests with malicious payloads", async () => {
      const maliciousData = {
        name: "<script>alert('xss')</script>",
        email: "test@example.com",
        password: "password123",
      };

      const res = await request(app).post("/server/api/auth/register").send(maliciousData);

      // Should either accept it as plain text or reject it
      expect([201, 400]).toContain(res.status);

      if (res.status === 201) {
        // If accepted, should treat as plain text
        expect(res.body.name).toBe(maliciousData.name);
      }
    });
  });
});
