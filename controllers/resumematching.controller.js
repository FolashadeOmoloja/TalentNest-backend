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
export const generateFeedback = async (
  resumeText,
  jobRole,
  companyName,
  jobDescription
) => {
  const prompt = `
You are an AI assistant evaluating a resume for the role of ${jobRole} at ${companyName}.

Below is the applicant's resume:
"""
${resumeText}
"""

And here's the job description for reference:
"""
${jobDescription}
"""

In 2–3 concise sentences, provide a brief evaluation of the applicant. Highlight their key strengths and relevant experiences, mention any noticeable gaps or weaknesses in relation to the job description, and identify relevant skills or qualifications.
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

  const rawSim = magA && magB ? dot / (magA * magB) : 0;
  return Math.min(rawSim, 0.8); // Cap raw similarity at 0.8 to avoid runaway scores
};

const keywordMatch = (resumeText, skills) => {
  if (!resumeText || !skills?.length) return 0;

  const lowerText = resumeText.toLowerCase();
  const matches = skills.filter((skill) =>
    lowerText.includes(skill.toLowerCase())
  );

  const proportion = matches.length / skills.length;
  return Math.min(proportion * 0.03, 0.03);
};

// Experience Match - Max 3% bonus
const experienceScore = (jobDescription, experienceYears) => {
  const requiredMatch = jobDescription.match(/(\d+)\+?\s*(years|yrs)/i);
  const requiredYears = requiredMatch ? parseInt(requiredMatch[1], 10) : 0;

  if (!requiredYears || !experienceYears) return 0;

  // Extract numeric range, e.g., "2-4 years" → [2, 4]
  const rangeMatch = experienceYears.match(/(\d+)\s*-\s*(\d+)/);
  const singleMatch = experienceYears.match(/(\d+)/);

  let upperYears = 0;
  if (rangeMatch) {
    upperYears = parseInt(rangeMatch[2], 10); // Use the upper bound of range
  } else if (singleMatch) {
    upperYears = parseInt(singleMatch[1], 10); // Fallback for single value
  }

  if (!upperYears) return 0;

  if (upperYears >= requiredYears) return 0.03;
  if (upperYears >= requiredYears * 0.75) return 0.02;
  if (upperYears >= requiredYears * 0.5) return 0.01;

  return 0;
};

const roleMatch = (talentProfession, jobRole) => {
  if (!talentProfession || !jobRole) return 0;

  const talentTokens = talentProfession.toLowerCase().split(/\s+/);
  const jobTokens = jobRole.toLowerCase().split(/\s+/);

  const sharedTokens = jobTokens.filter((token) =>
    talentTokens.includes(token)
  );

  if (sharedTokens.length === 0) return 0;

  const bonus = Math.min(0.005 * sharedTokens.length, 0.03);
  return bonus;
};

// Main function to match talents to job

// export const matchTalentsToJob = async (req, res) => {
//   const timer = setTimeout(() => {
//     if (!res.writableEnded) {
//       console.error("⛔️ Timeout: force ending response");
//       res.write(JSON.stringify({ step: "timeout", success: false }) + "\n");
//       res.end();
//     }
//   }, 60000); // 60 seconds

//   try {
//     const jobId = req.params.jobId;
//     if (!jobId) {
//       res.write(
//         JSON.stringify({
//           step: "init",
//           success: false,
//           message: "Job not found",
//         }) + "\n"
//       );
//       return res.end();
//     }

//     console.log("🟡 Fetching job from DB...");
//     const job = await Job.findById(jobId);
//     if (!job) {
//       res.write(
//         JSON.stringify({
//           step: "extract",
//           success: false,
//           message: "Job not found",
//         }) + "\n"
//       );
//       return res.end();
//     }

//     console.log("🟡 Fetching applicants...");
//     const applications = await Applicants.find({ job: jobId }).populate(
//       "talent",
//       "resume experienceYears profession experienceLevel skills"
//     );

//     const extractedResumes = [];

//     for (const app of applications) {
//       const talent = app.talent;
//       if (!talent?.resume) continue;

//       try {
//         console.log(`📄 Extracting resume for ${talent._id}...`);
//         const text = await extractResumeText(talent.resume);
//         if (text) {
//           extractedResumes.push({ talent, text });
//         }
//       } catch (err) {
//         console.error(
//           `❌ Failed to extract resume for ${talent._id}:`,
//           err.message
//         );
//         continue;
//       }
//     }

//     if (extractedResumes.length === 0) {
//       res.write(
//         JSON.stringify({
//           step: "extract",
//           success: false,
//           message: "No valid resumes found",
//         }) + "\n"
//       );
//       return res.end();
//     }

//     res.write(JSON.stringify({ step: "extract", success: true }) + "\n");
//     console.log("✅ Resume extraction complete");

//     // === Step 2: Embed Job + Resumes ===
//     const formattedJD = formatJobDescription(job);
//     console.log("🔵 Embedding job description...");
//     const jobEmbedding = await embedText(formattedJD);

//     if (!jobEmbedding) {
//       res.write(
//         JSON.stringify({
//           step: "embed",
//           success: false,
//           message: "Failed to embed job description",
//         }) + "\n"
//       );
//       return res.end();
//     }

//     const embeddedResumes = [];

//     for (const resu of extractedResumes) {
//       console.log(`🔵 Embedding resume for ${resu.talent._id}...`);
//       const resumeEmbedding = await embedText(resu.text);
//       if (resumeEmbedding) {
//         embeddedResumes.push({
//           talent: resu.talent,
//           text: resu.text,
//           embedding: resumeEmbedding,
//         });
//       } else {
//         console.error(`❌ Failed to embed resume for ${resu.talent._id}`);
//       }
//     }

//     res.write(JSON.stringify({ step: "embed", success: true }) + "\n");
//     console.log("✅ Embedding complete");

//     // === Step 3: Compare Similarities and Candidate Scores ===
//     const matches = [];

//     for (const r of embeddedResumes) {
//       const keywordRaw = keywordMatch(r.text, job.skills);
//       const keywordScore = keywordRaw < 0.3 ? 0 : keywordRaw;

//       const similarity = calculateSimilarity(jobEmbedding, r.embedding);
//       const experienceBonus = experienceScore(
//         job.description,
//         r.talent.experienceYears
//       );
//       const roleBonus = roleMatch(r.talent.profession, job.role);

//       let totalScore = similarity + keywordScore + experienceBonus + roleBonus;
//       if (totalScore > 1) totalScore = 1;

//       matches.push({
//         talentId: r.talent._id,
//         score: totalScore,
//       });

//       console.log(
//         `📊 ${r.talent._id} — sim: ${similarity.toFixed(
//           2
//         )}, keyword: ${keywordScore.toFixed(
//           2
//         )}, exp: ${experienceBonus}, role: ${roleBonus}, total: ${totalScore}`
//       );
//     }

//     res.write(JSON.stringify({ step: "compare", success: true }) + "\n");
//     console.log("✅ Similarity comparison complete");

//     // === Step 4: Update shortlisted ===
//     for (const match of matches) {
//       if (match.score > 0.5) {
//         const resumeData = extractedResumes.find(
//           (r) => r.talent._id.toString() === match.talentId.toString()
//         );

//         let feedback = null;
//         if (resumeData?.text?.length > 300) {
//           console.log(`📝 Generating feedback for ${resumeData.talent._id}...`);
//           feedback = await generateFeedback(
//             resumeData.text,
//             job.role,
//             job.companyName
//           );
//         }

//         await Applicants.findOneAndUpdate(
//           { job: jobId, talent: match.talentId },
//           { score: match.score, status: "shortlisted", feedback },
//           { upsert: true, new: true }
//         );
//         console.log(`✅ Shortlisted ${match.talentId}`);
//       }
//     }

//     const updatedJob = await Job.findById(jobId).populate({
//       path: "applicants",
//       options: { sort: { createdAt: -1 } },
//       populate: { path: "talent" },
//     });

//     res.end(
//       JSON.stringify({
//         step: "done",
//         success: true,
//         message: "Match complete",
//         matches,
//         updatedJob,
//       }) + "\n"
//     );
//     console.log("✅ Matching process complete");
//   } catch (err) {
//     console.error("❌ Match error:", err);
//     if (!res.writableEnded) {
//       res.write(
//         JSON.stringify({
//           step: "error",
//           success: false,
//           message: err.message,
//         }) + "\n"
//       );
//     }
//   } finally {
//     clearTimeout(timer);
//     if (!res.writableEnded) {
//       res.end();
//       console.log("⚠️ Response ended via finally block");
//     }
//   }
// };

export const matchTalentsToJob = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const jobId = req.params.jobId;
    if (!jobId) {
      sendEvent({ step: "init", success: false, message: "Job not found" });
      return res.end();
    }

    const job = await Job.findById(jobId);
    if (!job) {
      sendEvent({ step: "extract", success: false, message: "Job not found" });
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
        console.log(`Extracting resume for ${talent._id}...`);
        const text = await extractResumeText(talent.resume);
        if (text) {
          extractedResumes.push({ talent, text });
        }
      } catch (err) {
        console.error(
          `Failed to extract resume for ${talent._id}:`,
          err.message
        );
      }
    }

    if (extractedResumes.length === 0) {
      sendEvent({
        step: "extract",
        success: false,
        message: "No valid resumes found",
      });
      return res.end();
    }

    sendEvent({ step: "extract", success: true });
    console.log("Resume extraction complete");

    // Step 2: Embed
    console.log("Embedding job description...");
    const jobEmbedding = await embedText(formatJobDescription(job));
    if (!jobEmbedding) {
      sendEvent({
        step: "embed",
        success: false,
        message: "Failed to embed job description",
      });
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
      }
    }
    sendEvent({ step: "embed", success: true });
    console.log("Embedding complete");

    // Step 3: Compare
    const matches = [];
    for (const r of embeddedResumes) {
      const keywordScore = Math.max(0, keywordMatch(r.text, job.skills));
      const similarity = calculateSimilarity(jobEmbedding, r.embedding);
      const experienceBonus = experienceScore(
        job.description,
        r.talent.experienceYears
      );
      const roleBonus = roleMatch(r.talent.profession, job.role);

      let totalScore = similarity + keywordScore + experienceBonus + roleBonus;
      totalScore = Math.min(totalScore, 1); // Cap at 1
      console.log(
        `Comparing ${r.talent._id} — sim: ${similarity.toFixed(
          2
        )}, keyword: ${keywordScore.toFixed(
          2
        )}, exp: ${experienceBonus}, role: ${roleBonus}, total: ${totalScore}`
      );

      matches.push({ talentId: r.talent._id, score: totalScore });
    }
    sendEvent({ step: "compare", success: true });
    console.log("Similarity comparison complete");

    // Step 4: Update shortlisted
    for (const match of matches) {
      if (match.score > 0.5) {
        const resumeData = extractedResumes.find(
          (r) => r.talent._id.toString() === match.talentId.toString()
        );
        const feedback =
          resumeData?.text?.length > 300
            ? await generateFeedback(resumeData.text, job.role, job.companyName)
            : null;

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

    sendEvent({
      step: "done",
      success: true,
      message: "Match complete",
      matches,
      updatedJob,
    });
    console.log("Matching process complete");
    res.end();
  } catch (err) {
    console.error("Match error:", err);
    if (!res.writableEnded) {
      sendEvent({ step: "error", success: false, message: err.message });
      res.end();
    }
  }
};
