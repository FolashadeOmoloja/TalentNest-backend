import { cohere } from "../lib/cohere.js";
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs/promises";
import { GenerateDeclineHtml, GenerateFullHtml } from "../utils/fullHtml.js";
import {
  closingElement,
  defaultStylesClass,
  Logo,
  logoAttachment,
} from "../utils/logo.js";
import { sendEmail } from "../utils/sendEmail.js";
import { updateApplicantStatus } from "../utils/updateApplicantStatus.js";
import Job from "../models/job.model.js";
import Applicants from "../models/applicants.model.js";

export const generateOfferLetterDraft = async (req, res) => {
  try {
    const { talentName, jobRole, companyName, startDate } = req.body;

    const prompt = `
       Generate a short, professional job offer letter (under 200 words) for ${talentName}, offering the role of ${jobRole} at ${companyName}, starting on ${startDate}. Use a warm, professional, and concise tone.
       
       The output must be fully formatted in HTML for a rich text editor like Quill.
       
       Structure:
       - Use <p> tags for paragraphs
       - Use <strong> tags to emphasize key sentences (like the congratulations or welcome)
       - Use <br> tags where appropriate to break lines
       - Make it readable and visually structured
       
       Include the following sections:
       - <p><strong>Brief congratulatory opening to ${talentName}</strong></p>
       - <p>Confirmation of role and start date</p>
       - <p>Warm welcome paragraph about joining the team</p>
       - <p>Closing note of encouragement and anticipation (e.g., “We look forward to working with you”)</p>
       - <br><p>The ${companyName} Team (via TalentNest Hiring)</p>
       `;

    const cohereRes = await cohere.generate({
      model: "command",
      prompt,
      max_tokens: 400,
      temperature: 0.7,
    });
    const draft = cohereRes.generations[0].text;

    return res.status(200).json({
      success: true,
      message: "Offer letter draft generated",
      draft,
    });
  } catch (error) {
    console.error("Error generating offer letter:", error.message);
    return res.status(500).json({
      message: "An error occurred. Please try again later.",
      error: error.message,
      success: false,
    });
  }
};

const generatePDF = async (html, filename) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Important for Fly.io
  });

  const page = await browser.newPage();

  // Set proper HTML content and wait for rendering
  await page.setContent(html, { waitUntil: "networkidle0" });

  // Generate folder path dynamically (safe for Fly.io's ephemeral fs)
  // const outputDir = path.join(process.cwd(), "lib/pdfs");
  const outputDir =
    process.env.NODE_ENV === "production"
      ? path.resolve("/tmp/pdfs")
      : path.join(process.cwd(), "lib/pdfs");

  await fs.mkdir(outputDir, { recursive: true }); // ensure directory exists

  const pdfPath = path.join(outputDir, `${filename}.pdf`);

  // Create the PDF file
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
  });

  await browser.close();
  return pdfPath;
};

export const sendOfferLetterAndUpdateStatus = async (req, res) => {
  try {
    const {
      html,
      talentId,
      talentMail,
      jobRole,
      companyName,
      talentName,
      jobId,
    } = req.body;
    const filename = `${talentName}_${jobRole}_offer`;
    const fullHtml = GenerateFullHtml(html, jobRole, companyName);
    const filePath = await generatePDF(fullHtml, filename);
    if (!filePath) {
      console.log("failed to generate pdf");
      return res
        .status(400)
        .json({ success: false, message: "Failed to generate pdf" });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "omolojashade@gmail.com",
      subject: `Welcome to the Team – Your Offer Letter from ${companyName}`,
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
               <div style="font-size: 16px; line-height: 1.5">
                 <p>
                   Congratulations ${talentName}! We are pleased to inform you that you
                   have been selected for the <strong>${jobRole}</strong> role at
                   <strong>${companyName}</strong>.
                 </p>
                 <p>
                   We have attached a copy of your offer letter and will be reaching out
                   to you in the coming days with other necessary onboarding documents.
                 </p>
                 <p>Thank you for your dedication to the TalentNest hiring process.</p>
               </div>
                ${closingElement}
               <div class="header"></div>
             </div>
           </body>
         </html>
  
        `,
      attachments: [
        {
          filename: filename,
          path: filePath,
          contentType: "application/pdf",
        },
        logoAttachment,
      ],
    };

    try {
      await sendEmail(mailOptions);
    } catch (err) {
      console.error("Could not send offer email:", err);
      return res
        .status(400)
        .json({ success: false, message: "Failed to send email" });
    }

    const updatedApplicants = await updateApplicantStatus(
      talentId,
      jobId,
      "Hired"
    );

    if (updatedApplicants.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No applicants found" });
    }

    return res.status(200).json({
      success: true,
      message: "Hire process completed succesfully",
      updatedApplicants,
    });
  } catch (err) {
    console.log("Error occured:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const declineAndUpdateStatus = async (req, res) => {
  try {
    const {
      html,
      talentId,
      talentMail,
      jobRole,
      companyName,
      talentName,
      jobId,
    } = req.body;
    const htmlContent = GenerateDeclineHtml(talentName, jobRole, companyName);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "omolojashade@gmail.com",
      subject: `Update on Your Application for the ${jobRole} Role at ${companyName}`,
      html: htmlContent,
      attachments: [logoAttachment],
    };

    try {
      await sendEmail(mailOptions);
    } catch (err) {
      console.error("Could not send offer email:", err);
      return res
        .status(400)
        .json({ success: false, message: "Failed to send email" });
    }

    const updatedApplicants = await updateApplicantStatus(
      talentId,
      jobId,
      "Declined"
    );

    if (updatedApplicants.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No applicants found" });
    }

    return res.status(200).json({
      success: true,
      message: "Applicant Declined!",
      updatedApplicants,
    });
  } catch (err) {
    console.log("Error occured:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const endHireProcess = async (req, res) => {
  try {
    const { jobId } = req.body;
    console.log(jobId);
    const job = await Job.findById(jobId)
      .populate({
        path: "applicants",
        options: { sort: { createdAt: -1 } },
        populate: { path: "talent" },
      })
      .populate({ path: "company" });
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    const applicants = job.applicants;

    //for each applicant not hired send an email to them that they have been declined and update their status to decline
    for (const applicant of applicants) {
      if (applicant.status !== "Hired") {
        const htmlContent = GenerateDeclineHtml(
          applicant.talent.firstName,
          job.role,
          job.company.companyName
        );
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: "omolojashade@gmail.com",
          subject: `Update on Your Application for the ${job.role} Role at ${job.company.companyName}`,
          html: htmlContent,
          attachments: [logoAttachment],
        };
        try {
          await sendEmail(mailOptions);
        } catch (err) {
          console.error("Could not send offer email:", err);
          return res
            .status(400)
            .json({ success: false, message: "Failed to send email" });
        }

        await Applicants.findOneAndUpdate(
          { job: jobId, talent: applicant.talent._id },
          { status: "Declined" },
          { upsert: true, new: true }
        );
      }
    }

    //get the updated job and update the job's status to closed
    const updatedJob = await Job.findByIdAndUpdate(jobId, {
      status: "Closed",
    }).populate({
      path: "applicants",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "talent",
      },
    });

    if (!updatedJob) {
      return res
        .status(400)
        .json({ success: false, message: "Error occured while closing job" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Job closed!", updatedJob });
  } catch (err) {
    console.log("Error occured:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
