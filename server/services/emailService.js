const nodemailer = require('nodemailer');
const { getConfig } = require('../utils/configManager');

const createTransporter = () => {
    const config = getConfig();
    const { host, port, secure, auth } = config.email;

    if (!host || !auth.user) return null;

    return nodemailer.createTransport({
        host,
        port,
        secure, // true for 465, false for other ports
        auth: {
            user: auth.user,
            pass: auth.pass
        }
    });
};

const sendEmail = async (to, subject, text, html) => {
    const transporter = createTransporter();
    if (!transporter) return { success: false, error: "Email not configured" };

    const config = getConfig();
    const from = config.email.from || config.email.auth.user;

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Email Send Error:", error);
        return { success: false, error: error.message };
    }
};

const verifyConfig = async () => {
    const transporter = createTransporter();
    if (!transporter) return { success: false, error: "Missing configuration" };

    try {
        await transporter.verify();
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

module.exports = { sendEmail, verifyConfig };
