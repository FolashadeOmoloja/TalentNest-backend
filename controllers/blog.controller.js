import BlogPost from "../models/blog.model.js";
import cloudinary from "../utils/cloudinary.js";
import { validationResult } from "express-validator";

export const createBlogPost = async (req, res) => {
  try {
    // Validate incoming data using express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, author, blogImage, content } = req.body;

    // Check if all required fields are provided
    const requiredFields = [title, author, content];

    const missingFields = requiredFields.filter((field) => !field);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields,
        success: false,
      });
    }

    let imageUrl = null;

    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "blog-photos",
            public_id: `${title}_profile`,
            overwrite: true,
          },
          (error, uploadedResult) => {
            if (error) {
              return reject(error);
            }
            return resolve(uploadedResult);
          }
        );

        uploadStream.end(req.file.buffer);
      }).catch((error) => {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          message: "Blog post photo upload failed",
          success: false,
        });
      });

      imageUrl = result.secure_url;
    }

    const blogPost = new BlogPost({
      title,
      author,
      content,
      blogImage: imageUrl,
    });

    await blogPost.save();

    return res.status(201).json({
      message: "Blog Post Created Successfully.",
      blogPost,
      success: true,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getAllBlogPosts = async (req, res) => {
  try {
    const blogPosts = await BlogPost.find();

    if (blogPosts.length === 0) {
      return res.status(200).json({
        message: "No blog posts available",
        blogPosts: [],
        success: true,
      });
    }

    return res.status(200).json({
      message: "Blog posts retrieved successfully",
      blogPosts,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving blog posts:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const editBlogPost = async (req, res) => {
  try {
    const { title, author, content } = req.body;
    const { id } = req.params;
    const updateData = { title, author, content };

    // If a new image file is uploaded, update `blogImage` in Cloudinary
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "blog-photos",
            public_id: `${title}_profile`,
            overwrite: true,
          },
          (error, uploadedResult) => {
            if (error) {
              return reject(error);
            }
            return resolve(uploadedResult);
          }
        );
        uploadStream.end(req.file.buffer);
      }).catch((error) => {
        console.error("Cloudinary upload error:", error);
        return res.status(500).json({
          message: "Blog post photo update failed",
          success: false,
        });
      });

      updateData.blogImage = result.secure_url;
    }

    const updatedBlogPost = await BlogPost.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedBlogPost) {
      return res.status(404).json({
        message: "Blog post not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Blog post updated successfully",
      updatedBlogPost,
      success: true,
    });
  } catch (error) {
    console.error("Error updating blog post:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const blogPost = await BlogPost.findByIdAndDelete(id);
    if (!blogPost) {
      return res.status(404).json({
        message: "Blog post not found",
        success: false,
      });
    }

    if (blogPost.blogImage) {
      const publicId = `blog-photos/${blogPost.title}_profile`;
      await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Error deleting image from Cloudinary:", error);
        }
      });
    }

    return res.status(200).json({
      message: "Blog post deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
