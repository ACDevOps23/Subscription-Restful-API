import { Router } from "express";
import { authorise, isAdmin } from "../middlewares/auth.middleware.js";
import { cancelSubscription, createSubscription, deleteSubscription, getSubscriptionDetails, getSubscriptions, getUserSubscription, upcomingSubscriptions, updateSubscription } from "../controllers/subscription.controller.js";

const subscriptionRouter = Router();

subscriptionRouter.get("/", authorise, isAdmin, getSubscriptions);
subscriptionRouter.get("/details", authorise, getSubscriptionDetails);
subscriptionRouter.post("/", authorise, createSubscription);
subscriptionRouter.put("/:id", authorise, isAdmin, updateSubscription); // test
subscriptionRouter.delete("/:id", authorise, deleteSubscription); // test
subscriptionRouter.get("/user/:id", authorise, getUserSubscription);
subscriptionRouter.put("/:id/cancel", authorise, cancelSubscription); // test
subscriptionRouter.get("/upcoming-renewals", authorise, upcomingSubscriptions); // test

export default subscriptionRouter;