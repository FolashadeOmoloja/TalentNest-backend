// backend/models/job.model.js
import mongoose from "mongoose";
import { nanoid } from "nanoid";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    salaryRange1: {
      type: String,
      required: true,
    },
    salaryRange2: {
      type: String,
      required: true,
    },
    jobProximity: {
      type: String,
      required: true,
    },
    jobHours: {
      type: String,
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    skills: [
      {
        type: String,
        required: true,
      },
    ],
    role: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    descriptionHtml: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      default: () => nanoid(12),
    },
    status: {
      type: String,
      enum: ["Open", "Closed"],
      default: "Open",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    embeddedJob: {
      type: [Number],
      default: [],
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "applicant",
      },
    ],
  },
  { timestamps: true }
);

const Job = mongoose.model("Job", jobSchema);

export default Job;
