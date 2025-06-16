import mongoose from "mongoose";
import Applicants from "../models/applicants.model.js";
import Job from "../models/job.model.js";
import AppliedJob from "../models/appliedjobs.model.js";

export const applyJob = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.id; // Assuming this is the talent ID
    const jobId = req.params.id;

    // Validate jobId and userId
    if (
      !mongoose.Types.ObjectId.isValid(jobId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({
        message: "Invalid job or user ID.",
        success: false,
      });
    }

    // Check if jobId is provided
    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required.",
        success: false,
      });
    }

    // Check if the user has already applied for the job
    const existingApplication = await Applicants.findOne({
      job: jobId,
      talent: userId, // Correct field name here
    }).session(session);

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job.",
        success: false,
      });
    }

    // Check if the job exists
    const job = await Job.findById(jobId).session(session);
    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }

    // Create a new application
    const newApplication = await Applicants.create(
      [
        {
          job: jobId,
          talent: userId, // Correct field name here
        },
      ],
      { session }
    );

    // Update the job with the new application
    job.applicants.push(newApplication[0]._id);
    await job.save({ session });

    // Push the jobId to the AppliedJob collection for the user
    let appliedJob = await AppliedJob.findOne({ userId }).session(session);

    // If no record exists for the user, create a new one
    if (!appliedJob) {
      appliedJob = new AppliedJob({
        userId,
        jobIds: [jobId],
      });
    } else {
      // Add the jobId to the applied job array if it's not already present
      if (!appliedJob.jobIds.includes(jobId)) {
        appliedJob.jobIds.push(jobId);
      }
    }

    // Save the applied job
    await appliedJob.save({ session });

    // Commit the transaction
    await session.commitTransaction();

    return res.status(201).json({
      message: "Application submitted successfully.",
      success: true,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await session.abortTransaction();
    console.error("Error applying for job:", error);

    return res.status(500).json({
      message:
        "An error occurred while applying for the job. Please try again later.",
      success: false,
    });
  } finally {
    session.endSession();
  }
};

export const getAppliedJobs = async (req, res) => {
  const userId = req.id;

  try {
    const appliedJob = await AppliedJob.findOne({ userId });

    if (!appliedJob) {
      return res.status(200).json({ jobIds: [] });
    }

    res.status(200).json({ jobIds: appliedJob.jobIds });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:
        "An error occurred while retrieving applicants. Please try again later.",
      success: false,
    });
  }
};

export const getAllAppliedJobs = async (req, res) => {
  try {
    const userId = req.id;

    // Validate userId
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
        success: false,
      });
    }

    // Find applications by talent ID and populate related job and company information
    const applications = await Applicants.find({ talent: userId }).sort({
      createdAt: -1,
    });
    // Check if applications are found
    if (applications.length === 0) {
      return res.status(404).json({
        message: "No applications found.",
        success: false,
      });
    }

    // Return successful response with applications data
    return res.status(200).json({
      applications,
      success: true,
    });
  } catch (error) {
    // Log the error and return a server error response
    console.error("Error retrieving applied jobs:", error);
    return res.status(500).json({
      message:
        "An error occurred while retrieving applied jobs. Please try again later.",
      success: false,
    });
  }
};

export const getApplicants = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Validate jobId
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID format.",
        success: false,
      });
    }

    // Find job by ID and populate applicants with talent details
    const job = await Job.findById(jobId).populate({
      path: "applicants",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "talent",
      },
    });

    // Check if job is found
    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }

    // Return successful response with job details and applicants
    return res.status(200).json({
      job,
      success: true,
    });
  } catch (error) {
    // Log the error and return a server error response
    console.error("Error retrieving applicants:", error);
    return res.status(500).json({
      message:
        "An error occurred while retrieving applicants. Please try again later.",
      success: false,
    });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const jobId = req.params.jobId;
    const applicantId = req.params.id;

    // Validate the status
    if (!status) {
      return res.status(400).json({
        message: "Status is required.",
        success: false,
      });
    }

    // Find the application by ID
    const application = await Applicants.findById(applicantId);
    if (!application) {
      return res.status(404).json({
        message: "Application not found.",
        success: false,
      });
    }

    // Update the application status
    application.status = status;
    await application.save();

    const job = await Job.findById(jobId).populate({
      path: "applicants",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "talent",
      },
    });

    return res.status(200).json({
      message: "Application status updated successfully.",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error updating application status:", error.message);
    return res.status(500).json({
      message:
        "An error occurred while updating the application status. Please try again later.",
      error: error.message,
      success: false,
    });
  }
};

