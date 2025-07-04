import mongoose from "mongoose";
import Job from "../models/job.model.js";
import { validationResult } from "express-validator";
import CompanyNotification from "../models/companyNotification.model.js";
import Admin from "../models/admin.model.js";
import Company from "../models/company.model.js";

export const postJob = async (req, res) => {
  try {
    // Validate incoming data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      location,
      salaryRange1,
      salaryRange2,
      jobProximity,
      jobHours,
      experience,
      skills,
      role,
      country,
      department,
      description,
      descriptionHtml,
    } = req.body;

    const companyId = req.id;

    // Check if all required fields are provided
    const requiredFields = [
      title,
      location,
      salaryRange1,
      salaryRange2,
      jobProximity,
      jobHours,
      experience,
      skills,
      role,
      country,
      department,
      description,
      descriptionHtml,
    ];

    const missingFields = requiredFields.filter((field) => !field);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields,
        success: false,
      });
    }

    const jobPost = new Job({
      title,
      location,
      salaryRange1,
      salaryRange2,
      jobProximity,
      jobHours,
      experience,
      skills,
      role,
      country,
      department,
      description,
      descriptionHtml,
      company: companyId,
      created_by: companyId,
    });

    await jobPost.save();

    const company = await Company.findById(companyId);
    company.accountStatus = "Recruiting";
    await company.save();

    const admins = await Admin.find(); // Fetch all admins
    const senderMessage = `${company.companyName} added a new job post`;
    const receiverMessage = "You created a new job post";

    // Create notifications for each admin
    const notifications = [];
    for (const admin of admins) {
      const notification = new CompanyNotification({
        sender: admin._id,
        receiver: companyId,
        senderMessage,
        receiverMessage,
        meetingUrl: "", // Assign meetingUrl if needed, or set it to an empty string
      });

      await notification.save();
      notifications.push(notification);
    }

    return res.status(201).json({
      message: "Job Post Created Successfully.",
      job: jobPost,
      notifications,
      success: true,
    });
  } catch (error) {
    console.error("Error creating job post:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    // Simply retrieve all jobs without filtering by keyword
    const jobs = await Job.find()
      .populate("company", "companyName location profileImage")
      .sort({ createdAt: -1 });

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "No jobs found.",
        success: false,
      });
    }

    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving jobs:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// student
export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        message: "Invalid job ID.",
        success: false,
      });
    }

    const job = await Job.findById(jobId).populate({
      path: "applicants",
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }

    return res.status(200).json({
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving job by ID:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getCompanyJobs = async (req, res) => {
  try {
    const companyId = req.id;

    const jobs = await Job.find({ created_by: companyId })
      .populate("company", "companyName location")
      .sort({ createdAt: -1 });

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "No jobs found for this company.",
        success: false,
      });
    }

    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving company jobs:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getAdminCompanyJobs = async (req, res) => {
  try {
    const companyId = req.params.id;

    const jobs = await Job.find({ created_by: companyId })
      .populate("company", "companyName location")
      .sort({ createdAt: -1 });

    if (jobs.length === 0) {
      return res.status(404).json({
        message: "No jobs found for this company.",
        success: false,
      });
    }

    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving company jobs:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
export const adminDeleteCompanyJobs = async (req, res) => {
  try {
    const companyId = req.params.id;
    const jobId = req.params.jobId;

    // Find the job by its ID and ensure it was created by the specified company
    const job = await Job.findOne({ _id: jobId, created_by: companyId });

    if (!job) {
      return res.status(404).json({
        message: "Job not found for this company.",
        success: false,
      });
    }

    // If job is found, delete it
    await Job.findByIdAndDelete(jobId);
    const updatedJobs = await Job.find({ created_by: companyId })
      .populate("company", "companyName location")
      .sort({ createdAt: -1 });
    console.log(updatedJobs);

    return res.status(200).json({
      message: "Job deleted successfully.",
      jobs: updatedJobs,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    return res.status(500).json({
      message: "Internal server error.",
      success: false,
    });
  }
};

export const editJob = async (req, res) => {
  try {
    // Validate incoming data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      location,
      salaryRange1,
      salaryRange2,
      jobProximity,
      jobHours,
      experience,
      skills,
      role,
      country,
      department,
      employmentType,
      description,
      descriptionHtml,
      status,
    } = req.body;

    // Retrieve job ID from the request parameters and company ID from the authenticated request
    const jobId = req.params.id;
    const companyId = req.id;

    // Find the job by ID and ensure it was created by the current company
    let job = await Job.findOne({ _id: jobId, created_by: companyId });
    if (!job) {
      return res.status(404).json({
        message: "Job not found or you do not have permission to edit this job",
        success: false,
      });
    }

    // Update the job's details directly on the job object
    if (title) job.title = title;
    if (location) job.location = location;
    if (salaryRange1) job.salaryRange1 = salaryRange1;
    if (salaryRange2) job.salaryRange2 = salaryRange2;
    if (jobProximity) job.jobProximity = jobProximity;
    if (jobHours) job.jobHours = jobHours;
    if (experience) job.experience = experience;
    if (skills) job.skills = skills;
    if (role) job.role = role;
    if (country) job.country = country;
    if (department) job.department = department;
    if (employmentType) job.employmentType = employmentType;
    if (description) job.description = description;
    if (descriptionHtml) job.descriptionHtml = descriptionHtml;
    if (status) job.status = status;
    job.embeddedJob = []; //reset to an empty array for re-embedding
    // Save the updated job post
    await job.save();

    // If job is closed, check if any other jobs are open for the company
    if (status === "Closed") {
      const openJobs = await Job.find({
        created_by: companyId,
        status: "Open",
      });
      if (openJobs.length === 0) {
        const company = await Company.findById(companyId);
        if (company) {
          company.accountStatus = "Active";
          await company.save();
        }
      }
    }

    return res.status(200).json({
      message: "Job post updated successfully!",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error updating job post:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
