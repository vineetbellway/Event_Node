const Booking = require("../models/booking.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const { addNotification } = require('../helpers/notification_helper');
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
                  
                  const registrationToken = req.body.device_token;
                  const notification = {
                    title: 'Event booked',
                    body: 'New event is booked!',
                  };
                  const data = {
                    // Additional data to send with the notification, if needed.
                  };

                  var message = 'New event is booked!';
                  var type = 'push';
  
                  addNotification(req.body.guest_id,req.body.guest_id,'Event booked',message,type);
                  
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
    var guest_id = req.query.guest_id;
    var status = req.query.status;

  
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
          {
            $sort: { createdAt: -1 }, // Sort by createdAt in descending order
          },
        ])
        .then((result) => {
          if (result && result.length > 0) {
            var booking_data = [];
         

            for(const booking of result){
                const response = {
                  _id: booking._id,
                  event_id: booking.event_id,
                  guest_id: booking.guest_id,
                  payment_mode: booking.payment_mode,
                  status: booking.status,
                  transaction_id: booking.transaction_id,
                 // booking_date: booking.booking_date,
                  createdAt: booking.createdAt,
                  updatedAt: booking.updatedAt,
                  event_data:booking.event_data && booking.event_data.length > 0 ? booking.event_data[0] : null,  

                };
                booking_data.push(response)

            }
            res.status(200).json({
              status: true,
              message: "Data found",
              data: booking_data,
            });
          } else {
            res.status(404).json({ status: false, message: "No bookings found" });
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
  var validator_id = req.body.validator_id;

  // validator id will be taken from token

  if (!booking_id || !status || !validator_id) {
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
           var message = "Booking "+status+" successfully";
           // send notification
           sendNotification(validator_id,result.guest_id,message);

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
                  body: 'You have a booking on ' + bookingData.createdAt,
                };
                const data = {
                  // Additional data to send with the notification, if needed.
                };

                
                var message = 'You have a booking on ' + bookingData.createdAt;
                var type = 'push';

                addNotification(result.guest_id,result.guest_id,'Upcoming Booking Notification',message,type);

               

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

const  get_cash_bookings = async (req, res) => {
  var guest_id = req.query.guest_id;



  if (!guest_id) {
    res.status(400).json({ status: false, message: "Guest ID  are required in the request body" });
  } else {
    try {
      Booking.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
            payment_mode : 'cash'
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
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
      ])
      .then((result) => {
        if (result && result.length > 0) {
          var booking_data = [];
       

          for(const booking of result){
              const response = {
                _id: booking._id,
                event_id: booking.event_id,
                guest_id: booking.guest_id,
                payment_mode: booking.payment_mode,
                status: booking.status,
                transaction_id: booking.transaction_id,
               // booking_date: booking.booking_date,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                event_data:booking.event_data && booking.event_data.length > 0 ? booking.event_data[0] : null,  

              };
              booking_data.push(response)

          }
          res.status(200).json({
            status: true,
            message: "Data found",
            data: booking_data,
          });
        } else {
          res.status(404).json({ status: false, message: "No bookings found" });
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


const  get_booked_event_detail = async (req, res) => {
  var event_id = req.query.event_id;



  if (!event_id) {
    res.status(400).json({ status: false, message: "event ID are required in the request body" });
  } else {
    try {
      Booking.aggregate([
        {
          $match: {
            event_id: new mongoose.Types.ObjectId(event_id),
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
          
          res.status(200).json({
            status: true,
            message: "Data found",
            data: (result[0].event_data) ? result[0].event_data[0] : null,
          });
        } else {
          res.status(404).json({ status: false, message: "No event found" });
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

module.exports = {
  sendEventNotification,
  manage_bookings,
  get_bookings,
  book,
  get_cash_bookings,
  get_booked_event_detail

}; 
  