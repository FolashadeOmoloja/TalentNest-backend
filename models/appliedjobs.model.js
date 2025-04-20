import mongoose from "mongoose";

const appliedJobSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // assuming you have a User model
    required: true,
  },
  jobIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job", // assuming you have a Job model
    },
  ],
});

const AppliedJob = mongoose.model("AppliedJob", appliedJobSchema);
export default AppliedJob;
