import jwt from "jsonwebtoken";
import { generateToken } from "../utils/generateToken";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

describe("Utility Functions", () => {
  let originalJwtSecret: string | undefined;

  beforeEach(() => {
    originalJwtSecret = process.env.JWT_SECRET;
  });

  afterEach(() => {
    if (originalJwtSecret) {
      process.env.JWT_SECRET = originalJwtSecret;
    } else {
      delete process.env.JWT_SECRET;
    }
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      process.env.JWT_SECRET = "test-secret";
      const userId = "507f1f77bcf86cd799439011";

      const token = generateToken(userId);

      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      // Verify token can be decoded
      const decoded = jwt.verify(token, "test-secret") as any;
      expect(decoded.id).toBe(userId);
      expect(decoded.exp).toBeDefined();
    });

    it("should set token expiration to 30 days", () => {
      process.env.JWT_SECRET = "test-secret";
      const userId = "507f1f77bcf86cd799439011";

      const token = generateToken(userId);
      const decoded = jwt.verify(token, "test-secret") as any;

      // Check if expiration is approximately 30 days from now
      const now = Math.floor(Date.now() / 1000);
      const thirtyDays = 30 * 24 * 60 * 60;
      const expectedExp = now + thirtyDays;

      // Allow 10 seconds tolerance
      expect(decoded.exp).toBeGreaterThan(expectedExp - 10);
      expect(decoded.exp).toBeLessThan(expectedExp + 10);
    });

    it("should throw error when JWT_SECRET is not defined", () => {
      delete process.env.JWT_SECRET;
      const userId = "507f1f77bcf86cd799439011";

      expect(() => generateToken(userId)).toThrow("JWT_SECRET is not defined");
    });

    it("should handle different user ID formats", () => {
      process.env.JWT_SECRET = "test-secret";

      // Test with ObjectId string
      const objectId = "507f1f77bcf86cd799439011";
      const token1 = generateToken(objectId);
      const decoded1 = jwt.verify(token1, "test-secret") as any;
      expect(decoded1.id).toBe(objectId);

      // Test with numeric string
      const numericId = "12345";
      const token2 = generateToken(numericId);
      const decoded2 = jwt.verify(token2, "test-secret") as any;
      expect(decoded2.id).toBe(numericId);

      // Test with UUID-like string
      const uuidId = "550e8400-e29b-41d4-a716-446655440000";
      const token3 = generateToken(uuidId);
      const decoded3 = jwt.verify(token3, "test-secret") as any;
      expect(decoded3.id).toBe(uuidId);
    });

    it("should generate different tokens for different user IDs", () => {
      process.env.JWT_SECRET = "test-secret";

      const userId1 = "507f1f77bcf86cd799439011";
      const userId2 = "507f1f77bcf86cd799439012";

      const token1 = generateToken(userId1);
      const token2 = generateToken(userId2);

      expect(token1).not.toBe(token2);

      const decoded1 = jwt.verify(token1, "test-secret") as any;
      const decoded2 = jwt.verify(token2, "test-secret") as any;

      expect(decoded1.id).toBe(userId1);
      expect(decoded2.id).toBe(userId2);
    });

    it("should use the same secret consistently", async () => {
      process.env.JWT_SECRET = "consistent-secret";
      const userId = "507f1f77bcf86cd799439011";

      const token1 = generateToken(userId);
      // Longer delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const token2 = generateToken(userId);

      // Tokens should be different due to timestamp but decodable with same secret
      expect(token1).not.toBe(token2);

      const decoded1 = jwt.verify(token1, "consistent-secret") as any;
      const decoded2 = jwt.verify(token2, "consistent-secret") as any;

      expect(decoded1.id).toBe(userId);
      expect(decoded2.id).toBe(userId);
    });

    it("should handle empty string user ID", () => {
      process.env.JWT_SECRET = "test-secret";

      const token = generateToken("");
      const decoded = jwt.verify(token, "test-secret") as any;

      expect(decoded.id).toBe("");
    });

    it("should handle special characters in user ID", () => {
      process.env.JWT_SECRET = "test-secret";
      const specialId = "user@example.com";

      const token = generateToken(specialId);
      const decoded = jwt.verify(token, "test-secret") as any;

      expect(decoded.id).toBe(specialId);
    });

    it("should produce tokens with expected structure", () => {
      process.env.JWT_SECRET = "test-secret";
      const userId = "507f1f77bcf86cd799439011";

      const token = generateToken(userId);

      // JWT tokens should have 3 parts separated by dots
      const parts = token.split(".");
      expect(parts).toHaveLength(3);

      // Each part should be base64 encoded
      parts.forEach((part) => {
        expect(part).toMatch(/^[A-Za-z0-9_-]+$/);
      });
    });

    it("should handle very long user IDs", () => {
      process.env.JWT_SECRET = "test-secret";
      const longId = "a".repeat(1000);

      const token = generateToken(longId);
      const decoded = jwt.verify(token, "test-secret") as any;

      expect(decoded.id).toBe(longId);
    });
  });
});
