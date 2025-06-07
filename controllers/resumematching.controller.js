import Applicants from "../models/applicants.model.js";
import Job from "../models/job.model.js";
import axios from "axios";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { embedText } from "../utils/embed.js";

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
  const { title, experience, role, department, country, skills, description } =
    job;

  return `
  Job Title: ${title}
  Experience Level: ${experience}
  Role: ${role}
  Department: ${department}
  Country: ${country}
  Skills Required: ${skills?.join(", ")}
  Description:
  ${description}
  `.trim();
}

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

    //  Extract
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
      "resume"
    );
    const extractedResumes = [];

    for (const app of applications) {
      const resumeUrl = app.talent?.resume;
      if (!resumeUrl) continue;

      const text = await extractResumeText(resumeUrl);
      if (text) {
        extractedResumes.push({ talentId: app.talent._id, text });
      }
    }

    if (extractedResumes.length === 0) {
      res.write(
        JSON.stringify({
          step: "extract",
          success: false,
          message: "Job not found",
        }) + "\n"
      );
      return res.end();
    }

    // Send back to frontend: extracting done
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
      const emb = await embedText(resu.text);
      if (!emb) {
        res.write(
          JSON.stringify({
            step: "embed",
            success: false,
            message: `Failed to embed resume for talent ${resu.talentId}`,
          }) + "\n"
        );
        return res.end();
      }

      embeddedResumes.push({ talentId: resu.talentId, embedding: emb });
    }

    res.write(JSON.stringify({ step: "embed", success: true }) + "\n");

    // === Step 3: Compare Similarities ===
    const calculateSimilarity = (vecA, vecB) => {
      if (vecA.length !== vecB.length) return 0;
      let dot = 0;
      for (let i = 0; i < vecA.length; i++) dot += vecA[i] * vecB[i];

      const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
      return magA && magB ? dot / (magA * magB) : 0;
    };

    const matches = embeddedResumes.map((r) => ({
      talentId: r.talentId,
      score: calculateSimilarity(jobEmbedding, r.embedding),
    }));

    res.write(JSON.stringify({ step: "compare", success: true }));

    for (const match of matches) {
      if (match.score > 0.35) {
        await Applicants.findOneAndUpdate(
          { job: jobId, talent: match.talentId },
          { score: match.score, status: "shortlisted" },
          { upsert: true, new: true }
        );
      }
    }

    const updatedJob = await Job.findById(jobId).populate({
      path: "applicants",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "talent",
      },
    });

    // === Step 4: Done! Send matches ===
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

// export const extractTalentResumesText = async (req, res) => {
//   try {
//     const jobId = req.params.jobId;

//     // Fetch job
//     const job = await Job.findById(jobId);
//     if (!job)
//       return res.status(404).json({ success: false, error: "Job not found" });

//     // Fetch applications with talent resumes
//     const applications = await Applicants.find({ job: jobId }).populate(
//       "talent",
//       "resume"
//     );

//     const extractedResumes = [];
//     for (const app of applications) {
//       const resumeUrl = app.talent?.resume;
//       if (!resumeUrl) continue;

//       const text = await extractResumeText(resumeUrl);
//       extractedResumes.push({
//         talentId: app.talent._id,
//         text,
//       });
//     }

//     // Format job data
//     const formattedJD = formatJobDescription(job);

//     //embeding job dedcription
//     const jobEmbedding = await embedText(formattedJD);

//     const embeddedResumes = [];

//     for (const res of extractedResumes) {
//       const embedding = await embedText(res.text);
//       embeddedResumes.push({
//         talentId: res.talentId,
//         embedding,
//       });
//     }

//     if (!jobEmbedding) {
//       return res
//         .status(500)
//         .json({ success: false, message: "Failed to embed " });
//     }

//     res.json({
//       success: true,
//       job: {
//         id: job._id,
//         formatted: formattedJD,
//         embedding: jobEmbedding,
//       },
//       resumes: embeddedResumes,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };
