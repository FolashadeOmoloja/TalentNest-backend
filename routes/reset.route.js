import express from "express";
import {
  sendResetEmail,
  verifyToken,
  resetPassword,
  sendContactEmail,
} from "../controllers/resetPassword.controller.js";

const router = express.Router();

router.route("/forgot-password").post(sendResetEmail);
router.route("/forgot-company-password").post(sendResetEmail);
router.route("/send-contact-email").post(sendContactEmail);
router.route("/update-password").post(resetPassword);
router.route("/verify-token").get(verifyToken);

export default router;
