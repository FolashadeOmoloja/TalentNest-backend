import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import isAuthenticatedCompany from "../middleware/isAuthenticatedCompany.js";
import isAuthenticatedAdmin from "../middleware/isAuthenticatedAdmin.js";
import {
  applyJob,
  getApplicants,
  getAppliedJobs,
  getAllAppliedJobs,
  updateStatus,
  getAllEmployed,
  getAllCompanyEmployed,
  getAllCompanyApplicants,
  getAllAdminCompanyEmployed,
} from "../controllers/applicants.controller.js";
import { matchTalentsToJob } from "../controllers/resumematching.controller.js";

const router = express.Router();

router.route("/apply/:id").get(isAuthenticated("talent"), applyJob);

router.route("/get").get(isAuthenticated("talent"), getAppliedJobs);
router.route("/get-all").get(isAuthenticated("talent"), getAllAppliedJobs);
router
  .route("/get-hired-applicants")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllEmployed);
router
  .route("/get-company-hired-applicants")
  .get(isAuthenticatedCompany("company"), getAllCompanyEmployed);
router
  .route("/get-company-hired-applicants/:id")
  .get(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    getAllAdminCompanyEmployed
  );
router
  .route("/get-company-active-applicants")
  .get(isAuthenticatedCompany("company"), getAllCompanyApplicants);
router
  .route("/:id/talents")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getApplicants);
router
  .route("/:id/:jobId/status")
  .put(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), updateStatus);

router
  .route("/match-talents/:jobId")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), matchTalentsToJob);

export default router;
