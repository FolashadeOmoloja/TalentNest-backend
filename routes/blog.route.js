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
  .post(isAuthenticatedAdmin("admin"), singleUpload, createBlogPost);

// Get all blog posts
router.route("/get-blogs").get(isAuthenticatedAdmin("admin"), getAllBlogPosts);

// Edit a specific blog post by ID
router
  .route("/edit-blog/:id")
  .put(isAuthenticatedAdmin("admin"), singleUpload, editBlogPost);

// Delete a specific blog post by ID
router
  .route("/delete-blog/:id")
  .delete(isAuthenticatedAdmin("admin"), deleteBlogPost);

export default router;
