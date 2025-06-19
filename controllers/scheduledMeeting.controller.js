import ScheduledMeetings from "../models/scheduledMeetings.model.js";
import { sendCompanyEmail, sendInterviewEmail } from "../utils/sendEmail.js";
import { updateApplicantStatus } from "../utils/updateApplicantStatus.js";

export const createScheduledMeeting = async (req, res) => {
  try {
    const {
      recipientName,
      recipientEmail,
      createdBy,
      date,
      time,
      meetingUrl,
      jobTitle,
      company,
      companyId,
      applicantId,
      jobId,
    } = req.body;

    if (!recipientName || !recipientEmail || !createdBy || !date || !time) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    let updatedApplicants = [];

    const newMeetingData = {
      recipientName,
      recipientEmail,
      createdBy,
      date,
      time,
      meetingUrl,
      company,
      ...(companyId && { companyId }),
      ...(applicantId && { applicantId }),
      ...(jobId && { jobId }),
      ...(jobTitle && { jobTitle }),
    };

    const newMeeting = new ScheduledMeetings(newMeetingData);
    await newMeeting.save();

    if (applicantId && jobId) {
      updatedApplicants = await updateApplicantStatus(
        applicantId,
        jobId,
        "Interview"
      );
    }

    try {
      if (companyId) {
        await sendCompanyEmail(
          recipientName,
          company,
          recipientEmail,
          date,
          time,
          meetingUrl
        );
      } else {
        await sendInterviewEmail(
          recipientName,
          jobTitle,
          company,
          recipientEmail,
          date,
          time,
          meetingUrl
        );
      }
    } catch (emailError) {
      console.error("Error sending interview email:", emailError);
    }

    const updatedScheduledMeeting = await ScheduledMeetings.find();
    return res.status(201).json({
      message: "Meeting scheduled successfully.",
      success: true,
      updatedApplicants,
      updatedScheduledMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({
      message: "An error occurred while scheduling the meeting.",
      success: false,
      error: error.message,
    });
  }
};

export const getAllScheduledMeetings = async (req, res) => {
  try {
    const scheduledMeetings = await ScheduledMeetings.find().sort({
      createdAt: -1,
    });
    if (scheduledMeetings.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No scheduled meeting" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Scheduled Meeting", scheduledMeetings });
  } catch (error) {
    console.log("Error retrieving scheduled meetings: ", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateScheduledMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      recipientName,
      recipientEmail,
      createdBy,
      date,
      time,
      meetingUrl,
      jobTitle,
      company,
      companyId,
      applicantId,
      jobId,
    } = req.body;

    if (!recipientName || !recipientEmail || !createdBy || !date || !time) {
      return res.status(400).json({ message: "Required fields are missing." });
    }

    const updateMeetingData = {
      recipientName,
      recipientEmail,
      createdBy,
      date,
      time,
      meetingUrl,
      company,
      ...(companyId && { companyId }),
      ...(applicantId && { applicantId }),
      ...(jobId && { jobId }),
      ...(jobTitle && { jobTitle }),
    };
    const updatedMeeting = await ScheduledMeetings.findByIdAndUpdate(
      id,
      updateMeetingData,
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({
        message: "Meeting not found",
        success: false,
      });
    }

    try {
      if (companyId) {
        await sendCompanyEmail(
          recipientName,
          company,
          recipientEmail,
          date,
          time,
          meetingUrl
        );
      } else {
        await sendInterviewEmail(
          recipientName,
          jobTitle,
          company,
          recipientEmail,
          date,
          time,
          meetingUrl
        );
      }
    } catch (emailError) {
      console.error("Error sending interview email:", emailError);
    }

    const updatedScheduledMeeting = await ScheduledMeetings.find();
    return res.status(200).json({
      message: "Meeting updated successfully.",
      success: true,
      data: updatedMeeting,
      updatedScheduledMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({
      message: "An error occurred while scheduling the meeting.",
      success: false,
      error: error.message,
    });
  }
};
export const deleteScheduledMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMeeting = await ScheduledMeetings.findByIdAndDelete(id);

    if (!deletedMeeting) {
      return res.status(404).json({
        message: "Meeting not found",
        success: false,
      });
    }

    const updatedScheduledMeeting = await ScheduledMeetings.find();
    return res.status(200).json({
      message: "Meeting deleted successfully.",
      success: true,
      updatedScheduledMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the meeting.",
      success: false,
      error: error.message,
    });
  }
};
