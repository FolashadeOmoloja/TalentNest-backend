import mongoose from "mongoose";
import BaseUser from "./user.model.js";

const TalentSchema = new mongoose.Schema({
  profession: {
    type: String,
    required: true,
  },
  experienceYears: {
    type: String,
    required: true,
  },
  experienceLevel: {
    type: String,
    required: true,
  },
  industry: {
    type: String,
    required: true,
  },
  accountStatus: {
    type: String,
    enum: ["Waitlist", "Shortlist", "Rejected"],
    default: "Waitlist",
  },
  resume: { type: String }, // URL to resume file
  resumeOriginalName: { type: String },
  preference: {
    type: String,
    required: true,
  },
  skills: [{ type: String }],
  privacyConsent: {
    type: Boolean,
    required: true,
  },
  channel: {
    type: String,
    required: false,
  },
});

const Talent = BaseUser.discriminator("talent", TalentSchema);

export default Talent;
