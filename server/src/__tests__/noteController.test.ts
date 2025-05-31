import request from "supertest";
import mongoose from "mongoose";
import app from "../index";
import User from "../models/User";
import Note from "../models/Note";
import { generateToken } from "../utils/generateToken";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "@jest/globals";

describe("Note Controller - Comprehensive Tests", () => {
  let authToken: string;
  let testUser: any;
  let otherUser: any;
  let otherUserToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      throw new Error("Database connection not established");
    }
  });

  beforeEach(async () => {
    // Clean up
    await User.deleteMany({});
    await Note.deleteMany({});

    // Create test users
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    });

    otherUser = await User.create({
      name: "Other User",
      email: "other@example.com",
      password: "password123",
    });

    authToken = generateToken(testUser._id);
    otherUserToken = generateToken(otherUser._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
  });

  describe("Note Creation Edge Cases", () => {
    it("should reject note creation with empty title", async () => {
      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "",
          content: "Some content",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should reject note creation with empty content", async () => {
      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Title",
          content: "",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should handle very long title", async () => {
      const longTitle = "A".repeat(1000);
      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: longTitle,
          content: "Test content",
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(longTitle);
    });

    it("should handle very long content", async () => {
      const longContent = "A".repeat(10000);
      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Title",
          content: longContent,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(longContent);
    });

    it("should trim whitespace from title", async () => {
      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "  Test Title  ",
          content: "Test content",
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe("Test Title");
    });

    it("should preserve whitespace in content", async () => {
      const content = "  Line 1\n  Line 2  \n  Line 3  ";
      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Test Title",
          content: content,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(content);
    });

    it("should handle special characters in title and content", async () => {
      const specialTitle = "Test! @#$%^&*()_+ Title";
      const specialContent = "Content with émojis 🎉 and spéçial charaçters";

      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: specialTitle,
          content: specialContent,
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe(specialTitle);
      expect(res.body.content).toBe(specialContent);
    });
  });

  describe("Note Retrieval with Multiple Notes", () => {
    beforeEach(async () => {
      // Create multiple notes for test user
      const notes = [
        { title: "First Note", content: "First content" },
        { title: "Second Note", content: "Second content" },
        { title: "Third Note", content: "Third content" },
      ];

      for (const note of notes) {
        await Note.create({
          userId: testUser._id,
          title: note.title,
          content: note.content,
        });
      }

      // Create notes for other user (should not be visible)
      await Note.create({
        userId: otherUser._id,
        title: "Other User Note",
        content: "Other user content",
      });
    });

    it("should return notes sorted by creation date (newest first)", async () => {
      const res = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);

      // Check if sorted by creation date (newest first)
      const dates = res.body.map((note: any) => new Date(note.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeLessThanOrEqual(dates[i - 1]);
      }
    });

    it("should only return notes belonging to authenticated user", async () => {
      const res = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);

      // Verify all notes belong to test user
      res.body.forEach((note: any) => {
        expect(note.userId).toBe(testUser._id.toString());
      });
    });

    it("should return empty array for user with no notes", async () => {
      // Create a new user with no notes
      const newUser = await User.create({
        name: "New User",
        email: "new@example.com",
        password: "password123",
      });
      const newUserToken = generateToken((newUser as any)._id);

      const res = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${newUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("Note Access Control", () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        userId: testUser._id,
        title: "Test Note",
        content: "Test content",
      });
    });

    it("should prevent user from accessing other user's note", async () => {
      const res = await request(app)
        .get(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Note not found");
    });

    it("should prevent user from updating other user's note", async () => {
      const res = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${otherUserToken}`)
        .send({
          title: "Hacked Title",
          content: "Hacked content",
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Note not found");
    });

    it("should prevent user from deleting other user's note", async () => {
      const res = await request(app)
        .delete(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${otherUserToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Note not found");
    });
  });

  describe("Note Update Edge Cases", () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        userId: testUser._id,
        title: "Original Title",
        content: "Original content",
      });
    });

    it("should update only title when content is not provided", async () => {
      const res = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Updated Title");
      expect(res.body.content).toBe("Original content");
    });

    it("should update only content when title is not provided", async () => {
      const res = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          content: "Updated content",
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Original Title");
      expect(res.body.content).toBe("Updated content");
    });

    it("should not update when empty object is sent", async () => {
      const res = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Original Title");
      expect(res.body.content).toBe("Original content");
    });

    it("should update updatedAt timestamp", async () => {
      const originalUpdatedAt = testNote.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      const res = await request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
        });

      expect(res.status).toBe(200);
      expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });

    it("should handle invalid ObjectId format", async () => {
      const res = await request(app)
        .put("/server/api/notes/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });

  describe("Note Deletion Edge Cases", () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        userId: testUser._id,
        title: "Test Note",
        content: "Test content",
      });
    });

    it("should handle deletion of already deleted note", async () => {
      // Delete the note first
      await Note.findByIdAndDelete(testNote._id);

      const res = await request(app)
        .delete(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message", "Note not found");
    });

    it("should handle invalid ObjectId format for deletion", async () => {
      const res = await request(app)
        .delete("/server/api/notes/invalid-id")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should verify note is completely removed after deletion", async () => {
      const res = await request(app)
        .delete(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);

      // Verify note no longer exists
      const deletedNote = await Note.findById(testNote._id);
      expect(deletedNote).toBeNull();
    });
  });

  describe("Database Connection Issues", () => {
    it("should handle database connection errors gracefully", async () => {
      // Mock mongoose to simulate connection error
      const originalFind = Note.find;
      const mockFind = jest.fn().mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error("Database connection failed")),
      });
      Note.find = mockFind as any;

      const res = await request(app)
        .get("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty("message", "Database connection failed");

      // Restore original method
      Note.find = originalFind;
    });
  });

  describe("Concurrent Operations", () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await Note.create({
        userId: testUser._id,
        title: "Original Title",
        content: "Original content",
      });
    });

    it("should handle concurrent updates to the same note", async () => {
      const update1Promise = request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Update 1" });

      const update2Promise = request(app)
        .put(`/server/api/notes/${testNote._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Update 2" });

      const [res1, res2] = await Promise.all([update1Promise, update2Promise]);

      // Both should succeed
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);

      // Check final state
      const finalNote = await Note.findById(testNote._id);
      expect(finalNote).toBeTruthy();
      expect(["Update 1", "Update 2"]).toContain(finalNote!.title);
    });
  });

  describe("Note Content Validation", () => {
    it("should handle HTML content safely", async () => {
      const htmlContent = "<script>alert('xss')</script><p>Safe content</p>";

      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "HTML Test",
          content: htmlContent,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(htmlContent);
    });

    it("should handle markdown content", async () => {
      const markdownContent =
        "# Heading\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2";

      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Markdown Test",
          content: markdownContent,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(markdownContent);
    });

    it("should handle Unicode characters", async () => {
      const unicodeContent = "Unicode test: 中文 العربية русский 🌟 ñañá";

      const res = await request(app)
        .post("/server/api/notes")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Unicode Test",
          content: unicodeContent,
        });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe(unicodeContent);
    });
  });
});
