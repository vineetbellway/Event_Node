const Booking = require("../models/booking.model");
const BookingMenu = require("../models/booking_menu.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const moment = require("moment");
const { addNotification } = require('../helpers/notification_helper');
const { sendPushNotification } = require('../config/firebase.config'); // Update with the correct path to your module.
const SellerModel = require("../models/seller.model");
const EventModel = require("../models/event.model");

// It will book event by guest

const book = async (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      const guest_id = req.body.guest_id;
      const payment_mode = req.body.payment_mode;
      const transaction_id = req.body.transaction_id;
      const fcm_token = req.body.fcm_token;
      const event_id = req.body.event_id;

      var bookingData = {
        'event_id': event_id,
        'guest_id': guest_id,
        'payment_mode': payment_mode,
        'transaction_id': transaction_id,
        'fcm_token': fcm_token
      };

      const result = await Booking(bookingData).save();

      if (result) {
        
        var bookingMenu = req.body.menu_list;

        // Save booking menu data
        for (const item of bookingMenu) {
          var bookingMenuData = {
            "booking_id": result._id,
            "menu_id": item.menu_id,
            "quantity": item.quantity,
          };
          console.log("bookingMenuData",bookingMenuData);
       
      

          await BookingMenu(bookingMenuData).save();
        }

        const notification = {
          title: 'Event booked',
          body: 'New event is booked!',
        };
        const data = {
          // Additional data to send with the notification, if needed.
        };

        var message = 'New event is booked!';
        var type = 'push';

        addNotification(req.body.guest_id, req.body.guest_id, 'Event booked', message, type);

        sendPushNotification(fcm_token, notification, data)
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
    } catch (error) {
      console.log("error", error);
      res.status(500).send({
        status: false,
        message: "failure",
        error: error.toString() ?? "Internal Server Error",
      });
    }
  }
};






const get_bookings = async (req, res) => {
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
            from: 'events',
            localField: 'event_id',
            foreignField: '_id',
            as: 'event_data',
          },
        },
        {
          $lookup: {
            from: 'bookingmenus',
            localField: '_id',
            foreignField: 'booking_id',
            as: 'booked_menu_data',
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
      ])
      .then((result) => {
        if (result && result.length > 0) {
          var booking_data = [];

          for (const booking of result) {
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
              event_data: booking.event_data && booking.event_data.length > 0 ? {
                ...booking.event_data[0],
                // Constructing image URL
                image: constructImageUrl(req, booking.event_data[0].image),
              } : null,
              booked_menu_data:booking.booked_menu_data
            };
            booking_data.push(response);
          }

          console.log("booking_data", booking_data);
          res.status(200).json({
            status: true,
            message: "Data found",
            data: booking_data,
          });
        } else {
          res.status(404).json({ status: false, message: "No bookings found", data: [] });
        }
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).json({
          status: false,
          message: error.toString() || "Internal Server Error",
          data: null
        });
      });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
        data: null
      });
    }
  }
};

// Helper function to construct the image URL
const constructImageUrl = (req, imagePath) => {
  const protocol = req.protocol;
  const host = req.get('host');
  const baseURL = `${protocol}://${host}`;
  return baseURL + '/uploads/events/' + imagePath;
};


 

// It will manage bookings by validator
  
