import Applicants from "../models/applicants.model.js";
import Job from "../models/job.model.js";

export const updateApplicantStatus = async (applicantId, jobId, status) => {
  if (!applicantId || !jobId) {
    throw new Error("applicantId and jobId are required");
  }

  const updatedApplication = await Applicants.findOneAndUpdate(
    { job: jobId, talent: applicantId },
    { status: status },
    { upsert: true, new: true }
  );

  if (!updatedApplication) {
    throw new Error("Application not found");
  }

  const updatedApplicants = await Job.findById(jobId).populate({
    path: "applicants",
    options: { sort: { createdAt: -1 } },
    populate: {
      path: "talent",
    },
  });

  return updatedApplicants;
};
