import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends an email using the provided mail options.
 * @param {Object} mailOptions - nodemailer mail options
 * @returns {Promise<Object>} - info object if successful
 */
export const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send email:", error);
        reject(error);
      } else {
        resolve(info);
      }
    });
  });
};
