import mongoose from "mongoose";
import { mongodbURL } from "../config/config.js";

async function connectDB() {
    try {
        console.log("Mongo URL:", mongodbURL);

        const conn = await mongoose.connect(mongodbURL);

        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error connecting in DB: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;