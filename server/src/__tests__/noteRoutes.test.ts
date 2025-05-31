import request from "supertest";
import mongoose from "mongoose";
import app from "../index";
import User from "../models/User";
import Note from "../models/Note";
import { generateToken } from "../utils/generateToken";
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";

describe("Note Routes", () => {
  let authToken: string;
  let testUser: any;
  let testNote: any;

  beforeAll(async () => {
    // Create a test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    // Generate token for the test user
    authToken = generateToken(testUser._id);

    // Create a test note
    testNote = await Note.create({
      userId: testUser._id,
      title: "Test Note",
      content: "This is a test note",
    });
  });

  afterAll(async () => {
    // Clean up test data
    await User.deleteMany({});
    await Note.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /server/api/notes", () => {
    it("should get all notes for authenticated user", async () => {
      const response = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty("title");
      expect(response.body[0]).toHaveProperty("content");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get("/server/api/notes");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /server/api/notes/:id", () => {
    it("should get a single note by id", async () => {
      const response = await request(app)
        .get(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(testNote.title);
      expect(response.body.content).toBe(testNote.content);
      expect(response.body.userId.toString()).toBe(testUser._id.toString());
    });

    it("should return 404 if note not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/server/api/notes/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Note not found");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).get(`/server/api/notes/${testNote._id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /server/api/notes", () => {
    it("should create a new note", async () => {
      const newNote = {
        title: "New Test Note",
        content: "This is a new test note",
      };

      const response = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(newNote);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      expect(response.body.title).toBe(newNote.title);
      expect(response.body.content).toBe(newNote.content);
      expect(response.body.userId.toString()).toBe(testUser._id.toString());
    });

    it("should return 400 if title is missing", async () => {
      const response = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ content: "Test content" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app)
        .post("/server/api/notes")
        .send({ title: "Test", content: "Test" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /server/api/notes/:id", () => {
    it("should update an existing note", async () => {
      const updates = {
        title: "Updated Test Note",
        content: "This is an updated test note",
      };

      const response = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.title).toBe(updates.title);
      expect(response.body.content).toBe(updates.content);
    });

    it("should return 404 if note not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/server/api/notes/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Test", content: "Test" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .send({ title: "Test", content: "Test" });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /server/api/notes/:id", () => {
    it("should delete an existing note", async () => {
      const response = await request(app)
        .delete(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");

      // Verify note is deleted
      const deletedNote = await Note.findById(testNote._id);
      expect(deletedNote).toBeNull();
    });

    it("should return 404 if note not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/server/api/notes/${fakeId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message");
    });

    it("should return 401 if not authenticated", async () => {
      const response = await request(app).delete(`/server/api/notes/${testNote._id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message");
    });
  });
});
