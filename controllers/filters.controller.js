import Filters from "../models/filters.model.js";

// Add to skills array
export const addSkill = async (req, res) => {
  try {
    const { id, item } = req.body;
    const updatedFilter = await Filters.findByIdAndUpdate(
      id,
      { $addToSet: { skills: item } }, // addToSet ensures no duplicates
      { new: true }
    );

    return res.status(200).json({
      message: "Skill added successfully",
      data: updatedFilter,
      success: true,
    });
  } catch (error) {
    console.error("Error adding skill:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

// Add to country array
export const addCountry = async (req, res) => {
  try {
    const { id, item } = req.body;
    const updatedFilter = await Filters.findByIdAndUpdate(
      id,
      { $addToSet: { country: item } },
      { new: true }
    );

    return res.status(200).json({
      message: "Country added successfully",
      data: updatedFilter,
      success: true,
    });
  } catch (error) {
    console.error("Error adding country:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

// Add to role array
export const addRole = async (req, res) => {
  try {
    const { id, item } = req.body;
    const updatedFilter = await Filters.findByIdAndUpdate(
      id,
      { $addToSet: { role: item } },
      { new: true }
    );

    return res.status(200).json({
      message: "Role added successfully",
      data: updatedFilter,
      success: true,
    });
  } catch (error) {
    console.error("Error adding role:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

// Delete from skills array
export const deleteSkill = async (req, res) => {
  try {
    const { id, item } = req.body;
    const updatedFilter = await Filters.findByIdAndUpdate(
      id,
      { $pull: { skills: item } },
      { new: true }
    );

    return res.status(200).json({
      message: "Skill deleted successfully",
      data: updatedFilter,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

// Delete from country array
export const deleteCountry = async (req, res) => {
  try {
    const { id, item } = req.body;
    const updatedFilter = await Filters.findByIdAndUpdate(
      id,
      { $pull: { country: item } },
      { new: true }
    );

    return res.status(200).json({
      message: "Country deleted successfully",
      data: updatedFilter,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting country:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

// Delete from role array
export const deleteRole = async (req, res) => {
  try {
    const { id, item } = req.body;
    const updatedFilter = await Filters.findByIdAndUpdate(
      id,
      { $pull: { role: item } },
      { new: true }
    );

    return res.status(200).json({
      message: "Role deleted successfully",
      data: updatedFilter,
      success: true,
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export const getFilters = async (req, res) => {
  try {
    const filters = await Filters.find();

    if (!filters || filters.length === 0) {
      return res.status(200).json({
        message: "No filters available",
        data: null, // Returning null to indicate no filter data
        success: true,
      });
    }

    return res.status(200).json({
      message: "Filters retrieved successfully",
      data: filters[0], // Return only the first object
      success: true,
    });
  } catch (error) {
    console.error("Error retrieving filters:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
