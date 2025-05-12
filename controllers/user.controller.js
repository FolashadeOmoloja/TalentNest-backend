import Talent from "../models/talent.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../utils/cloudinary.js";
import TalentNotification from "../models/talentNotification.model.js";
import CryptoJS from "crypto-js";

// Register Talent Function
export const registerTalent = async (req, res) => {
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
      profession,
      experienceYears,
      experienceLevel,
      industry,
      accountStatus,
      preference,
      skills,
      privacyConsent,
      channel,
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
      profession,
      experienceYears,
      experienceLevel,
      industry,
      preference,
      privacyConsent,
    ];

    // if (requiredFields.includes(undefined)) {
    //   return res.status(400).json({
    //     message: "All fields are required",
    //     success: false,
    //   });
    // }

    const missingFields = requiredFields.filter((field) => !field);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields, // Optionally show which fields are missing
        success: false,
      });
    }

    // Check if the user already exists
    const existingTalent = await Talent.findOne({ emailAddress });
    if (existingTalent) {
      return res.status(400).json({
        message: "User with this email already exists",
        success: false,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //cloudinary setup for filename upload i.e Upload resume to Cloudinary
    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
        success: false,
      });
    }

    // Upload resume to Cloudinary
    let resumeUrl;
    const sanitizedEmail = emailAddress.replace(/[^a-zA-Z0-9_.-]/g, "_");

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto", // Use auto to handle PDFs
          folder: "resumes",
          public_id: `${sanitizedEmail}_resume`, // Use sanitized email
          overwrite: true,
        },
        (error, uploadedResult) => {
          if (error) {
            return reject(error); // Cloudinary upload failed
          }
          return resolve(uploadedResult);
        }
      );

      // Ensure the file buffer is valid and in PDF format before uploading
      uploadStream.end(req.file.buffer);
    }).catch((error) => {
      console.error("Cloudinary upload error:", error);
      return res
        .status(500)
        .json({ message: "Resume upload failed", success: false });
    });

    // Get the uploaded resume URL
    resumeUrl = result.secure_url;
    let resumeOriginalName = req.file.originalname;

    // Create a new talent
    const newTalent = await Talent.create({
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
      profession,
      experienceYears,
      experienceLevel,
      industry,
      accountStatus,
      resume: resumeUrl, // URL to resume file
      resumeOriginalName: resumeOriginalName,
      preference,
      skills,
      profileImage,
      privacyConsent,
      channel: channel ? channel : null,
    });

    const userRole = "talent";
    const hashedRole = CryptoJS.SHA256(userRole).toString();

    // Generate a JWT token
    const tokenData = {
      userId: newTalent._id,
      role: "talent",
    };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
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
        message: `Registration is sucessful`,
        talent: newTalent,
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

// Login Function
export const login = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    // Validate input
    if (!emailAddress || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
    }

    // Find talent by email
    const talent = await Talent.findOne({ emailAddress });
    if (!talent) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, talent.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    const userRole = "talent";
    const hashedRole = CryptoJS.SHA256(userRole).toString();

    // Generate a JWT token
    const tokenData = {
      userId: talent._id,
      role: "talent",
    };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // Set cookie and respond
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
        message: `Welcome back ${talent.firstName} ${talent.lastName}`,
        talent,
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

// Logout Function
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
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

export const updateProfile = async (req, res) => {
  try {
    const talentId = req.id;
    let talent = await Talent.findById(talentId);

    if (!talent) {
      return res.status(404).json({
        message: "Talent not found",
        success: false,
      });
    }

    // Update only the fields that exist in the request body
    const {
      firstName,
      lastName,
      emailAddress,
      phoneNumber,
      countryCode,
      experienceLevel,
      experienceYears,
      industry,
      preference,
      password,
    } = req.body;

    if (firstName) talent.firstName = firstName;
    if (lastName) talent.lastName = lastName;
    if (emailAddress) talent.emailAddress = emailAddress;
    if (phoneNumber) talent.phoneNumber = phoneNumber;
    if (countryCode) talent.countryCode = countryCode;
    if (experienceLevel) talent.experienceLevel = experienceLevel;
    if (experienceYears) talent.experienceYears = experienceYears;
    if (industry) talent.industry = industry;
    if (preference) talent.preference = preference;

    if (password) {
      // Validate the current password before allowing update
      const isPasswordMatch = await bcrypt.compare(
        req.body.currentPassword,
        talent.password
      );
      if (!isPasswordMatch) {
        return res.status(400).json({
          message: "Incorrect current password",
          success: false,
        });
      }
      talent.password = await bcrypt.hash(password, 10);
    }

    // Handle resume file upload if a file is provided
    if (req.file) {
      const sanitizedEmail = talent.emailAddress.replace(/[^a-zA-Z0-9_.-]/g, "_");
      // Upload resume to Cloudinary or another file service
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: "resumes",
            public_id: `${sanitizedEmail}_resume`,
            overwrite: true,
            access_mode: "public",
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
        console.error("Resume upload error:", error);
        return res.status(500).json({
          message: "Resume upload failed",
          success: false,
        });
      });

      talent.resume = result.secure_url; // Update the resume URL
      talent.resumeOriginalName = req.file.originalname;
    }

    // Save the updated profile
    await talent.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      talent,
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

