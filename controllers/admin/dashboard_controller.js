const Seller = require("../../models/seller.model");
const Validator = require("../../models/validator.model");
const Guest = require("../../models/guest.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../../utils/enumerator");


exports.getCounts = async (req, res) => {
  try {
    const totalSellers = await Seller.countDocuments();
    const totalValidators = await Validator.countDocuments();
    const totalGuests = await Guest.countDocuments();

    res.status(200).json({
      status: true,
      message: "Counts retrieved successfully",
      data: {
        totalSellers,
        totalValidators,
        totalGuests
      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

  
  





