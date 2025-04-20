// backend/models/company.model.js
import mongoose from "mongoose";

const CompanySchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  profileImage: {
    type: String,
    default: null,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  countryCode: {
    type: String,
    required: true,
  },
  emailAddress: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  hex: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  linkedInUrl: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  industry: {
    type: [String], // Array of strings
    required: true,
  },
  companyRole: {
    type: String,
    required: true,
  },
  accountStatus: {
    type: String,
    enum: ["Active", "Recruiting", "Inactive"],
    default: "Active",
  },
  preference: {
    type: String,
    required: true,
  },
  privacyConsent: {
    type: Boolean,
    required: true,
  },
});

const Company = mongoose.model("Company", CompanySchema);

export default Company;
