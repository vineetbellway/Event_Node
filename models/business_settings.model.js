const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    razor_pay_key: {
      type: String,
      required: true,
    }, 
    razor_pay_secret: {
      type: String,
      required: true,
    }, 
    razor_pay_status: {
      type: String,
      required: true,
    }, 
    terms_conditions: {
      type: String,
      required: true,
    }, 
    privacy_policy: {
      type: String,
      required: true,
    }, 
    logo:{
      type: String,
      required: true,
    },
    business_name:{
      type: String,
      required: true,
    },
    phone_number:{
      type: String,
      required: true,
    },
    email:{
      type: String,
      required: true,
    },
    app_url:{
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("BusinessSettings", schema);
