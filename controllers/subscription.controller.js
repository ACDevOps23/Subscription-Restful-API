import Subscription from "../models/subscription.model.js";
import { workflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";
import User from "../models/user.model.js";
import dayjs from "dayjs";

export const getSubscriptions = async (req, res, next) => {
    try {
        const subscription = await Subscription.find();
        res.status(200).json({success: true, data: subscription});

        next();

    } catch(error) {
        next(error);
    }
}

export const getSubscriptionDetails = async (req, res, next) => {
    try {

        const subscription = await Subscription.findOne({user: req.user._id});
        return res.status(200).json({success: true, data: subscription});

    } catch(error) {
        next(error);
    }
} 

export const createSubscription = async (req, res, next) => {
    try {
        const subscription = await Subscription.create({
            ...req.body,
            user: req.user._id,
        })
        // change dates if no notifications are sent
      const { workflowRunId } = await workflowClient.trigger({
            url: `${SERVER_URL}/api/v1/workflows/subscription/reminder`, 
            body: {                       
                subscriptionId: subscription.id,
            },
            headers: {
                "content-type": "application/json",
            },
            retries: 0,
        });

        return res.status(201).json({sucess: true, data: { subscription, workflowRunId } });

    } catch(error) {
        next(error);
    }
}

export const getUserSubscription = async (req, res, next) => {
    try {
        // check if the user is the same as the one in the token
        if (req.user._id.toString() !== req.params.id) {
            const error = new Error("You are not the owner of this account");
            error.status = 401;
            throw error;
        }

        const subscriptions = await Subscription.find({user: req.params.id});
        res.status(200).json({success: true, data: subscriptions});

        next();

    } catch(error) {
        next(error);
    }
}

export const updateSubscription = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updateSubscription = req.body;

        const findSubscription = await Subscription.findById(id);

        if (!findSubscription) {
            return res.status(404).json({message: "subscription does not exist"});
        }

        if (findSubscription.user._id.toString() !== req.user.id) {
            return res.status(401).json({ message: "You are not the owner of this account" });
        }

        const updatedSubscription = await Subscription.findByIdAndUpdate(id, updateSubscription, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: "successfully updated subscription",
            data: updatedSubscription
        });

        next();
        
    } catch(error) {
        next(error);
    }
}

export const deleteSubscription = async(req, res, next) => {
    try {
        const { id } = req.params;

        if (findSubscription.user._id.toString() !== req.user.id) {
            return res.status(401).json({ message: "You are not the owner of this account" });
        }

        const findSubscription = await Subscription.findByIdAndDelete(id);

        if (!findSubscription) {
            return res.status(404).json({message: "subscription does not exist"});
        }

        res.status(200).json({
            success: true,
            message: `successfully deleted ${findSubscription.name} Subscription for ${req.user.name}`
        });

        next();

    } catch(error) {
        next(error);
    }
}

export const cancelSubscription = async(req, res, next) => {
    try {
        const { id } = req.params;

        const findSubscription = await Subscription.findById(id);

        if (!findSubscription) {
            return res.status(404).json({message: "subscription does not exist"});
        }

        if (findSubscription.user._id.toString() !== req.user.id) {
            return res.status(401).json({ message: "You are not the owner of this account" });
        }

        const cancelSubscription = await Subscription.findByIdAndUpdate(id, {status: "cancelled"}, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            message: `subscription ${findSubscription.name} has been ${cancelSubscription.status} for account ${req.user.name}`,
            data: cancelSubscription
        });

        next();

    } catch(error) {
        next(error);
    }
}

export const upcomingSubscriptions = async (req, res, next) => {
    try {

        const today = dayjs();
        const nextDays = today.add(30, "day");

        const query = {
            renewalDate: { 
                $gte: today.toDate(),
                $lte: nextDays.toDate() 
            }
        };

        if (req.user.role !== "admin") {
            query.user = req.user._id;
        }

        const upcomingSubscriptions = await Subscription.find(query);

        res.status(200).json({
            success: true,
            count:`You have ${upcomingSubscriptions.length} subscription renewals`,
            data: upcomingSubscriptions
        });

        
    } catch(error) {
        next(error);
    }
}
