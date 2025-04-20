import Reviews from "../models/reviews.model.js";
import { validationResult } from "express-validator";

export const createReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, role, review } = req.body;

    const newReview = new Reviews({ fullname, role, review });
    await newReview.save();

    return res.status(201).json({
      message: "Review added successfully.",
      data: newReview,
      success: true,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Reviews.find();

    return res.status(200).json({
      message:
        reviews.length > 0
          ? "Reviews retrieved successfully"
          : "No reviews available",
      data: reviews,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving reviews:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const editReview = async (req, res) => {
  try {
    const { fullname, role, review } = req.body;
    const { id } = req.params;

    const updatedReview = await Reviews.findByIdAndUpdate(
      id,
      { fullname, role, review },
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({
        message: "Review not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Review updated successfully",
      data: updatedReview,
      success: true,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Reviews.findByIdAndDelete(id);
    if (!review) {
      return res.status(404).json({
        message: "Review not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Review deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
