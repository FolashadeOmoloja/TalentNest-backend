import express from "express";
import isAuthenticated from "../middleware/isAuthenticatedCompany.js";
import {
  getCompany,
  getCompanyById,
  registerCompany,
  updateCompany,
  loginCompany,
  getCompanyData,
  updateProfilePhoto,
  getCompanyNotification,
  updateCompanyNotificationById,
  updateAllCompanyNotifications,
  createCompanyNotification,
} from "../controllers/company.contoller.js";
import loginLimiter from "../middleware/rateLimiter.js";
import { logout } from "../controllers/user.controller.js";
import { singleUpload } from "../middleware/mutler.js";
const router = express.Router();

// Register a new company
router.route("/register").post(singleUpload, registerCompany);

// Login a company
router.route("/login").post(loginLimiter, loginCompany);
router.get("/data", isAuthenticated("company"), getCompanyData);
// Get the logged-in company's profile
router.route("/get").get(getCompany);

// Get a company profile by ID
router.route("/get/:id").get(isAuthenticated("company"), getCompanyById);

// Update the logged-in company's profile
router
  .route("/profile/update")
  .put(isAuthenticated("company"), singleUpload, updateCompany);
router
  .route("/update/profile-photo")
  .post(isAuthenticated("company"), singleUpload, updateProfilePhoto);
router
  .route("/create-company-notification")
  .post(isAuthenticated("company"), createCompanyNotification);
router
  .route("/get-company-notification")
  .get(isAuthenticated("company"), getCompanyNotification);
router
  .route("/delete-notice/:id")
  .delete(isAuthenticated("company"), updateCompanyNotificationById);
router
  .route("/delete-all-notice")
  .delete(isAuthenticated("company"), updateAllCompanyNotifications);
router.route("/logout").get(logout);

export default router;
