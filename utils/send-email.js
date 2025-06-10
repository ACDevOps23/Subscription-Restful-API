import dayjs from "dayjs";
import { emailTemplates } from "./email-template.js";
import transporter, { accountEmail } from "../config/nodemailer.js";

export const sendReminderEmail = async ({to, type, subscription}) => {
    if (!to || !type) {
        throw new Error("Missing required email values");
    }

    const template = emailTemplates.find((t) => t.label === type);

    if (!template) {
        throw new Error("Invalid email type");
    }

    const mailInfo = {
        userName: subscription.user.name,
        subscriptionName: subscription.name,
        renewalDate: dayjs(subscription.renewalDate).format("DD/MM/YYYY"),
        planName: `$${subscription.price} ${subscription.currency} /${subscription.frequency}`,
        paymentMethod: subscription.paymentMethod
    }

    const message = template.generateBody(mailInfo);
    const subject = template.generateSubject(mailInfo);

    const mailOptions = {
        from: accountEmail,
        to: to,
        subject: subject,
        html: message
    }

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
            return console.error("Error sending email");
        }
        console.log("Email sent: " + info.response);
    })
}