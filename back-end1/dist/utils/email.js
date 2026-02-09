"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer = require("nodemailer");
const sendEmail = async ({ to, subject, text, }) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    const info = await transporter.sendMail({
        from: `"Kabil" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        text,
    });
    return info;
};
exports.sendEmail = sendEmail;
