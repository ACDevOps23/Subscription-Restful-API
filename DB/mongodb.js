import mongoose from "mongoose";
import { DB_URI } from "../config/env.js";


if (!DB_URI) {
    throw new Error("no environment variable DB_URI exists");
}

const db_connection = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log("Connected to database");
    } catch(error) {
        console.error("Cannot connect to database", error);
    }
}

export default db_connection;