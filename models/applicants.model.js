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
    status: {
      type: String,
      enum: ["Under Review", "Interview", "Hired", "Declined"],
      default: "Under Review",
    },
  },
  { timestamps: true }
);

const Applicants = mongoose.model("applicant", applicantSchema);

export default Applicants;
