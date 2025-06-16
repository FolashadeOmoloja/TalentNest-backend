import ScheduledMeetings from "../models/scheduledMeetings.model.js";
import {
  closingElement,
  defaultStylesClass,
  Logo,
  logoAttachment,
} from "../utils/logo.js";
import { sendEmail } from "../utils/sendEmail.js";
import { updateApplicantStatus } from "../utils/updateApplicantStatus.js";

export const createScheduledMeeting = async (req, res) => {
  try {
    const {
      recipientName,
      recipientEmail,
      createdBy,
      date,
      time,
      meetingUrl,
      jobTitle,
      company,
      applicantId,
      jobId,
    } = req.body;

    if (!recipientName || !recipientEmail || !createdBy || !date || !time) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    const newMeeting = new ScheduledMeetings({
      recipientName,
      recipientEmail,
      createdBy,
      date,
      time,
      meetingUrl,
      jobTitle,
      company,
      applicantId,
      jobId,
    });

    await newMeeting.save();
    let updatedApplicants = [];
    if (applicantId && jobId) {
      updatedApplicants = await updateApplicantStatus(
        applicantId,
        jobId,
        "Interview"
      );

      try {
        await sendInterviewEmail(
          recipientName,
          jobTitle,
          company,
          recipientEmail,
          date,
          time,
          meetingUrl
        );
      } catch (emailError) {
        console.error("Error sending interview email:", emailError);
      }
    }
    const updatedScheduledMeeting = await ScheduledMeetings.find();
    return res.status(201).json({
      message: "Meeting scheduled successfully.",
      success: true,
      data: newMeeting,
      updatedApplicants,
      updatedScheduledMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({
      message: "An error occurred while scheduling the meeting.",
      success: false,
      error: error.message,
    });
  }
};

const sendInterviewEmail = async (
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
