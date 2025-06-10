import dayjs from "dayjs";
import Subscription from "../models/subscription.model.js";
import { createRequire } from "module";
import { sendReminderEmail } from "../utils/send-email.js";
const require = createRequire(import.meta.url); // to allow require on module type
const { serve } = require("@upstash/workflow/express");


const REMINDERS = [7, 5, 2, 1]; // reminders within certain days


export const sendReminders = serve(async (context) => { // to send reminders
    const { subscriptionId } = context.requestPayload;  // Extract the subscription ID from the incoming request payload
    const subscription = await fetchSubscription(context, subscriptionId); // Fetch the subscription details from the database

    if (!subscription || subscription.status === 'active' || subscription.status === 'expired') {  // If the subscription doesn't exist or isn't active, exit the function
        await notification(context, `subscription ${subscription.name} has been ${subscription.status}`, subscription);
    } 
    // Convert the renewal date to a dayjs object for date manipulation
    const renewalDate = dayjs(subscription.renewalDate);
    // If the renewal date has already passed, log it and stop the workflow
    if (renewalDate.isBefore(dayjs())) {
        console.log(`Renewal date has passed for subscription ${subscriptionId}. Stopping workflow.`);
        return;
    }
     // Loop over the reminder days (7, 5, 2, 1 days before renewal)
    for (const daysBefore of REMINDERS) {
         // Calculate the reminder date by subtracting the number of days from the renewal date
        const reminderDate = renewalDate.subtract(daysBefore, "day"); // reminds you certain days before 
        
        if (reminderDate.isAfter(dayjs())) {  // If the reminder date is still in the future, sleep until that date
            await sleepUntilReminder(context, `Reminder ${daysBefore} days before`, reminderDate); // Sleep until the calculated reminder date
        }
         // Trigger the reminder once the sleep period is over
         if (dayjs().isSame(reminderDate, "day")) {
            await triggerReminder(context, `${daysBefore} days before reminder`, subscription);
         }
    }
});
// Function to fetch the subscription data from the database using its ID
const fetchSubscription = async (context, subscriptionId) => {
    return await context.run("get subscription", async () => {
        return await Subscription.findById(subscriptionId).populate("user", "name email");
    });
}
// Function to pause the workflow until the reminder date arrives
const sleepUntilReminder = async (context, label, date) => {
    console.log(`Sleeping until ${label} reminder at ${date}`);

    await context.sleepUntil(label, date.toDate());
}
// Function to trigger the reminder (sending notifications like email, SMS, etc.)
const triggerReminder = async (context, label, subscription) => {
    return await context.run(label, async () => {
        console.log(`Triggering ${label} reminder`);
        // send email, SMS, etc
        await sendReminderEmail({ // might send email 4 times in development mode 
            to: subscription.user.email,
            type: label,
            subscription
        });
    })
}

const notification = async (context, label, subscription) => {
    return await context.run(label, async() => {
        console.log(`Notifying of subscrition status ${label}`);
        await sendReminderEmail({ 
            to: subscription.user.email,
            type: label,
            subscription
        });
    })
}
//  npx @upstash/qstash-cli dev to start workflow