import Applicants from "../models/applicants.model.js";
import Job from "../models/job.model.js";
import axios from "axios";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { embedText } from "../utils/embed.js";
import { cohere } from "../lib/cohere.js";

// Utility to download + extract
async function downloadResume(resumeUrl) {
  const response = await axios.get(resumeUrl, { responseType: "arraybuffer" });
  return response.data;
}

export async function extractResumeText(resumeUrl) {
  const buffer = await downloadResume(resumeUrl);
  if (resumeUrl.endsWith(".pdf")) {
    const parsed = await pdfParse(buffer);
    return parsed.text;
  } else if (resumeUrl.endsWith(".docx")) {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value;
  } else {
    throw new Error("Unsupported format");
  }
}

function formatJobDescription(job) {
  const {
    title,
    experience,
    role,
    department,
    country,
    skills,
    description,
    companyName,
  } = job;
  return `Job Title: ${title}\nExperience: ${experience}\nRole: ${role}\nDepartment: ${department}\nLocation: ${country}\n\n**Must-Have Skills:** ${skills.join(
    ", "
  )}\n\nCompany: ${companyName}\n\nDescription:\n${description}`;
}
export const generateFeedback = async (resumeText, jobRole, companyName) => {
  const prompt = `
You are an AI reviewing a resume for the position of ${jobRole} at ${companyName}.
Here's the resume:

""" 
${resumeText}
"""

In 1-2 concise sentences, explain why this applicant might be a good match.
`;

  try {
    const response = await cohere.generate({
      model: "command",
      prompt,
      max_tokens: 100,
      temperature: 0.4,
    });

    return response.generations?.[0]?.text?.trim() || "No feedback generated.";
  } catch (err) {
    console.error("Cohere feedback error:", err.message);
    return null;
  }
};

const calculateSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0;
  for (let i = 0; i < vecA.length; i++) dot += vecA[i] * vecB[i];

  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  return magA && magB ? dot / (magA * magB) : 0;
};

const keywordMatch = (resumeText, skills) => {
  const lowerText = resumeText.toLowerCase(); // Convert resume to lowercase for case-insensitive search

  const matches = skills.filter(
    (skill) => lowerText.includes(skill.toLowerCase()) // Check if each skill (case-insensitive) exists in the resume text
  );
  console.log("Keyword Match:", matches.length / skills.length);
  return matches.length / skills.length; // Return the proportion of skills found (e.g., 0.5 means 50% matched)
};

const experienceScore = (jobDescription, candidateYears) => {
  const match = jobDescription.match(/(\d+)\s*[-–]?\s*(\d+)?\s*years?/i);
  if (match) {
    const minYears = parseInt(match[1]);
    const maxYears = match[2] ? parseInt(match[2]) : minYears;
    if (!minYears) return 0;
    return candidateYears >= minYears ? 0.1 : 0;
  }
  return 0;
};

const roleMatch = (talentProfession, jobRole) => {
  if (!talentProfession || !jobRole) return 0;

  const prof = talentProfession.toLowerCase();
  const role = jobRole.toLowerCase();

  return prof.includes(role) || role.includes(prof) ? 0.2 : -0.2;
};

export const matchTalentsToJob = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    if (!jobId) {
      res.write(
        JSON.stringify({
          step: "init",
          success: false,
          message: "Job not found",
        }) + "\n"
      );
      return res.end();
    }

    // === Step 1: Extract Job + Resumes ===
    const job = await Job.findById(jobId);
    if (!job) {
      res.write(
        JSON.stringify({
          step: "extract",
          success: false,
          message: "Job not found",
        }) + "\n"
      );
      return res.end();
    }

    const applications = await Applicants.find({ job: jobId }).populate(
      "talent",
      "resume experienceYears profession experienceLevel skills"
    );

    const extractedResumes = [];

    for (const app of applications) {
      const talent = app.talent;
      if (!talent?.resume) continue;

      try {
        const text = await extractResumeText(talent.resume);
        if (text) {
          extractedResumes.push({ talent, text });
        }
      } catch (err) {
        console.error(
          `Failed to extract resume for ${talent._id}:`,
          err.message
        );
        continue;
      }
    }

    if (extractedResumes.length === 0) {
      res.write(
        JSON.stringify({
          step: "extract",
          success: false,
          message: "No valid resumes found",
        }) + "\n"
      );
      return res.end();
    }

    res.write(JSON.stringify({ step: "extract", success: true }) + "\n");

    // === Step 2: Embed Job + Resumes ===
    const formattedJD = formatJobDescription(job);
    const jobEmbedding = await embedText(formattedJD);

    if (!jobEmbedding) {
      res.write(
        JSON.stringify({
          step: "embed",
          success: false,
          message: "Failed to embed job description",
        }) + "\n"
      );
      return res.end();
    }

    const embeddedResumes = [];

    for (const resu of extractedResumes) {
      const resumeEmbedding = await embedText(resu.text);
      if (resumeEmbedding) {
        embeddedResumes.push({
          talent: resu.talent,
          text: resu.text,
          embedding: resumeEmbedding,
        });
      } else {
        console.error(`Failed to embed resume for ${resu.talent._id}`);
      }
    }

    res.write(JSON.stringify({ step: "embed", success: true }) + "\n");

    // === Step 3: Compare Similarities and Candidate Scores ===
    const matches = [];

    for (const r of embeddedResumes) {
      let keywordRaw = keywordMatch(r.text, job.skills);
      const keywordScore = keywordRaw < 0.3 ? 0 : keywordRaw;

      const similarity = calculateSimilarity(jobEmbedding, r.embedding);
      const experienceBonus = experienceScore(
        job.description,
        r.talent.experienceYears
      );
      const roleBonus = roleMatch(r.talent.profession, job.role);

      let totalScore = similarity + keywordScore + experienceBonus + roleBonus;
      if (totalScore > 1) totalScore = 1;

      matches.push({
        talentId: r.talent._id,
        score: totalScore,
      });
    }

    res.write(JSON.stringify({ step: "compare", success: true }) + "\n");

    // === Step 4: Update shortlisted ===
    for (const match of matches) {
      if (match.score > 0.5) {
        const resumeData = extractedResumes.find(
          (r) => r.talent._id.toString() === match.talentId.toString()
        );

        let feedback = null;
        if (resumeData?.text?.length > 300) {
          feedback = await generateFeedback(
            resumeData.text,
            job.role,
            job.companyName
          );
        }

        await Applicants.findOneAndUpdate(
          { job: jobId, talent: match.talentId },
          { score: match.score, status: "shortlisted", feedback },
          { upsert: true, new: true }
        );
      }
    }

    const updatedJob = await Job.findById(jobId).populate({
      path: "applicants",
      options: { sort: { createdAt: -1 } },
      populate: { path: "talent" },
    });

    // === Step 5: Done! Send matches ===
    res.end(
      JSON.stringify({
        step: "done",
        success: true,
        message: "Match complete",
        matches,
        updatedJob,
      })
    );
  } catch (err) {
    console.error("Match error:", err);
    res.write(
      JSON.stringify({ step: "error", success: false, message: err.message }) +
        "\n"
    );
    return res.end();
  }
};
