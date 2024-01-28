const BusinessSettings = require("../../models/business_settings.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../../utils/enumerator");


exports.getAllSettings = async (req, res) => {
    try {
      const settings = await BusinessSettings.find();
      if(settings.length > 0){
        res.status(200).json({
            status: true,
            message: "Settings retrieved successfully",
            data: settings,
          });
      } else {
        res.status(200).json({
            status: false,
            message: "No data found",
            data: [],
          });
      }
  
      
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
        data : null
      });
    }
  }

  exports.manageSetting = async (req, res) => {
    try {
      const { setting_data } = req.body;
  
      if (!setting_data || !Array.isArray(setting_data)) {
        return res.status(400).json({
          status: false,
          message: "Invalid setting data format",
        });
      }
  
      for (const setting of setting_data) {
        const { key, value } = setting;
  
        // Convert object value to string if it's an object
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
  
        // Check if the key already exists
        let existingSetting = await BusinessSettings.findOne({ key });
  
        if (existingSetting) {
          // Update the existing setting
          existingSetting.value = stringValue;
          await existingSetting.save();
        } else {
          // Create a new setting
          const newSetting = new BusinessSettings({ key, value: stringValue });
          await newSetting.save();
        }
      }
  
      res.status(200).json({
        status: true,
        message: "Settings updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  };
  
  





