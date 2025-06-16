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

    // const cohereRes = await cohere.generate({
    //   model: "command",
    //   prompt,
    //   max_tokens: 400,
    //   temperature: 0.7,
    // });
    // const draft = cohereRes.generations[0].text;
    const draft = `<p>Congratulations on your appointment as a Product Designer at Vertex Dynamics! We are thrilled to offer you this position, which we believe will be an excellent fit for your skills and experience.</p><p>Your employment start date will be Monday, March 23rd, 2025. We encourage you to confirm this date with your TalentNest Hiring representative and confirm that you are free to begin your employment during this time. </p><p>We are excited to have you join the Vertex Dynamics team! We value your unique point of view and the contributions you will make to our organization. As a Product Designer, we trust that your creativity and innovative thinking will bring fresh and exciting perspectives to our design projects. You'll be an integral part of our team, working closely with our talented professionals to create exceptional design solutions that deliver remarkable outcomes. We are confident that you will thrive in this role and look forward to witnessing the impact of your work.</p><p>Once again, congratulations! We at Vertex Dynamics and TalentNest Hiring are proud to welcome you aboard, and we eagerly anticipate working with you.</p><p>— The Vertex Dynamics Team (via TalentNest Hiring)</p>`;

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
  // const outputDir = path.resolve("/tmp/pdfs"); // safer than "../lib/pdfs" on serverless
  const outputDir = path.join(process.cwd(), "lib/pdfs");

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
    const { talentId, talentMail, jobRole, companyName, talentName, jobId } =
      req.body;
    const htmlContent = GenerateDeclineHtml(talentName, jobRole, companyName);
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: "omolojashade@gmail.com",
      subject: `Welcome to the Team – Your Offer Letter from ${companyName}`,
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
