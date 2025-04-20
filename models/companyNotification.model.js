import mongoose from "mongoose";

const companyNotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    senderMessage: {
      type: String,
      required: true,
    },
    receiverMessage: {
      type: String,
      required: true,
    },
    meetingUrl: {
      type: String,
      default: null,
    },
    groupId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const CompanyNotification = mongoose.model(
  "Notification",
  companyNotificationSchema
);

export default CompanyNotification;