export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No profile photo uploaded",
        success: false,
      });
    }

    const talentId = req.id;
    let talent = await Talent.findById(talentId);
    if (!talent) {
      return res.status(404).json({
        message: "Talent not found",
        success: false,
      });
    }

    const sanitizedEmail = talent.emailAddress.replace(/[^a-zA-Z0-9_.-]/g, "_");
    // Upload the profile photo to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: "profile-photos",
          public_id: `${sanitizedEmail}_profile`,
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

    // Update the talent's profile image URL
    talent.profileImage = result.secure_url;

    // Save the updated talent profile
    await talent.save();

    return res.status(200).json({
      message: "Profile photo updated successfully",
      profileImage: result.secure_url, // Return the new profile photo URL
      talent,
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

export const updateSkills = async (req, res) => {
  try {
    const talentId = req.id;
    const { skills, action } = req.body; // Expecting action and skills

    // Find the talent by their ID
    let talent = await Talent.findById(talentId);
    if (!talent) {
      return res.status(404).json({
        message: "Talent not found",
        success: false,
      });
    }

    // Perform action based on the action type
    if (action === "add") {
      // Add skills
      talent.skills = Array.from(new Set([...talent.skills, ...skills])); // Avoid duplicates
    } else if (action === "remove") {
      // Remove skills
      talent.skills = talent.skills.filter((skill) => !skills.includes(skill));
    } else {
      return res.status(400).json({
        message: "Invalid action",
        success: false,
      });
    }

    // Save the updated talent profile
    await talent.save();

    return res.status(200).json({
      message: "Skills updated successfully",
      talent,
      skills: talent.skills,
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

export const getTalentNotification = async (req, res) => {
  try {
    const userId = req.id;

    // Fetch notifications sent by the talent for talents
    const talentNotifications = await TalentNotification.find({
      receiver: userId,
    })
      .select("receiverMessage createdAt")
      .sort({ createdAt: -1 });

    if (talentNotifications.length === 0) {
      return res.status(404).json({
        message: "No notifications found.",
        success: false,
      });
    }
    return res.status(200).json({
      notifications: talentNotifications,
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

export const updateTalentNotificationById = async (req, res) => {
  try {
    const talentId = req.id;
    const notificationId = req.params.id;

    // Attempt to update the TalentNotification by setting the receiver to null
    const updatedTalentNotice = await TalentNotification.findOneAndUpdate(
      {
        _id: notificationId,
        receiver: talentId,
      },
      { receiver: null }, // Update receiver to null
      { new: true } // Return the updated document
    );

    // If the notice is not found, return 404
    if (!updatedTalentNotice) {
      return res.status(404).json({
        message: "Notification unavailable.",
        success: false,
      });
    }

    // After updating, fetch the updated notifications list from the collection
    const updatedTalentNotifications = await TalentNotification.find({
      receiver: talentId,
    })
      .select("receiverMessage createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Notification deleted successfully.",
      notifications: updatedTalentNotifications,
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

export const updateAllTalentNotifications = async (req, res) => {
  try {
    const talentId = req.id;

    // Update all notifications in TalentNotification by setting receiver to null
    const updatedTalentNotices = await TalentNotification.updateMany(
      { receiver: talentId },
      { receiver: null } // Update receiver to null
    );

    // Check if no notifications were updated
    if (updatedTalentNotices.modifiedCount === 0) {
      return res.status(404).json({
        message: "No notifications found to update.",
        success: false,
      });
    }

    // Return an empty list since all notifications are updated
    return res.status(200).json({
      message: "All notifications deleted successfully.",
      notifications: [],
      success: true,
    });
  } catch (error) {
    console.error("Error updating all notifications:", error);
    return res.status(500).json({
      message: "An error occurred.",
      success: false,
    });
  }
};
