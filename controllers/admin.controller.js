import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Talent from "../models/talent.model.js";
import Company from "../models/company.model.js";
import CompanyNotification from "../models/companyNotification.model.js";
import TalentNotification from "../models/talentNotification.model.js";
import { v4 as uuidv4 } from "uuid"; // Import UUID for unique IDs

export const registerAdmin = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      emailAddress,
      password,
      accountRole,
    } = req.body;

    const superAdminId = req.id;
    const superAdmin = await Admin.findById(superAdminId);
    if (!superAdmin || superAdmin.accountRole !== "SuperAdmin") {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }

    // Check if all required fields are provided
    const requiredFields = [
      firstName,
      lastName,
      phoneNumber,
      emailAddress,
      password,
      accountRole,
    ];

    const missingFields = requiredFields.filter((field) => !field);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields,
        success: false,
      });
    }

    const existingAdmin = await Admin.findOne({ firstName });
    if (existingAdmin) {
      return res.status(400).json({
        message: "Admin already registered.",
        success: false,
      });
    }

    const existingEmail = await Admin.findOne({ emailAddress });
    if (existingEmail) {
      return res.status(400).json({
        message: "This email has already been registered.",
        success: false,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new admin
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      phoneNumber,
      emailAddress,
      password: hashedPassword,
      accountRole,
    });

    // Generate a JWT token
    const tokenData = {
      adminId: newAdmin._id,
      role: "admin",
    };

    const token = jwt.sign(tokenData, process.env.ADMIN_SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      admin: newAdmin,
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

export const updateAdmin = async (req, res) => {
  try {
    const adminId = req.params.id;
    let admin = await Admin.findById(adminId);

    const { firstName, lastName, phoneNumber, emailAddress, accountRole } =
      req.body;
    const superAdminId = req.id;
    const superAdmin = await Admin.findById(superAdminId);
    if (!superAdmin || superAdmin.accountRole !== "SuperAdmin") {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (emailAddress) admin.emailAddress = emailAddress;
    if (phoneNumber) admin.phoneNumber = phoneNumber;
    if (accountRole) admin.accountRole = accountRole;

    await admin.save();

    return res.status(201).json({
      message: "Admin account updated",
      admin,
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

export const deleteAdminAccount = async (req, res) => {
  try {
    const adminId = req.params.id;
    const superAdminId = req.id;
    const superAdmin = await Admin.findById(superAdminId);
    if (!superAdmin || superAdmin.accountRole !== "SuperAdmin") {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return res.status(404).json({
        message: "Admin account not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Adnib admin deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting admin account:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the admin account.",
      success: false,
    });
  }
};

export const resetAdminPassword = async (req, res) => {
  try {
    const superAdminId = req.id;
    const adminId = req.params.id;
    const { password } = req.body;

    const superAdmin = await Admin.findById(superAdminId);
    if (!superAdmin || superAdmin.accountRole !== "SuperAdmin") {
      return res.status(403).json({
        message: "Access denied",
        success: false,
      });
    }

    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        message: "Admin not found",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const salt = await bcrypt.genSalt(10);
    admin.password = hashedPassword;

    await admin.save();

    return res.status(200).json({
      message: "Admin password reset successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export const getAllAdmin = async (req, res) => {
  try {
    const admins = await Admin.find().sort({ createdAt: -1 }); // Sorting by creation date (most recent first)

    if (!admins || admins.length === 0) {
      return res.status(404).json({
        message: "No admin added.",
        success: false,
      });
    }

    return res.status(200).json({
      admins,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

//Login Function
export const loginAdmin = async (req, res) => {
  try {
    const { emailAddress, password } = req.body;

    // Validate input
    if (!emailAddress || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
        success: false,
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ emailAddress });
    if (!admin) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // Compare passwords
    const isPasswordMatch = await bcrypt.compare(password, admin.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password",
        success: false,
      });
    }

    // Generate a JWT token
    const tokenData = {
      adminId: admin._id,
      role: "admin",
    };
    const token = jwt.sign(tokenData, process.env.ADMIN_SECRET_KEY, {
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
        message: `Welcome back ${admin.firstName}`,
        admin,
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

export const getAllTalents = async (req, res) => {
  try {
    const talents = await Talent.find().sort({ createdAt: -1 }); // Sorting by creation date (most recent first)

    if (!talents || talents.length === 0) {
      return res.status(404).json({
        message: "No talents found.",
        success: false,
      });
    }

    return res.status(200).json({
      talents,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    if (!companies || companies.length === 0) {
      return res.status(404).json({
        message: "No companies  found.",
        success: false,
      });
    }

    return res.status(200).json({
      companies,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error. Please try again later.",
      success: false,
    });
  }
};

export const updateTalentProfileStatus = async (req, res) => {
  try {
    const talentId = req.params.id;
    let talent = await Talent.findById(talentId);

    if (!talent) {
      return res.status(404).json({
        message: "Talent not found",
        success: false,
      });
    }

    const { accountStatus } = req.body;

    if (accountStatus) talent.accountStatus = accountStatus;
    await talent.save();

    return res.status(200).json({
      message: "Talent Status updated successfully",
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

export const deleteTalentProfile = async (req, res) => {
  try {
    const talentId = req.params.id;
    const deletedTalent = await Talent.findByIdAndDelete(talentId);

    if (!deletedTalent) {
      return res.status(404).json({
        message: "Talent profile not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Talent profile deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting talent profile:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the talent profile.",
      success: false,
    });
  }
};

export const deleteCompanyProfile = async (req, res) => {
  try {
    const companyId = req.params.id;
    const deletedCompany = await Company.findByIdAndDelete(companyId);

    if (!deletedCompany) {
      return res.status(404).json({
        message: "Company profile not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Company profile deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting company profile:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the company profile.",
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

    const senderId = req.id;
    const companyId = req.params.id;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        message: "Company profile not found.",
        success: false,
      });
    }

    // Generate a unique groupId for this notification
    const groupId = uuidv4();

    const notification = new CompanyNotification({
      sender: senderId,
      receiver: companyId,
      senderMessage,
      receiverMessage,
      meetingUrl,
      groupId: groupId, // Assign unique groupId
    });

    await notification.save();

    return res.status(200).json({
      message: "Notification sent successfully.",
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      message: "Failed to send notification.",
      success: false,
    });
  }
};

export const createTalentNotification = async (req, res) => {
  try {
    const { receiverMessage, senderMessage, meetingUrl } = req.body;

    if (!receiverMessage || !senderMessage) {
      return res.status(400).json({
        message: "Receiver message and sender message are required.",
        success: false,
      });
    }

    const senderId = req.id;
    const talentId = req.params.id;
    const talent = await Talent.findById(talentId);
    if (!talent) {
      return res.status(404).json({
        message: "Talent profile not found.",
        success: false,
      });
    }

    const notification = new TalentNotification({
      sender: senderId,
      receiver: talentId,
      senderMessage,
      receiverMessage,
      meetingUrl,
    });

    await notification.save();

    return res.status(200).json({
      message: "Notification sent successfully.",
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({
      message: "Failed to send notification.",
      success: false,
    });
  }
};
export const getAdminNotification = async (req, res) => {
  try {
    const adminId = req.id;

    // Fetch notifications sent by the admin for companies
    const companyNotifications = await CompanyNotification.find({
      sender: adminId,
    })
      .select("senderMessage createdAt")
      .sort({ createdAt: -1 });

    // Fetch notifications sent by the admin for talents
    const talentNotifications = await TalentNotification.find({
      sender: adminId,
    })
      .select("senderMessage createdAt")
      .sort({ createdAt: -1 });

    const notifications = [...companyNotifications, ...talentNotifications];
    if (notifications.length === 0) {
      return res.status(404).json({
        message: "No notifications found.",
        success: false,
      });
    }
    return res.status(200).json({
      notifications,
      companyNotifications,
      talentNotifications,
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

export const deleteAdminNotificationById = async (req, res) => {
  try {
    const adminId = req.id;
    const notificationId = req.params.id;

    // Attempt to delete from CompanyNotification
    const deletedCompanyNotice = await CompanyNotification.findOneAndDelete({
      _id: notificationId,
      sender: adminId,
    });

    // Attempt to delete from TalentNotification
    const deletedTalentNotice = await TalentNotification.findOneAndDelete({
      _id: notificationId,
      sender: adminId,
    });

    // If neither notice is found, return 404
    if (!deletedCompanyNotice && !deletedTalentNotice) {
      return res.status(404).json({
        message: "Notification unavailable.",
        success: false,
      });
    }

    // After deletion, fetch the updated notifications list from both collections
    const updatedCompanyNotifications = await CompanyNotification.find({
      sender: adminId,
    })
      .select("senderMessage createdAt")
      .sort({ createdAt: -1 });

    const updatedTalentNotifications = await TalentNotification.find({
      sender: adminId,
    })
      .select("senderMessage createdAt")
      .sort({ createdAt: -1 });

    // Combine the notifications
    const updatedNotifications = [
      ...updatedCompanyNotifications,
      ...updatedTalentNotifications,
    ];

    return res.status(200).json({
      message: "Notification deleted successfully.",
      notifications: updatedNotifications,
      companyNotifications: updatedCompanyNotifications,
      talentNotifications: updatedTalentNotifications,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({
      message: "An error occurred while deleting.",
      success: false,
    });
  }
};

export const deleteAllAdminNotifications = async (req, res) => {
  try {
    const adminId = req.id;

    // Delete all notifications from CompanyNotification
    const deletedCompanyNotices = await CompanyNotification.deleteMany({
      sender: adminId,
    });

    // Delete all notifications from TalentNotification
    const deletedTalentNotices = await TalentNotification.deleteMany({
      sender: adminId,
    });

    // Check if no notifications were deleted in either collection
    if (
      deletedCompanyNotices.deletedCount === 0 &&
      deletedTalentNotices.deletedCount === 0
    ) {
      return res.status(404).json({
        message: "No notifications found to delete.",
        success: false,
      });
    }

    // Return an empty list since all notifications are deleted
    return res.status(200).json({
      message: "All notifications deleted successfully.",
      notifications: [], // Now the notifications list is empty
      companyNotifications: [],
      talentNotifications: [],
      success: true,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return res.status(500).json({
      message: "An error occurred while deleting notifications.",
      success: false,
    });
  }
};
