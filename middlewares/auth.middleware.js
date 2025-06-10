import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import User from "../models/user.model.js";

const authorise = async (req, res, next) => {
     try {
        let token = req.cookies.jwt || req.headers.authorization.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorised"});
        }

        const confirmUser = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(confirmUser.userId);

        if (!user) {
            return res.status(401).json({message: "Unauthorised"});
        }

        req.user = user;
        next();

     } catch(error) {
        res.status(401).json({ message: "Unauthorised Access", error: error.message});
     }
};

const isAdmin = (req, res, next) => {

    if (req.user.role !== "admin") {
        return res.status(403).json({message: "Unauthorised access, Admin only"});
    }
    next();
}

export { authorise, isAdmin };