import mongoose from "mongoose";

const baseOptions = {
  discriminatorKey: "role", // key to differentiate between different schemas
  collection: "users", // collection name in MongoDB
};

const BaseUserSchema = new mongoose.Schema(
  {
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
  },
  { ...baseOptions, timestamps: true }
);

const BaseUser = mongoose.model("BaseUser", BaseUserSchema);

export default BaseUser;
