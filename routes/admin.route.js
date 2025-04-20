import express from "express";
import isAuthenticatedAdmin from "../middleware/isAuthenticatedAdmin.js";
import {
  registerAdmin,
  updateAdmin,
  deleteAdminAccount,
  resetAdminPassword,
  loginAdmin,
  getAllAdmin,
  getAllTalents,
  updateTalentProfileStatus,
  deleteTalentProfile,
  deleteCompanyProfile,
  getAllCompanies,
  createCompanyNotification,
  createTalentNotification,
  getAdminNotification,
  deleteAdminNotificationById,
  deleteAllAdminNotifications,
} from "../controllers/admin.controller.js";
import {
  createReview,
  getAllReviews,
  deleteReview,
  editReview,
} from "../controllers/reviews.controller.js";
import {
  createFaq,
  deleteFaq,
  editFaqs,
  getAllFaqs,
} from "../controllers/faq.controller.js";
import loginLimiter from "../middleware/rateLimiter.js";
import {
  addSkill,
  deleteSkill,
  addCountry,
  deleteCountry,
  addRole,
  deleteRole,
  getFilters,
} from "../controllers/filters.controller.js";
import { logout } from "../controllers/user.controller.js";

const router = express.Router();

// Register a new admin
router.route("/register").post(isAuthenticatedAdmin("admin"), registerAdmin);
router
  .route("/update-admin/:id")
  .put(isAuthenticatedAdmin("admin"), updateAdmin);
router
  .route("/delete-admin/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteAdminAccount);
router
  .route("/reset-admin-password/:id")
  .put(isAuthenticatedAdmin("admin"), resetAdminPassword);
router.route("/get-admin").get(isAuthenticatedAdmin("admin"), getAllAdmin);

// Login a admin
router.route("/login").post(loginLimiter, loginAdmin);
router.route("/logout").get(logout);
router.route("/get-talents").get(isAuthenticatedAdmin("admin"), getAllTalents);
router
  .route("/set-company-notification/:id")
  .post(isAuthenticatedAdmin("admin"), createCompanyNotification);
router
  .route("/set-talent-notification/:id")
  .post(isAuthenticatedAdmin("admin"), createTalentNotification);
router
  .route("/get-companies")
  .get(isAuthenticatedAdmin("admin"), getAllCompanies);
router
  .route("/get-admin-notification")
  .get(isAuthenticatedAdmin("admin"), getAdminNotification);
router
  .route("/update-talent/:id")
  .put(isAuthenticatedAdmin("admin"), updateTalentProfileStatus);
router
  .route("/delete-talent/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteTalentProfile);
router
  .route("/delete-company/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteCompanyProfile);
router
  .route("/delete-notice/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteAdminNotificationById);
router
  .route("/delete-all-notice")
  .delete(isAuthenticatedAdmin("admin"), deleteAllAdminNotifications);

// Create a new review
router
  .route("/create-review")
  .post(isAuthenticatedAdmin("admin"), createReview);

// Get all reviews
router.route("/get-reviews").get(isAuthenticatedAdmin("admin"), getAllReviews);

// Edit a specific review by ID
router.route("/edit-review/:id").put(isAuthenticatedAdmin("admin"), editReview);

// Delete a specific review by ID
router
  .route("/delete-review/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteReview);

// Create a new FAQ
router.route("/create-faq").post(isAuthenticatedAdmin("admin"), createFaq);

// Get all FAQs
router.route("/get-faqs").get(isAuthenticatedAdmin("admin"), getAllFaqs);

// Edit a specific FAQ by ID
router.route("/edit-faq/:id").put(isAuthenticatedAdmin("admin"), editFaqs);

// Delete a specific FAQ by ID
router
  .route("/delete-faq/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteFaq);

// Add a skill to the skills array
router.route("/add-skill").put(isAuthenticatedAdmin("admin"), addSkill);

// Delete a skill from the skills array
router.route("/delete-skill").put(isAuthenticatedAdmin("admin"), deleteSkill);

// Add a country to the country array
router.route("/add-country").put(isAuthenticatedAdmin("admin"), addCountry);

// Delete a country from the country array
router
  .route("/delete-country")
  .put(isAuthenticatedAdmin("admin"), deleteCountry);

// Add a role to the role array
router.route("/add-role").put(isAuthenticatedAdmin("admin"), addRole);

// Delete a role from the role array
router.route("/delete-role").put(isAuthenticatedAdmin("admin"), deleteRole);

// Get the entire Filters data
router.route("/get-filters").get(isAuthenticatedAdmin("admin"), getFilters);

export default router;
