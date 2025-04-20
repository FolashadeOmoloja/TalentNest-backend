import express from "express";
import {
  login,
  logout,
  registerTalent,
  updateProfile,
  updateProfilePhoto,
  updateSkills,
  getTalentNotification,
  updateTalentNotificationById,
  updateAllTalentNotifications,
} from "../controllers/user.controller.js";
import { getAllBlogPosts } from "../controllers/blog.controller.js";
import { getAllReviews } from "../controllers/reviews.controller.js";
import { getAllFaqs } from "../controllers/faq.controller.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { getFilters } from "../controllers/filters.controller.js";
import loginLimiter from "../middleware/rateLimiter.js";
import { singleUpload } from "../middleware/mutler.js";

const router = express.Router();

router.route("/registerTalent").post(singleUpload, registerTalent);
router.route("/login").post(loginLimiter, login);
router.route("/logout").get(logout);
router
  .route("/profile/update")
  .put(isAuthenticated("talent"), singleUpload, updateProfile);
router
  .route("/update/profile-photo")
  .post(isAuthenticated("talent"), singleUpload, updateProfilePhoto);
router.route("/update/skills").post(isAuthenticated("talent"), updateSkills);
router.route("/get-blogs").get(getAllBlogPosts);
router.route("/get-reviews").get(getAllReviews);
router.route("/get-faqs").get(getAllFaqs);
router.route("/get-filters").get(getFilters);
router
  .route("/get-talent-notification")
  .get(isAuthenticated("talent"), getTalentNotification);
router
  .route("/delete-notice/:id")
  .delete(isAuthenticated("talent"), updateTalentNotificationById);
router
  .route("/delete-all-notice")
  .delete(isAuthenticated("talent"), updateAllTalentNotifications);
router.route("/logout").get(logout);

export default router;
