import { Router } from "express";
import { getUsers, getUser, createUser, updateUser, deleteUser } from "../controllers/user.controller.js";
import { authorise, isAdmin } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.get("/", authorise, isAdmin, getUsers);
userRouter.get("/:id", authorise, getUser);
userRouter.post("/", authorise, isAdmin, createUser);
userRouter.put("/:id", authorise, isAdmin, updateUser); // update user
userRouter.delete("/:id", authorise, isAdmin, deleteUser); // delete user

export default userRouter;