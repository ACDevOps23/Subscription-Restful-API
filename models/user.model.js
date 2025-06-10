import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["admin", "user"],
        default: "user",
        required: [true, "Role is required"]
    },
    name: {
        type: String, 
        required: [true, "User Name is required"],
        trim: true,
        minLength: 2,
        maxLength: 50
    },
    email: {
        type: String,
        required: [true, "User Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 2,
        maxLength: 255,
        match: [/\S+@\S+\.\S+/, "Please fill a valid email address"],
    },
    password: {
        type: String,
        required: [true, "User Password is required"],
        minLength: 6,
    },
    token: { type: String }
}, {timestamps: true});

const User = mongoose.model("User", userSchema);

export default User;