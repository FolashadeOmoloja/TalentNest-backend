// backend/models/admin.model.js
import mongoose from "mongoose";

const AdminSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phoneNumber: {
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
  accountRole: {
    type: String,
    enum: ["SuperAdmin", "Admin"],
    default: "Admin",
  },
});

const Admin = mongoose.model("Admin", AdminSchema);

export default Admin;
