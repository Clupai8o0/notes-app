import User, { IUser } from "../models/User";
import Note from "../models/Note";
import { describe, it, expect, beforeEach, afterAll } from "@jest/globals";

describe("Models", () => {
  beforeEach(async () => {
    // Clean up before each test
    await User.deleteMany({});
    await Note.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Note.deleteMany({});
  });

  describe("User Model", () => {
    describe("Schema Validation", () => {
      it("should create a valid user", async () => {
        const userData = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        };

        const user = await User.create(userData);

        expect(user.name).toBe(userData.name);
        expect(user.email).toBe(userData.email);
        expect(user.password).not.toBe(userData.password); // Should be hashed
        expect(user._id).toBeDefined();
        expect((user as any).createdAt).toBeDefined();
        expect((user as any).updatedAt).toBeDefined();
      });

      it("should require email field", async () => {
        const userData = {
          name: "John Doe",
          password: "password123",
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it("should require password field", async () => {
        const userData = {
          name: "John Doe",
          email: "john@example.com",
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it("should require name field", async () => {
        const userData = {
          email: "john@example.com",
          password: "password123",
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it("should enforce unique email constraint", async () => {
        const userData = {
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        };

        await User.create(userData);

        const duplicateUserData = {
          name: "Jane Doe",
          email: "john@example.com", // Same email
          password: "differentpassword",
        };

        await expect(User.create(duplicateUserData)).rejects.toThrow();
      });

      it("should enforce minimum password length", async () => {
        const userData = {
          name: "John Doe",
          email: "john@example.com",
          password: "12345", // Only 5 characters
        };

        await expect(User.create(userData)).rejects.toThrow();
      });

      it("should trim and lowercase email", async () => {
        const userData = {
          name: "John Doe",
          email: "  JOHN@EXAMPLE.COM  ",
          password: "password123",
        };

        const user = await User.create(userData);
        expect(user.email).toBe("john@example.com");
      });

      it("should trim name", async () => {
        const userData = {
          name: "  John Doe  ",
          email: "john@example.com",
          password: "password123",
        };

        const user = await User.create(userData);
        expect(user.name).toBe("John Doe");
      });

      it("should handle special characters in name", async () => {
        const userData = {
          name: "José María O'Connor",
          email: "jose@example.com",
          password: "password123",
        };

        const user = await User.create(userData);
        expect(user.name).toBe("José María O'Connor");
      });

      it("should handle very long names", async () => {
        const longName = "A".repeat(100);
        const userData = {
          name: longName,
          email: "long@example.com",
          password: "password123",
        };

        const user = await User.create(userData);
        expect(user.name).toBe(longName);
      });
    });

    describe("Password Hashing", () => {
      it("should hash password before saving", async () => {
        const originalPassword = "password123";
        const userData = {
          name: "John Doe",
          email: "john@example.com",
          password: originalPassword,
        };

        const user = await User.create(userData);
        expect(user.password).not.toBe(originalPassword);
        expect(user.password.length).toBeGreaterThan(originalPassword.length);
      });

      it("should not rehash password if not modified", async () => {
        const user = await User.create({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });

        const originalHashedPassword = user.password;

        // Update name only
        user.name = "Jane Doe";
        await user.save();

        expect(user.password).toBe(originalHashedPassword);
      });

      it("should rehash password if modified", async () => {
        const user = await User.create({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });

        const originalHashedPassword = user.password;

        // Update password
        user.password = "newpassword123";
        await user.save();

        expect(user.password).not.toBe(originalHashedPassword);
      });
    });

    describe("comparePassword Method", () => {
      let user: IUser;

      beforeEach(async () => {
        user = await User.create({
          name: "John Doe",
          email: "john@example.com",
          password: "password123",
        });
      });

      it("should return true for correct password", async () => {
        const isMatch = await user.comparePassword("password123");
        expect(isMatch).toBe(true);
      });

      it("should return false for incorrect password", async () => {
        const isMatch = await user.comparePassword("wrongpassword");
        expect(isMatch).toBe(false);
      });

      it("should handle empty password", async () => {
        const isMatch = await user.comparePassword("");
        expect(isMatch).toBe(false);
      });

      it("should be case sensitive", async () => {
        const isMatch = await user.comparePassword("PASSWORD123");
        expect(isMatch).toBe(false);
      });

      it("should handle special characters", async () => {
        const specialUser = await User.create({
          name: "Special User",
          email: "special@example.com",
          password: "p@ssw0rd!@#$%^&*()",
        });

        const isMatch = await specialUser.comparePassword("p@ssw0rd!@#$%^&*()");
        expect(isMatch).toBe(true);
      });
    });
  });

  describe("Note Model", () => {
    let testUser: IUser;

    beforeEach(async () => {
      testUser = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });

    describe("Schema Validation", () => {
      it("should create a valid note", async () => {
        const noteData = {
          userId: testUser._id,
          title: "Test Note",
          content: "This is a test note content",
        };

        const note = await Note.create(noteData);

        expect(note.title).toBe(noteData.title);
        expect(note.content).toBe(noteData.content);
        expect(note.userId.toString()).toBe((testUser._id as any).toString());
        expect(note._id).toBeDefined();
        expect(note.createdAt).toBeDefined();
        expect(note.updatedAt).toBeDefined();
      });

      it("should require userId field", async () => {
        const noteData = {
          title: "Test Note",
          content: "This is a test note content",
        };

        await expect(Note.create(noteData)).rejects.toThrow();
      });

      it("should require title field", async () => {
        const noteData = {
          userId: testUser._id,
          content: "This is a test note content",
        };

        await expect(Note.create(noteData)).rejects.toThrow();
      });

      it("should require content field", async () => {
        const noteData = {
          userId: testUser._id,
          title: "Test Note",
        };

        await expect(Note.create(noteData)).rejects.toThrow();
      });

      it("should trim title", async () => {
        const noteData = {
          userId: testUser._id,
          title: "  Test Note  ",
          content: "This is a test note content",
        };

        const note = await Note.create(noteData);
        expect(note.title).toBe("Test Note");
      });

      it("should preserve content whitespace", async () => {
        const content = "  Line 1\n  Line 2  \n  Line 3  ";
        const noteData = {
          userId: testUser._id,
          title: "Test Note",
          content: content,
        };

        const note = await Note.create(noteData);
        expect(note.content).toBe(content);
      });

      it("should handle empty title", async () => {
        const noteData = {
          userId: testUser._id,
          title: "",
          content: "This is a test note content",
        };

        await expect(Note.create(noteData)).rejects.toThrow();
      });

      it("should handle empty content", async () => {
        const noteData = {
          userId: testUser._id,
          title: "Test Note",
          content: "",
        };

        await expect(Note.create(noteData)).rejects.toThrow();
      });

      it("should handle very long title", async () => {
        const longTitle = "A".repeat(1000);
        const noteData = {
          userId: testUser._id,
          title: longTitle,
          content: "This is a test note content",
        };

        const note = await Note.create(noteData);
        expect(note.title).toBe(longTitle);
      });

      it("should handle very long content", async () => {
        const longContent = "A".repeat(10000);
        const noteData = {
          userId: testUser._id,
          title: "Test Note",
          content: longContent,
        };

        const note = await Note.create(noteData);
        expect(note.content).toBe(longContent);
      });

      it("should handle special characters in title and content", async () => {
        const specialTitle = "Test! @#$%^&*()_+ Title";
        const specialContent = "Content with émojis 🎉 and spéçial charaçters";
        const noteData = {
          userId: testUser._id,
          title: specialTitle,
          content: specialContent,
        };

        const note = await Note.create(noteData);
        expect(note.title).toBe(specialTitle);
        expect(note.content).toBe(specialContent);
      });

      it("should handle HTML content", async () => {
        const htmlContent = "<h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p>";
        const noteData = {
          userId: testUser._id,
          title: "HTML Note",
          content: htmlContent,
        };

        const note = await Note.create(noteData);
        expect(note.content).toBe(htmlContent);
      });

      it("should handle markdown content", async () => {
        const markdownContent =
          "# Heading\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2";
        const noteData = {
          userId: testUser._id,
          title: "Markdown Note",
          content: markdownContent,
        };

        const note = await Note.create(noteData);
        expect(note.content).toBe(markdownContent);
      });
    });

    describe("Timestamps", () => {
      it("should automatically set createdAt and updatedAt", async () => {
        const noteData = {
          userId: testUser._id,
          title: "Test Note",
          content: "This is a test note content",
        };

        const note = await Note.create(noteData);

        expect(note.createdAt).toBeDefined();
        expect(note.updatedAt).toBeDefined();
        expect(note.createdAt).toEqual(note.updatedAt);
      });

      it("should update updatedAt when note is modified", async () => {
        const note = await Note.create({
          userId: testUser._id,
          title: "Original Title",
          content: "Original content",
        });

        const originalUpdatedAt = note.updatedAt;

        // Wait a bit to ensure timestamp difference
        await new Promise((resolve) => setTimeout(resolve, 100));

        note.title = "Updated Title";
        await note.save();

        expect(note.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
        expect(note.createdAt).toEqual(note.createdAt); // createdAt should not change
      });
    });

    describe("Population", () => {
      it("should populate user information", async () => {
        const note = await Note.create({
          userId: testUser._id,
          title: "Test Note",
          content: "This is a test note content",
        });

        const populatedNote = await Note.findById(note._id).populate("userId");

        expect(populatedNote).toBeDefined();
        expect(populatedNote!.userId).toBeDefined();
        expect((populatedNote!.userId as any).name).toBe(testUser.name);
        expect((populatedNote!.userId as any).email).toBe(testUser.email);
      });
    });
  });

  describe("Model Relationships", () => {
    it("should maintain referential integrity", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const note = await Note.create({
        userId: user._id,
        title: "Test Note",
        content: "This is a test note content",
      });

      // Verify the relationship
      const foundNote = await Note.findById(note._id).populate("userId");
      expect((foundNote!.userId as any).email).toBe(user.email);
    });

    it("should handle orphaned notes when user is deleted", async () => {
      const user = await User.create({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });

      const note = await Note.create({
        userId: user._id,
        title: "Test Note",
        content: "This is a test note content",
      });

      // Delete the user
      await User.findByIdAndDelete(user._id);

      // Note should still exist but with invalid userId reference
      const orphanedNote = await Note.findById(note._id);
      expect(orphanedNote).toBeDefined();
      expect(orphanedNote!.userId.toString()).toBe((user._id as any).toString());

      // Attempting to populate should return null for userId
      const populatedOrphanedNote = await Note.findById(note._id).populate("userId");
      expect(populatedOrphanedNote!.userId).toBeNull();
    });
  });
});
