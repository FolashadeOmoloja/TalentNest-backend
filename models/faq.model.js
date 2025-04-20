import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    img: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const FAQS = mongoose.model("FAQ", faqSchema);

export default FAQS;
