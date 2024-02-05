const Seller = require("../../models/seller.model");
const Validator = require("../../models/validator.model");
const Guest = require("../../models/guest.model");
const EventModel = require("../../models/event.model");

const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../../utils/enumerator");


exports.getCounts = async (req, res) => {
  try {

  const currentDateTime = new Date();
  const year = currentDateTime.getFullYear();
  const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
  const day = ('0' + currentDateTime.getDate()).slice(-2);
  const hours = ('0' + currentDateTime.getHours()).slice(-2);
  const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
  const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
  
  const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  
  const startDateTime = new Date(currentDateTimeFormatted);
    const totalSellers = await Seller.countDocuments({ status: "active" });
    const totalValidators = await Validator.countDocuments({ status: "active" });
    const totalGuests = await Guest.countDocuments({ status: "active" });
    const totalActiveEvents = await EventModel.countDocuments({ status: "active" });
    const totalExpiredEvents = await EventModel.countDocuments({ status: "expired" });
    const totalUpcomingEvents = await EventModel.countDocuments({  start_time: { $gte: startDateTime}, 'status' : 'active'});

    res.status(200).json({
      status: true,
      message: "Counts retrieved successfully",
      data: {
        totalSellers,
        totalValidators,
        totalGuests,
        totalActiveEvents,
        totalExpiredEvents,
        totalUpcomingEvents

      },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

  
  





