import mongoose from "mongoose";

export const connect = async (): Promise<void> => {
  try {
    const uri = process.env.MongoDB;
    if (!uri) {
      throw new Error("MongoDB connection string is missing in .env file");
    }
    await mongoose.connect(uri);
    console.log("Connected to MongoDB successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};
