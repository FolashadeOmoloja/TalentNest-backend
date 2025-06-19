// backend/models/applicant.model.js
import mongoose from "mongoose";

const applicantSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    talent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "talent",
      required: true,
    },
    score: { type: Number, default: 0 },
    feedback: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Under Review", "Shortlisted", "Interview", "Hired", "Declined"],
      default: "Under Review",
    },
  },
  { timestamps: true }
);

const Applicants = mongoose.model("applicant", applicantSchema);

export default Applicants;
