import mongoose from "mongoose";

const filterSchema = new mongoose.Schema(
  {
    skills: [{ type: String }],
    country: [{ type: String }],
    role: [{ type: String }],
  },
  { timestamps: true }
);

const Filters = mongoose.model("Filters", filterSchema);

export default Filters;
