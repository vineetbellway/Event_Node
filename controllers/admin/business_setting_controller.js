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
  }

  exports.manageSetting = async (req, res, next) => {
    try {
      // Trim values to remove extra spaces
      const razor_pay_key = req.body.razor_pay_key.trim();
      const razor_pay_secret = req.body.razor_pay_secret.trim();
      const razor_pay_status = req.body.razor_pay_status.trim();
      const logo = req.file ? req.file.filename : undefined;
      const terms_conditions = req.body.terms_conditions.trim();
      const privacy_policy = req.body.privacy_policy.trim();
      const business_name = req.body.business_name.trim();
      const phone_number = req.body.phone_number.trim();
      const email = req.body.email.trim();
      const app_url = req.body.app_url.trim();
  
      const businessSettingData = {
        razor_pay_key,
        razor_pay_secret,
        razor_pay_status,
        terms_conditions,
        privacy_policy,
        business_name,
        phone_number,
        email,
        app_url,
      };

      console.log("logo",logo)
  
      // Check if image is not undefined
      if (logo !== undefined) {
        businessSettingData.logo = logo;
      }
  
      // Find existing document based on business_name
      let existingData = await BusinessSettings.findOne({ business_name });
  
      if (existingData) {
        // If document exists, update it
        existingData = await BusinessSettings.findOneAndUpdate(
          { business_name },
          businessSettingData,
          { new: true }
        );
      } else {
        // If document doesn't exist, create a new one
        existingData = await BusinessSettings.create(businessSettingData);
      }
  
      if (existingData) {
        // Get the host (domain and port)
        const protocol = req.protocol;
        const host = req.get('host');
  
        // Combine protocol, host, and any other parts of the base URL you need
        const baseURL = `${protocol}://${host}`;
        const logoUrl = existingData.logo ? baseURL + '/uploads/logo/' + existingData.logo : '';
  
        const message = existingData._id ? 'Business setting updated successfully' : 'Business setting created successfully';
  
        res.status(200).send({
          status: true,
          message,
          data: {
            ...existingData.toObject(),
            logo: logoUrl,
          },
        });
      } else {
        res.status(500).send({ status: false, message: "Failed! Please try again", data: null });
      }
    } catch (error) {
      console.log("error", error);
      res.status(500).send({
        status: false,
        message: error ?? "Internal Server Error",
      });
    }
  };
  

 
  
  





