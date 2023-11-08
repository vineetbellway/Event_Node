const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { baseStatus } = require("../utils/enumerator");
const { sendSystemNotification } = require('../helpers/notification_helper');
const { sendPushNotification } = require('../config/firebase.config'); // Update with the correct path to your module.


// It will book event by guest

const book = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
        Booking(req.body)
              .save()
              .then((result) => {
                if (result) {  
                  
                  const registrationToken = 'YOUR_DEVICE_REGISTRATION_TOKEN';
                  const notification = {
                    title: 'New Message',
                    body: 'You have a new message!',
                  };
                  const data = {
                    // Additional data to send with the notification, if needed.
                  };
                  
                  sendPushNotification(registrationToken, notification, data)
                    .then(() => {
                      console.log('Push notification sent successfully.');
                    })
                    .catch((error) => {
                      console.error('Error sending push notification:', error);
                    });
                  
                    res.status(201).send({ status: true, message: "success", data: result });
                } else {
                    res.status(404).send({ status: false, message: "Not created" });
                }
                })
                .catch((error) => {
                console.log("error",error)
                res.send({
                    status: false,
                    message: error.toString() ?? "Error",
                });
                });
    } catch (error) {
      res.status(500).send({
        status: false,
        message: "failure",
        error: error ?? "Internal Server Error",
      });
    }
  }
};


const  get_bookings = async (req, res) => {
    var guest_id = req.body.guest_id;
    var status = req.body.status;
  
    if (!guest_id || !status) {
      res.status(400).json({ status: false, message: "Guest ID and status are required in the request body" });
    } else {
      try {
        Booking.aggregate([
          {
            $match: {
              guest_id: new mongoose.Types.ObjectId(guest_id),
              status: status,
            },
          },
          {
            $lookup: {
              from: 'eventmodels',
              localField: 'event_id',
              foreignField: '_id',
              as: 'event_data',
            },
          },
        ])
        .then((result) => {
          if (result && result.length > 0) {
            // Assuming there's only one result, you can access it directly
            const booking = result[0];
  
            // Combine transaction data and event data into a single JSON object
            const response = {
              _id: booking._id,
              event_id: booking.event_id,
              guest_id: booking.guest_id,
              payment_mode: booking.payment_mode,
              status: booking.status,
              transaction_id: booking.transaction_id,
              booking_date: booking.booking_date,
              createdAt: booking.createdAt,
              updatedAt: booking.updatedAt,
              seller_id: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].seller_id : null,
              contact_name: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].contact_name : null,
              contact_number: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].contact_number : null,
              type: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].type : null,
              image: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].image : null,
              name: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].name : null,
              venue: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].venue : null,
              location: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].location : null,
              start_time: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].start_time : null,
              end_time: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].end_time : null,
              coupon_name: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].coupon_name : null,
              tax_name: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].tax_name : null,
              tax_percent: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].tax_percent : null,
              amount: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].amount : null,
              instructions: booking.event_data && booking.event_data.length > 0 ? booking.event_data[0].instructions : null,  

            };
  
            res.status(200).json({
              status: true,
              message: "Data found",
              data: response,
            });
          } else {
            res.status(404).json({ status: false, message: "No bookings found for the specified guest and status" });
          }
        })
        .catch((error) => {
          console.log("error", error);
          res.status(500).json({
            status: false,
            message: error.toString() || "Internal Server Error",
          });
        });
      } catch (error) {
        console.log("error", error);
        res.status(500).json({
          status: false,
          message: error.toString() || "Internal Server Error",
        });
      }
    }
};
 

// It will manage bookings by validator
  
const manage_bookings = async (req, res) => {
  var booking_id = req.body.booking_id;
  var status = req.body.status;

  // validator id will be taken from token

  if (!booking_id || !status) {
    res.status(400).json({ status: false, message: "booking ID and status are required in the request body" });
  } else {
    try {
      Booking.findByIdAndUpdate(booking_id,{'status':status})
      .then((result) => {
        if (result) {   
          if(status == "active"){
              status = "approved";
          } else {
              status = "rejected";
          }
           // validator id will be later taken from token

           var validator_id = "650bdb1e015e74e090374652";
           var message = "Booking "+status+" successfully";
           // send notification
           sendSystemNotification(validator_id,result.guest_id,message);

          res.status(200).json({
            status: true,
            message: message,
            data: result,
          });
        }
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).json({
          status: false,
          message: error.toString() || "Internal Server Error",
        });
      });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  }
}; 


const sendEventNotification = () => {
  console.log("here")
  const current_date = moment().format("YYYY-MM-DD");
  const oneDayBefore = moment().subtract(1, 'day').format("YYYY-MM-DD");

  // Find guests with bookings one day before the current date
  Booking.find({ status: 'active', booking_date: oneDayBefore })
    .then((result) => {
      if (result) {
        for (const bookingData of result) {
          // Fetch the guest's device token
          const guestId = bookingData.guestId; // Replace with the actual guest ID field
          User.findById(guestId, { type: 'guest' })
            .then((guest) => {
              if (guest && guest.device_token) {
                // Send push notification to the guest
                const deviceToken = guest.device_token;
                const notification = {
                  title: 'Upcoming Booking Notification',
                  body: 'You have a booking on ' + bookingData.booking_date,
                };
                const data = {
                  // Additional data to send with the notification, if needed.
                };

                sendPushNotification(deviceToken, notification, data)
                  .then(() => {
                    console.log('Push notification sent successfully to guest.');
                  })
                  .catch((error) => {
                    console.error('Error sending push notification to guest:', error);
                  });
              }
            })
            .catch((error) => {
              console.error(error.toString() || "Error fetching guest");
            });
        }
      } else {
        console.log("Data not found");
      }
    })
    .catch((error) => {
      console.error(error.toString() || "Error");
    });
};

module.exports = {
  sendEventNotification,
  manage_bookings,
  get_bookings,
  book

}; 
  