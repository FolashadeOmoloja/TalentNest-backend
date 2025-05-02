import Talent from "../models/talent.model.js";
import Company from "../models/company.model.js";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (req, res) => {
  const { email, route } = req.body;
  try {
    const token = jwt.sign({ email }, process.env.SECRET_KEY, {
      expiresIn: "1h",
    });

    //change link to hosted url
    const resetLink = `http://localhost:3002/${route}?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "TalentNest Email Verification",
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
            }
            .container {
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              font-size: 16px;
              font-weight: 600;
              color: #ffffff;
              background-color: #010d3e;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
      
            .header {
              width: 100%;
              height: 50px;
              background-color: #010d3e;
            }
      
            .img-div {
              width: 40px;
              height: 40px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"></div>
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
                margin-top: 20px;
              "
            >
              <img src="cid:unique@talentnest" class="img-div" />
      
              <div style="font-weight: 700; font-size: 24px; display: flex; gap: 0">
                <span style="color: black">Talent</span>
                <span style="color: #001354">Nest</span>
              </div>
            </div>
            <h2 style="font-size: 32px; font-weight: 700; color: #010d3e">
              Email Verification
            </h2>
            <p>Hi there!</p>
            <p>Please verify your email address by clicking the button below.</p>
            <p style="font-style: italic; color: rgb(80, 79, 79)">
              (This link will expire in 1 hour for security purposes.)
            </p>
            <a href="${resetLink}" class="button">Verify Email</a>
            <p>If you did not request this, please ignore this email.</p>
            <p>
              Best regards, <br />
              <span
                style="
                  font-weight: bold;
                  color: #010d3e;
                  margin-top: 10px;
                  display: block;
                  font-size: 18px;
                "
                >TalentNest</span
              >
            </p>
          </div>
          <div class="header"></div>
        </body>
      </html>

      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./logo.png",
          cid: `unique@talentnest`,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send email", error);
        return res.status(500).json({ message: "Failed to send email" });
      }
      res
        .status(200)
        .json({ message: "Reset link sent to your email address." });
    });
  } catch (error) {
    console.error("Error generating reset link", error);
    res.status(500).json({ message: "Error sending reset link" });
  }
};

export const verifyToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return res.status(200).json({ message: "Token is valid", decoded });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(400).json({ message: "Invalid token" });
    }
    console.error("Token verification error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, company } = req.body;

    // Validate inputs
    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
        success: false,
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const email = decoded.email;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password based on user type (company or talent)
    const updateModel = company ? Company : Talent;
    const updatedUser = await updateModel.updateOne(
      { emailAddress: email },
      { password: hashedPassword }
    );

    // Check if the update was successful
    if (updatedUser.modifiedCount === 0) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Password updated successfully",
      success: true,
    });
  } catch (error) {
    console.error("Password reset error:", error);

    // Check if the error is due to an invalid or expired token
    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res.status(400).json({
        message: "Invalid or expired token",
        success: false,
      });
    }

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const sendContactEmail = async (req, res) => {
  const { name, email, company, phone, subject, message, approvalCheck } =
    req.body;
  try {
    const mailOptions = {
      from: email,
      to: process.env.EMAIL_USER,
      subject: `${subject} from ${company ? company : name}`,
      html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
            }
            .container {
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .header {
              width: 100%;
              height: 50px;
              background-color: #010d3e;
            }
      
            .img-div {
              width: 40px;
              height: 40px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"></div>
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                cursor: pointer;
                margin-top: 20px;
              "
            >
              <img src="cid:unique@talentnest" class="img-div" />
      
              <div style="font-weight: 700; font-size: 24px; display: flex; gap: 0">
                <span style="color: black">Talent</span>
                <span style="color: #001354">Nest</span>
              </div>
            </div>
            <h2 style="font-size: 32px; font-weight: 700; color: #010d3e">
              Email Verification
            </h2>
            <p>${message}</p>
            <p style="font-style: italic; color: rgb(80, 79, 79)"> ${phone}</p>
          </div>
          <div class="header"></div>
        </body>
      </html>

      `,
      attachments: [
        {
          filename: "logo.png",
          path: "./logo.png",
          cid: `unique@talentnest`,
        },
      ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Failed to send email", error);
        return res.status(500).json({ message: "Failed to send email" });
      }
      res.status(200).json({ message: "Message sent." });
    });
  } catch (error) {
    console.error("Error sending email", error);
    res.status(500).json({ message: "Error sending email" });
  }
};
