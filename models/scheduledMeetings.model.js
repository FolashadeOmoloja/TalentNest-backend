import mongoose from "mongoose";

const scheduledMeetingsSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    createdBy: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    meetingUrl: { type: String, default: null },
    jobTitle: { type: String, default: null },
    company: { type: String, default: null },
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "talent",
      default: null,
    },
  },
  { timestamps: true }
);

const ScheduledMeetings = mongoose.model(
  "scheduledMeeting",
  scheduledMeetingsSchema
);

export default ScheduledMeetings;
