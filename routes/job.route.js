import express from "express";
import isAuthenticatedCompany from "../middleware/isAuthenticatedCompany.js";
import isAuthenticatedAdmin from "../middleware/isAuthenticatedAdmin.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import {
  getCompanyJobs,
  getAllJobs,
  getJobById,
  postJob,
  editJob,
  getAdminCompanyJobs,
  adminDeleteCompanyJobs,
  getJobBySlug,
} from "../controllers/job.contoller.js";

const router = express.Router();

// Route for posting a job (company only)
router.route("/post").post(isAuthenticatedCompany("company"), postJob);

router.route("/edit/:id").put(isAuthenticatedCompany("company"), editJob);
// Routes for retrieving jobs (both companies and talents)
router.route("/get").get(getAllJobs);
// router.route("/talent/get").get(isAuthenticated("talent"), getAllJobs);

router.route("/get/:id").get(isAuthenticatedCompany("company"), getJobById);
router.route("/getJob/:slug").get(getJobBySlug);
router.route("/talent/get/:id").get(isAuthenticated("talent"), getJobById);

// Route for getting jobs posted by a specific company (company only)
router
  .route("/getCompanyJobs")
  .get(isAuthenticatedCompany("company"), getCompanyJobs);
router
  .route("/getSingleCompanyJobs/:id")
  .get(isAuthenticated(["SuperAdmin", "Admin"]), getAdminCompanyJobs);

router
  .route("/delete-job/:id/:jobId")
  .delete(isAuthenticated(["SuperAdmin", "Admin"]), adminDeleteCompanyJobs);

export default router;
