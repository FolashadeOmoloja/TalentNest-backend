import mongoose from "mongoose";

const reviewsSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    review: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Reviews = mongoose.model("Reviews", reviewsSchema);

export default Reviews;
