const BusinessSettings = require("../models/business_settings.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");


exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    // Find the setting by key
    const setting = await BusinessSettings.findOne({ key });

    if (!setting) {
      return res.status(200).json({
        status: false,
        message: "Setting not found",
        data : null
      });
    }

    res.status(200).json({
      status: true,
      message: "Setting retrieved successfully",
      data: setting,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
      data : null
    });
  }
};

  
  





