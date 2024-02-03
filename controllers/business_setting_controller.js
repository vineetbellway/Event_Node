const BusinessSettings = require("../models/business_settings.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");


exports.getBusinessSettings = async (req, res) => {
  try {
    const { key } = req.params;

    // Find the setting by key
    const settings = await BusinessSettings.find();
    if(settings.length > 0){
      res.status(200).json({
          status: true,
          message: "Settings retrieved successfully",
          data: settings[0],
        });
    } else {
      res.status(200).json({
          status: false,
          message: "No data found",
          data: null,
        });
    }

  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
      data : null
    });
  }
};

  
  





