import nodemailer from "nodemailer";
import {
  closingElement,
  defaultStylesClass,
  Logo,
  logoAttachment,
} from "./logo.js";

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

export const sendInterviewEmail = async (
  recipientName,
  jobTitle,
  company,
  email,
  date,
  time,
  link
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "omolojashade@gmail.com",
    subject: `Interview Invitation – ${jobTitle} Position at ${company}`,
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${defaultStylesClass}
              .interview-details {
                background-color: #f8f9fa;
                padding: 20px;
                margin: 20px;
                border-radius: 8px;
                border-left: 4px solid #010d3e;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 10px 0;
                text-align: left;
                font-size: 14px;
              }
              .detail-label {
                font-weight: bold;
                color: #010d3e;
                min-width: 120px;
              }
              .detail-value {
                flex: 1;
                color: #333;
              }
              @media (max-width: 600px) {
                .detail-row {
                  flex-direction: column;
                  align-items: flex-start;
                  gap: 5px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"></div>     
                ${Logo}
              <h2
                style="
                  font-size: 32px;
                  font-weight: 700;
                  color: #010d3e;
                  margin: 30px 0 20px 0;
                "
              >
                Interview Scheduled! 🎉
              </h2>
        
              <p style="font-size: 18px; margin: 20px">Hello <strong>${recipientName}</strong>,</p>
        
              <p style="font-size: 16px; line-height: 1.6; margin: 20px; color: #333">
                Congratulations! We are pleased to inform you that you have been
                scheduled for an interview for the position of
                <strong style="color: #010d3e">${jobTitle}</strong> at ${company}
              </p>
        
              <div class="interview-details">
                <h3 style="color: #010d3e; margin-top: 0">Interview Details</h3>
        
                <div class="detail-row">
                  <span class="detail-label">Position:</span>
                  <span class="detail-value">${jobTitle}</span>
                </div>
        
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${date}</span>
                </div>
        
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${time} (WAT)</span>
                </div>
        
                <div class="detail-row">
                  <span class="detail-label">Meeting Link:</span>
                  <a href=${link} target="_blank" class="detail-value" style="color: #010d3e">${link}</a>
                </div>
              </div>
        
              <div
                style="
                  background-color: #e7f3ff;
                  padding: 15px;
                  margin: 20px;
                  border-radius: 5px;
                  border-left: 4px solid #007bff;
                "
              >
                <p style="margin: 0; font-size: 14px; color: #0056b3">
                  <strong>💡 Interview Preparation Tips:</strong><br />
                  • Review the job description and company website<br />
                  • Prepare examples of your coding projects<br />
                  • Test your internet connection and microphone<br />
                  • Have a copy of your resume ready
                </p>
              </div>
        
              <p style="font-size: 14px; color: #666; margin: 20px">
                If you have any questions or need to reschedule, please contact us at
                <a
                  href="https://talent-nest.vercel.app/help-desk"
                  style="color: #010d3e; font-weight: 600"
                  >Nest HelpDesk</a
                >
              </p>
                ${closingElement}
              <div class="header"></div>
            </div>
          </body>
        </html>

      `,
    attachments: [logoAttachment],
  };
  await sendEmail(mailOptions);
};
export const sendCompanyEmail = async (
  recipientName,
  company,
  email,
  date,
  time,
  link
) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: "omolojashade@gmail.com",
    subject: `Meeting Invitation: Scheduled Discussion with TalentNest`,
    html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              ${defaultStylesClass}
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"></div>     
                ${Logo}
              <p style="font-size: 18px; margin: 20px">Dear <strong>${recipientName}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6; margin: 20px; color: #333">
                 We hope this message finds you well.
                 
                 This is to confirm that a meeting has been scheduled with your company, ${company}.
                 
                 Please find the meeting details below:
                  </p>
                  <ul style="list-style: none; padding: 0; font-size: 14px; color: #333;">
                   <li style="margin-bottom: 8px;">
                     <strong>📅 Date:</strong> <span>${date}</span>
                   </li>
                   <li style="margin-bottom: 8px;">
                     <strong>⏰ Time:</strong> <span>${time} (WAT)</span>
                   </li>
                   <li style="margin-bottom: 8px;">
                     <strong>🔗 Meeting Link:</strong> 
                     <a href="[Meeting URL]" target="_blank" style="color: #010d3e;">${link}</a>
                   </li>       
                 </ul>
              <p style="font-size: 14px; color: #666; margin: 20px">
                If you have any questions or need to reschedule, please contact us at
                <a
                  href="https://talent-nest.vercel.app/help-desk"
                  style="color: #010d3e; font-weight: 600"
                  >Nest HelpDesk</a
                >
              </p>
                ${closingElement}
              <div class="header"></div>
            </div>
          </body>
        </html>

      `,
    attachments: [logoAttachment],
  };
  await sendEmail(mailOptions);
};
