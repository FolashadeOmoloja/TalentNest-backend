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
import {
  createScheduledMeeting,
  deleteScheduledMeeting,
  getAllScheduledMeetings,
  updateScheduledMeeting,
} from "../controllers/scheduledMeeting.controller.js";
import {
  declineAndUpdateStatus,
  endHireProcess,
  generateOfferLetterDraft,
  sendOfferLetterAndUpdateStatus,
} from "../controllers/hireDecline.controller.js";

const router = express.Router();

// Register a new admin
router
  .route("/register")
  .post(isAuthenticatedAdmin(["SuperAdmin"]), registerAdmin);
router
  .route("/update-admin/:id")
  .put(isAuthenticatedAdmin(["SuperAdmin"]), updateAdmin);
router
  .route("/delete-admin/:id")
  .delete(isAuthenticatedAdmin(["SuperAdmin"]), deleteAdminAccount);
router
  .route("/reset-admin-password/:id")
  .put(isAuthenticatedAdmin(["SuperAdmin"]), resetAdminPassword);
router
  .route("/get-admin")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllAdmin);

// Login a admin
router.route("/login").post(loginLimiter, loginAdmin);
router.route("/logout").get(logout);
router
  .route("/get-talents")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllTalents);
router
  .route("/set-company-notification/:id")
  .post(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    createCompanyNotification
  );
router
  .route("/set-talent-notification/:id")
  .post(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    createTalentNotification
  );
router
  .route("/get-companies")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllCompanies);
router
  .route("/get-admin-notification")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAdminNotification);
router
  .route("/update-talent/:id")
  .put(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    updateTalentProfileStatus
  );
router
  .route("/delete-talent/:id")
  .delete(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteTalentProfile);
router
  .route("/delete-company/:id")
  .delete(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteCompanyProfile);
router
  .route("/delete-notice/:id")
  .delete(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    deleteAdminNotificationById
  );
router
  .route("/delete-all-notice")
  .delete(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    deleteAllAdminNotifications
  );

// Create a new review
router
  .route("/create-review")
  .post(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), createReview);

// Get all reviews
router
  .route("/get-reviews")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllReviews);

// Edit a specific review by ID
router
  .route("/edit-review/:id")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), editReview);

// Delete a specific review by ID
router
  .route("/delete-review/:id")
  .delete(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteReview);

// Create a new FAQ
router
  .route("/create-faq")
  .post(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), createFaq);

// Get all FAQs
router
  .route("/get-faqs")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllFaqs);

// Edit a specific FAQ by ID
router
  .route("/edit-faq/:id")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), editFaqs);

// Delete a specific FAQ by ID
router
  .route("/delete-faq/:id")
  .delete(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteFaq);

// Add a skill to the skills array
router
  .route("/add-skill")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), addSkill);

// Delete a skill from the skills array
router
  .route("/delete-skill")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteSkill);

// Add a country to the country array
router
  .route("/add-country")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), addCountry);

// Delete a country from the country array
router
  .route("/delete-country")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteCountry);

// Add a role to the role array
router
  .route("/add-role")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), addRole);

// Delete a role from the role array
router
  .route("/delete-role")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteRole);

// Get the entire Filters data
router
  .route("/get-filters")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getFilters);
router
  .route("/schedule-meeting")
  .post(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), createScheduledMeeting);
router
  .route("/get-schedule-meeting")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllScheduledMeetings);

router
  .route("/update-meeting/:id")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), updateScheduledMeeting);

router
  .route("/delete-meeting/:id")
  .delete(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    deleteScheduledMeeting
  );
router
  .route("/generate-offer-letter-draft")
  .post(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    generateOfferLetterDraft
  );
router
  .route("/send-offer-letter-hire")
  .post(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    sendOfferLetterAndUpdateStatus
  );
router
  .route("/decline-applicants")
  .post(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), declineAndUpdateStatus);
router
  .route("/end-hire-process")
  .post(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), endHireProcess);

export default router;