const manage_bookings = async (req, res) => {
  var booking_id = req.body.booking_id;
  var status = req.body.status;
  var validator_id = req.body.validator_id;

  // validator id will be taken from token

  if (!booking_id || !status || !validator_id) {
    res.status(400).json({ status: false, message: "booking id , validator id and status are required in the request body" });
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
           addNotification(validator_id,result.guest_id,"Booking status updated",message);

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
                const fcm_token = guest.fcm_token;
                const notification = {
                  title: 'Upcoming booking notification',
                  body: 'You have a booking on ' + bookingData.createdAt,
                };
                const data = {
                  // Additional data to send with the notification, if needed.
                };

                
                var message = 'You have a booking on ' + bookingData.createdAt;
                var type = 'push';

                addNotification(result.guest_id,result.guest_id,'Upcoming booking notification',message,type);

               

                sendPushNotification(fcm_token, notification, data)
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

const  get_bookings_by_payment_mode = async (req, res) => {
  var guest_id = req.query.guest_id;
  var payment_mode = req.query.payment_mode;


  if (!guest_id) {
    res.status(400).json({ status: false, message: "Guest ID  are required in the request body" });
  } else {
    try {
      Booking.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
            payment_mode : payment_mode
          },
        },
        {
          $lookup: {
            from: 'events',
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
                event_data: booking.event_data && booking.event_data.length > 0 ? {
                  ...booking.event_data[0],
                  // Constructing image URL
                  image: constructImageUrl(req, booking.event_data[0].image),
                } : null,

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


const  get_booking_detail = async (req, res) => {
  var booking_id = req.query.booking_id;
  if (!booking_id) {
    res.status(400).json({ status: false, message: "booking ID are required in the request body" });
  } else {
    try {
      Booking.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(booking_id),
          },
        },
        {
          $lookup: {
            from: 'events',
            localField: 'event_id',
            foreignField: '_id',
            as: 'event_data',
          },
        },
        {
          $lookup: {
            from: 'guests',
            localField: 'guest_id',
            foreignField: 'user_id',
            as: 'guest_data',
          },
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
                guest_name: booking.guest_data && booking.guest_data.length > 0 ? booking.guest_data[0].full_name : null, // Replace 'name' with the actual field name in your 'users' collection
                payment_mode: booking.payment_mode,
                status: booking.status,
                transaction_id: booking.transaction_id,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                event_data: booking.event_data && booking.event_data.length > 0 ? {
                  ...booking.event_data[0],
                  // Constructing image URL
                  image: constructImageUrl(req, booking.event_data[0].image),
                } : null,

              };
              booking_data.push(response);

          }
          res.status(200).json({
            status: true,
            message: "Data found",
            data: (booking_data.length > 0)  ? booking_data[0] : null,
          });   
          
         
        } else {
          res.status(404).json({ status: false, message: "No boobookingking found" });
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

const sendExpiredEventNotification = () => {
  Booking.aggregate([
    {
      $match: {
        status: 'active'
      },
    },
    {
      $lookup: {
        from: 'events',
        localField: 'event_id',
        foreignField: '_id',
        as: 'event_data',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'guest_id',
        foreignField: '_id',
        as: 'guest_data',
      },
    },
  ])
    .then((result) => {
     // console.log("result", result)
      if (result && result.length > 0) {
        const currentDateTime = moment();
        for (const bookingData of result) {
          var guest_result = bookingData.guest_data;
          var event_result = bookingData.event_data;


          if (guest_result && event_result && event_result.length > 0) {
            const fcm_token = guest_result[0].fcm_token; // Assuming device_token is in the first element
            var title = "Event Expired";
            var message = 'Your event has been expired';
            var end_time = moment(event_result[0].end_time);


            if (end_time.isBefore(currentDateTime)) {
              Booking.findByIdAndUpdate(bookingData._id, { 'status': 'expired' })
                .then(() => {
                  // Update successful
                })
                .catch((error) => {
                  console.error('Error updating booking status:', error);
                });

              const notification = {
                title: title,
                body: message,
              };

              const data = {
                // Additional data to send with the notification, if needed.
              };

              var type = 'app';
              addNotification(bookingData.guest_id, bookingData.guest_id, title, message, type);

              sendPushNotification(fcm_token, notification, data)
                .then(() => {
                  console.log('Push notification sent successfully to guest.');
                })
                .catch((error) => {
                  console.error('Error sending push notification to guest:', error);
                });
            }
          }
        }
      } else {
       // console.log("No bookings found");
      }
    })
    .catch((error) => {
      console.error(error.toString() || "Error");
    });
};



const get_booked_guest_list = async (req, res) => {
  var seller_id = req.query.seller_id;
  var event_id = req.query.event_id;
  var payment_mode = req.query.payment_mode;

  if (!seller_id && event_id) {
    res.status(400).json({
      status: false,
      message: "seller id and event id are required in the request body",
    });
  } else {
    var sellerData = await SellerModel.findOne({ user_id: seller_id });

    if (!sellerData) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }    

    const event = await EventModel.findById(event_id);
    if (!event) {
      return res.status(404).send({
        status: false,
        message: "Event not found",
        data: null,
      });
    } 






    var sellerDistrict = sellerData.district;
    

    try {
      const bookingPipeline = [
        {
          $lookup: {
            from: "events",
            localField: "event_id",
            foreignField: "_id",
            as: "event_data",
          },
        },
        {
          $lookup: {
            from: "guests",
            localField: "guest_id",
            foreignField: "user_id",
            as: "guest_data",
          },
        },
       
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
        {
          $match: { "event_data._id": new mongoose.Types.ObjectId(event_id) },
        },
      ];

      // Match based on payment mode
      if (payment_mode) {
        bookingPipeline.unshift({
          $match: { payment_mode: payment_mode },
        });
      }



      Booking.aggregate(bookingPipeline)
        .then((result) => {
          if (result && result.length > 0) {
            var booked_guest_data = [];          

            for (const booking of result) {
              if(sellerDistrict == booking.guest_data[0].district){
                const response = {
                  ... booking.guest_data[0],
                  booking_status:booking.status,
                  event_data:
                    booking.event_data && booking.event_data.length > 0
                      ? {
                          ...booking.event_data[0],
                          // Constructing image URL
                          image: constructImageUrl(
                            req,
                            booking.event_data[0].image
                          ),
                        }
                      : null,
                };
                booked_guest_data.push(response);

              }             
            }
            res.status(200).json({
              status: true,
              message: "Data found",
              data: booked_guest_data,
            });
          } else {
            res.status(404).json({ status: false, message: "No guests found", data: [] });
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

const get_guest_coupon_balance = async (req, res) => {
  var guest_id = req.query.guest_id;

  if (!guest_id) {
    res.status(400).json({ status: false, message: "Guest ID is required in the request body" });
  } else {
    try {
      Booking.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
          },
        },
        {
          $lookup: {
            from: 'bookingmenus',
            localField: 'booking_id',
            foreignField: '_id',
            as: 'booked_menu_data',
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
        {
          $group: {
            _id: "$guest_id",
            total_coupon_balance: { $sum: "$booked_menu_data.coupon_balance" },
            bookings: { $push: "$$ROOT" }, // Save the original booking documents for reference
          },
        },
      ])
      .then((result) => {
        if (result && result.length > 0) {
          const guest_data = result[0];
          res.status(200).json({
            status: true,
            message: "Data found",
            data: {
              total_coupon_balance: guest_data.total_coupon_balance,
              bookings: guest_data.bookings.map(booking => {
                // Transform the booking data as needed
                return {
                  _id: booking._id,
                  event_id: booking.event_id,
                  guest_id: booking.guest_id,
                  payment_mode: booking.payment_mode,
                  status: booking.status,
                  transaction_id: booking.transaction_id,
                  createdAt: booking.createdAt,
                  updatedAt: booking.updatedAt,
                  event_data: booking.event_data && booking.event_data.length > 0 ? {
                    ...booking.event_data[0],
                    image: constructImageUrl(req, booking.event_data[0].image),
                  } : null,
                };
              }),
            },
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




module.exports = {
  sendEventNotification,
  sendExpiredEventNotification,
  manage_bookings,
  get_bookings,
  book,
  get_bookings_by_payment_mode,
  get_booking_detail,
  get_booked_guest_list,
  get_guest_coupon_balance

}; 