export const getAllEmployed = async (req, res) => {
  try {
    // Find all applications with status "hired"
    const employedApplications = await Applicants.find({ status: "Hired" })
      .populate({
        path: "job",
        populate: {
          path: "company",
          model: "Company",
        },
        select: "title",
      })
      .populate({
        path: "talent",
        model: "talent",
      })
      .sort({ createdAt: -1 });

    if (!employedApplications || employedApplications.length === 0) {
      return res.status(404).json({
        message: "No employed records found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Employed talents retrieved successfully.",
      employed: employedApplications,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving employed talents:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving employed talents.",
      success: false,
    });
  }
};

export const getAllCompanyEmployed = async (req, res) => {
  try {
    const companyId = req.id;

    if (!companyId) {
      return res.status(400).json({
        message: "Company not found.",
        success: false,
      });
    }

    // Find all applications with status "Hired" and matching companyId
    const employedApplications = await Applicants.find({ status: "Hired" })
      .populate({
        path: "job",
        match: { company: companyId }, // Filter by company ID
        populate: {
          path: "company",
          model: "Company",
        },
        select: "title",
      })
      .populate({
        path: "talent",
        model: "talent",
      })
      .sort({ createdAt: -1 });

    // Filter out any jobs that didn't match the company ID
    const filteredApplications = employedApplications.filter((app) => app.job);

    if (filteredApplications.length === 0) {
      return res.status(404).json({
        message: "No employed records found for this company.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Employed talents for company retrieved successfully.",
      employed: filteredApplications,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving employed talents for company:", error);
    return res.status(500).json({
      message:
        "An error occurred while retrieving employed talents for the company.",
      success: false,
    });
  }
};

export const getAllAdminCompanyEmployed = async (req, res) => {
  try {
    const companyId = req.params.id;

    if (!companyId) {
      return res.status(400).json({
        message: "Company not found.",
        success: false,
      });
    }

    // Find all applications with status "Hired" and matching companyId
    const employedApplications = await Applicants.find({ status: "Hired" })
      .populate({
        path: "job",
        match: { company: companyId }, // Filter by company ID
        populate: {
          path: "company",
          model: "Company",
        },
        select: "title",
      })
      .populate({
        path: "talent",
        model: "talent",
      })
      .sort({ createdAt: -1 });

    // Filter out any jobs that didn't match the company ID
    const filteredApplications = employedApplications.filter((app) => app.job);

    if (filteredApplications.length === 0) {
      return res.status(404).json({
        message: "No employed records found for this company.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Employed talents for company retrieved successfully.",
      employed: filteredApplications,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving employed talents for company:", error);
    return res.status(500).json({
      message:
        "An error occurred while retrieving employed talents for the company.",
      success: false,
    });
  }
};

export const getAllCompanyApplicants = async (req, res) => {
  try {
    const companyId = req.id;

    if (!companyId) {
      return res.status(400).json({
        message: "Company not found.",
        success: false,
      });
    }

    const activeApplications = await Applicants.find()
      .populate({
        path: "job",
        match: { company: companyId }, // Filter by company ID
        populate: {
          path: "company",
          model: "Company",
        },
        select: "title",
      })
      .populate({
        path: "talent",
        model: "talent",
      })
      .sort({ createdAt: -1 });

    const interviewApplications = await Applicants.find({ status: "Interview" })
      .populate({
        path: "job",
        match: { company: companyId }, // Filter by company ID
        populate: {
          path: "company",
          model: "Company",
        },
        select: "title",
      })
      .populate({
        path: "talent",
        model: "talent",
      })
      .sort({ createdAt: -1 });
    // Filter out any jobs that didn't match the company ID
    const filteredActiveApplications = activeApplications.filter(
      (app) => app.job
    );
    const filteredInterviewApplications = interviewApplications.filter(
      (app) => app.job
    );

    if (filteredActiveApplications.length === 0) {
      return res.status(404).json({
        message: "No records found for this company.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Retrieved successfully.",
      active: filteredActiveApplications,
      interview: filteredInterviewApplications,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving applications for company:", error);
    return res.status(500).json({
      message:
        "An error occurred while retrieving applications for the company.",
      success: false,
    });
  }
};
