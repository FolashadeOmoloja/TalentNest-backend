import express from "express";
import isAuthenticatedAdmin from "../middleware/isAuthenticatedAdmin.js";
import {
  createBlogPost,
  getAllBlogPosts,
  editBlogPost,
  deleteBlogPost,
} from "../controllers/blog.controller.js";
import { singleUpload } from "../middleware/mutler.js";

const router = express.Router();

// Create a new blog post
router
  .route("/create-blog")
  .post(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    singleUpload,
    createBlogPost
  );

// Get all blog posts
router
  .route("/get-blogs")
  .get(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), getAllBlogPosts);

// Edit a specific blog post by ID
router
  .route("/edit-blog/:id")
  .put(
    isAuthenticatedAdmin(["SuperAdmin", "Admin"]),
    singleUpload,
    editBlogPost
  );

// Delete a specific blog post by ID
router
  .route("/delete-blog/:id")
  .delete(isAuthenticatedAdmin(["SuperAdmin", "Admin"]), deleteBlogPost);

export default router;
