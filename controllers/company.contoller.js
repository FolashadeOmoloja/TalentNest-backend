import Company from "../models/company.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import CompanyNotification from "../models/companyNotification.model.js";
import Admin from "../models/admin.model.js";
import { v4 as uuidv4 } from "uuid"; // For generating a unique group ID
import mongoose from "mongoose";
import CryptoJS from "crypto-js";

export const registerCompany = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      profileImage,
      phoneNumber,
      countryCode,
      emailAddress,
      password,
      country,
      hex,
      location,
      linkedInUrl,
      companyName,
      industry,
      accountStatus,
      companyRole,
      preference,
      privacyConsent,
    } = req.body;

    // Check if all required fields are provided
    const requiredFields = [
      firstName,
      lastName,
      phoneNumber,
      countryCode,
      emailAddress,
      password,
      country,
      hex,
      location,
      linkedInUrl,
      companyName,
      industry,
      companyRole,
      preference,
      privacyConsent,
    ];

    const missingFields = requiredFields.filter((field) => !field);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields,
        success: false,
      });
    }

    const existingCompany = await Company.findOne({ companyName });
    if (existingCompany) {
      return res.status(400).json({
        message: "This company is already registered.",
        success: false,
      });
    }

    const existingEmail = await Company.findOne({ emailAddress });
    if (existingEmail) {
      return res.status(400).json({
        message: "This email has already been registered.",
        success: false,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new company
    const newCompany = await Company.create({
      firstName,
      lastName,
      phoneNumber,
      countryCode,
      emailAddress,
      password: hashedPassword,
      country,
      hex,
      location,
      linkedInUrl,
      companyName,
      industry,
      companyRole,
      accountStatus,
      preference,
      profileImage,
      privacyConsent,
    });

    const userRole = "company";
    const hashedRole = CryptoJS.SHA256(userRole).toString();

    // Generate a JWT token
    const tokenData = {
      companyId: newCompany._id,
      role: "company",
    };

    const token = jwt.sign(tokenData, process.env.COMPANY_SECRET_KEY, {
      expiresIn: "1d",
    });

    return res
      .status(201)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
        httpOnly: true,
        sameSite: "None",
        secure: true,
        path: "/",
      })
      .json({
        message: "Company registered successfully",
        company: newCompany,
        hashedRole: hashedRole,
        success: true,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//Login Function
export const loginCompany = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    // Validate input
    if (!emailAddress || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
    }

    // Find company by email
    const company = await Company.findOne({ emailAddress });
    if (!company) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, company.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const userRole = "company";
    const hashedRole = CryptoJS.SHA256(userRole).toString();

    // Generate a JWT token
    const tokenData = {
      companyId: company._id,
      role: "company",
    };
    const token = jwt.sign(tokenData, process.env.COMPANY_SECRET_KEY, {
      expiresIn: "1d",
    });

    // Set cookies and respond
    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
        httpOnly: true,
        sameSite: "None",
        secure: true,
        path: "/",
      })
      .json({
        message: `Welcome back ${company.companyName}`,
        company,
        hashedRole: hashedRole,
        success: true,
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

//UPDATE COMPANY
export const updateCompany = async (req, res) => {
  try {
    const companyId = req.id;
    let company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
        success: false,
      });
    }

    const {
      firstName,
      lastName,
      profileImage,
      phoneNumber,
      countryCode,
      emailAddress,
      password,
      country,
      location,
      linkedInUrl,
      companyName,
      industry,
      companyRole,
      preference,
    } = req.body;

    // Update company's details
    if (firstName) company.firstName = firstName;
    if (lastName) company.lastName = lastName;
    if (profileImage) company.profileImage = profileImage;
    if (phoneNumber) company.phoneNumber = phoneNumber;
    if (countryCode) company.countryCode = countryCode;
    if (emailAddress && emailAddress !== company.emailAddress) {
      // Ensure the new email is not already taken
      const existingEmail = await Company.findOne({ emailAddress });
      if (existingEmail) {
        return res.status(400).json({
          message: "Email is already in use",
          success: false,
        });
      }
      company.emailAddress = emailAddress;
    }
    if (password) {
      // Validate the current password before allowing update
      const isPasswordMatch = await bcrypt.compare(
        req.body.currentPassword,
        company.password
      );
      if (!isPasswordMatch) {
        return res.status(400).json({
          message: "Incorrect current password",
          success: false,
        });
      }
      company.password = await bcrypt.hash(password, 10);
    }
    if (country) company.country = country;
    if (location) company.location = location;
    if (linkedInUrl) company.linkedInUrl = linkedInUrl;
    if (companyName) company.companyName = companyName;
    if (companyRole) company.companyRole = companyRole;
    if (industry) company.industry = industry;
    if (preference) company.preference = preference;

    // Save the updated company profile
    await company.save();

    return res.status(200).json({
      message: "Company information updated.",
      company,
      success: true,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getCompany = async (req, res) => {
  try {
    const companyId = req.id; // logged in user id
    const company = await Company.findOne({ _id: companyId });
    if (!company) {
      return res.status(404).json({
        message: "Company not found.",
        success: false,
      });
    }
    return res.status(200).json({
      company,
      success: true,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// get company by id
export const getCompanyById = async (req, res) => {
  try {
    const companyId = req.params.id;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found.",
        success: false,
      });
    }
    return res.status(200).json({
      company,
      success: true,
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// controllers/userController.js
export const getCompanyData = (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        role: "company",
        companyId: req.id,
        message: "Company information updated.",
      },
    });
  } catch (error) {
    console.error("error:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No profile photo uploaded",
        success: false,
      });
    }

    const companyId = req.id;
    let company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company not found",
        success: false,
      });
    }

    // Upload the profile photo to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "profile-photos",
          public_id: `${company.email}_profile`,
          overwrite: true,
        },
        (error, uploadedResult) => {
          if (error) {
            return reject(error);
          }
          return resolve(uploadedResult); // Resolve with the Cloudinary result
        }
      );

      uploadStream.end(req.file.buffer);
    }).catch((error) => {
      console.error("Cloudinary upload error:", error);
      return res.status(500).json({
        message: "Profile photo upload failed",
        success: false,
      });
    });

    company.profileImage = result.secure_url;

    await company.save();

    return res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: result.secure_url, // Return the new profile photo URL
      company,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const createCompanyNotification = async (req, res) => {
  try {
    const { receiverMessage, senderMessage, meetingUrl } = req.body;

    if (!receiverMessage || !senderMessage) {
      return res.status(400).json({
        message: "Receiver message and sender message are required.",
        success: false,
      });
    }

    const companyId = req.id;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company profile not found.",
        success: false,
      });
    }

    const admins = await Admin.find();
    const groupId = uuidv4(); // Generate a unique ID for this notification group

    const notifications = [];
    for (const admin of admins) {
      const notification = new CompanyNotification({
        sender: admin._id,
        receiver: companyId,
        senderMessage,
        receiverMessage,
        meetingUrl,
        groupId: groupId, // Add the unique group ID
      });

      await notification.save();
      notifications.push(notification);
    }

    return res.status(200).json({
      message: "Notifications sent successfully.",
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      message: "Failed to send notification.",
      success: false,
    });
  }
};

