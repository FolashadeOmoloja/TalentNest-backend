import mongoose from "mongoose";

const talentNotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "talent",
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
  },
  { timestamps: true }
);

const TalentNotification = mongoose.model(
  "TalentNotification",
  talentNotificationSchema
);

export default TalentNotification;
