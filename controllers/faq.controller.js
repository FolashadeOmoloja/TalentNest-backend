import FAQS from "../models/faq.model.js";
import { validationResult } from "express-validator";

export const createFaq = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { question, answer } = req.body;

    const faqs = new FAQS({ question, answer });
    await faqs.save();

    return res.status(201).json({
      message: "FAQ added successfully.",
      data: faqs,
      success: true,
    });
  } catch (error) {
    console.error("Error", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getAllFaqs = async (req, res) => {
  try {
    const faqs = await FAQS.find();

    return res.status(200).json({
      message:
        faqs.length > 0 ? "FAQs retrieved successfully" : "No FAQs available",
      data: faqs,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving FAQs", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const editFaqs = async (req, res) => {
  try {
    const { question, answer } = req.body;
    const { id } = req.params;

    const updatedFaqs = await FAQS.findByIdAndUpdate(
      id,
      { question, answer },
      { new: true }
    );
    if (!updatedFaqs) {
      return res.status(404).json({
        message: "FAQ not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "FAQ updated successfully",
      data: updatedFaqs,
      success: true,
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const deleteFaq = async (req, res) => {
  try {
    const { id } = req.params;

    const faq = await FAQS.findByIdAndDelete(id);
    if (!faq) {
      return res.status(404).json({
        message: "FAQ not found",
        success: false,
      });
    }

    return res.status(200).json({
      message: "FAQ deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
