import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const connectDB = async (uri?: string): Promise<void> => {
  const MONGODB_URI = uri || process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MongoDB URI not defined in environment variables");
  }

  // If already connected, don't try to connect again
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);

    // Log connection status based on environment
    if (process.env.NODE_ENV === "test") {
      // eslint-disable-next-line no-console
      console.log("Test database connected successfully");
    } else if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("Development database connected successfully");
    } else if (process.env.NODE_ENV === "production") {
      // eslint-disable-next-line no-console
      console.log("Production database connected successfully");
    } else {
      // eslint-disable-next-line no-console
      console.log("MongoDB connected successfully");
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
