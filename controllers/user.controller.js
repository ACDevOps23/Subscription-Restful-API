import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

export const getUsers = async (req, res, next) => {
    try {
        const users = await User.find();

       return res.status(200).json({ success: true, data: users});
    } catch(error) {
        next(error);
    }
}

export const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select("-password"); // exclude password field
        
        if (!user) {
            const error = new error("User not found");
            error.statusCode = 404;
            throw error;
        }

       return res.status(200).json({ success: true, data: user});
    } catch(error) {
        next(error);
    }
}

export const createUser = async (req, res, next) => {
    try {

       const {role, name, email, password} = req.body;
       const existingUser = await User.findOne({email});

       if (existingUser) {
            throw new Error(`${existingUser.email} already exists`);
       }

       const hashPassword = await bcrypt.hash(password, 10);
       const newUser = await User.create([{role, name, email, password: hashPassword}]);

       const token = jwt.sign({userId: newUser[0]._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});

       newUser[0].token = token;
       await newUser[0].save();

       return res.status(201).json({
        success: true,
        token,
        newUser: newUser[0]
       });

    } catch(error) {
        next(error);
    }
}

export const updateUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const updateUser = req.body;
        const existingUser = await User.findById(id);

        if (!existingUser) {
            return res.status(404).json({message: "User does not exist"});
        }

        if (req.user._id.toString() !== id) {
            return res.status(401).json({ message: "You are not the owner of this account" });
        }

        if (updateUser.email && updateUser.email !== existingUser.email) { // checks if the same email name exists already otherwise update
            const existingEmail = await User.findOne({email: updateUser.email}); // finds the email
            if (existingEmail) {
                return res.status(409).json({ message: "Email already in use" }); // notifies
            }
        }

        if (updateUser.password) { // update password
            updateUser.password = await bcrypt.hash(updateUser.password, 10);
        }
           
        const userUpdated = await User.findByIdAndUpdate(existingUser._id, updateUser, {
            new: true,
            runValidators: true,
        });

        return res.status(200).json({
            success: true,
            message: "Successfully updated",
            data: userUpdated
        });
       

    } catch(error) {
        next(error);
    }
}

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const findUser = await User.findByIdAndDelete(id);

        if (!findUser) {
            return res.status(404).json({message: "User does not exist"});
        }

        if (req.user._id.string() !== id) {
            return res.status(401).json({ message: "You are not the owner of this account" });
        }

        return res.status(204).json({
            success: true,
            message: `successfully deleted Account for ${findUser.email}`
        });


    } catch(error) {
        next(error);
    }
}