import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

export const signUp = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction(); // perform atomic updates

    try {
        // logic to create a new user
        const {role, name, email, password} = req.body;

        // check if user exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            const error = new Error("User already exists");
            error.statusCode = 409;
            throw error;
        }

        // hash password 
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        // create a user and in case something goes on then abord session
        const newUser = await User.create([{role, name, email, password: hashPassword}], { session });

        const token = jwt.sign({userId: newUser[0]._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});
        res.status(201).json({
            sucess: true,
            message: "User created successfully",
            data: {
                token, 
                user: newUser[0]
            }
        });

        await session.commitTransaction(); // make sure that data is valid before inserted in db
    } catch(error) {
        await session.abortTransaction(); // if error in data then abort (dont store in db) 
        session.endSession(); // end the db session
        next(error);    
    }
}

export const signIn = async (req, res, next) => {
    try {
       const { email, password } = req.body;
       const user = await User.findOne({ email });

        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        } 

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            const error = new Error("Pasword is invalid");
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({userId: user._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

        user.token = token;
        await user.save();

        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 1,
            sameSite: "strict"
        })

        return res.status(200).json({
            success: true,
            message: "User signed in successfully",
            data: {
                token,
                user
            }
        });

    } catch(error) {
        next(error);
    }
}

export const signOut = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;

        if (!token) {
            return res.status(400).json({ message: "User not signed in"});
        }

        const decode = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decode.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found"});
        }

        if (user.token !== token) {
            return res.status(401).json({ message: "Session mismatch or already signed out" });
        }

        // remove token from db
        user.token = null;
        await user.save();

        // clear cookie
        res.clearCookie("jwt", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({success: true, message: "User successfully signed out"});

    } catch(error) {
        next(error);
    }
}