export const getCompanyNotification = async (req, res) => {
  try {
    const companyId = req.id;

    const companyNotifications = await CompanyNotification.aggregate([
      {
        $match: { receiver: new mongoose.Types.ObjectId(companyId) }, // Ensure companyId is an ObjectId
      },
      {
        $addFields: { groupId: { $ifNull: ["$groupId", "defaultGroupId"] } }, // Fallback groupId if missing
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: "$groupId", // Group by groupId to get only one per group
          receiverMessage: { $first: "$receiverMessage" },
          createdAt: { $first: "$createdAt" },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    if (companyNotifications.length === 0) {
      return res.status(404).json({
        message: "No notifications found.",
        success: false,
      });
    }

    return res.status(200).json({
      notifications: companyNotifications,
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    return res.status(500).json({
      message: "Failed to retrieve notifications.",
      success: false,
    });
  }
};

export const updateCompanyNotificationById = async (req, res) => {
  try {
    const companyId = req.id;
    const notificationId = req.params.id;

    // Attempt to update the CompanyNotification by setting the receiver to null
    const updatedCompanyNotice = await CompanyNotification.findOneAndUpdate(
      {
        _id: notificationId,
        receiver: companyId,
      },
      { receiver: null }, // Update receiver to null
      { new: true } // Return the updated document
    );

    // If the notice is not found, return 404
    if (!updatedCompanyNotice) {
      return res.status(404).json({
        message: "Notification unavailable.",
        success: false,
      });
    }

    // After updating, fetch the updated notifications list from the collection
    const updatedCompanyNotifications = await CompanyNotification.find({
      receiver: companyId,
    })
      .select("receiverMessage createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Notification deleted successfully.",
      notifications: updatedCompanyNotifications,
      success: true,
    });
  } catch (error) {
    console.error("Error updating notification:", error);
    return res.status(500).json({
      message: "An error occurred.",
      success: false,
    });
  }
};

export const updateAllCompanyNotifications = async (req, res) => {
  try {
    const companyId = req.id;

    // Update all notifications in CompanyNotification by setting receiver to null
    const updatedCompanyNotices = await CompanyNotification.updateMany(
      { receiver: companyId },
      { receiver: null } // Update receiver to null
    );

    // Check if no notifications were updated
    if (updatedCompanyNotices.modifiedCount === 0) {
      return res.status(404).json({
        message: "No notifications found to update.",
        success: false,
      });
    }

    // Return an empty list since all notifications are updated
    return res.status(200).json({
      message: "All notifications deleted successfully.",
      notifications: [], // Now the notifications list is empty
      success: true,
    });
  } catch (error) {
    console.error("Error updating all notifications:", error);
    return res.status(500).json({
      message: "An error occurred .",
      success: false,
    });
  }
};
