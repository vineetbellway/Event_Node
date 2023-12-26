const Booking = require("../models/booking.model");
const BookingMenu = require("../models/booking_menu.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");
const moment = require("moment");
const { addNotification } = require('../helpers/notification_helper');
const { sendPushNotification } = require('../config/firebase.config'); // Update with the correct path to your module.
const SellerModel = require("../models/seller.model");
const EventModel = require("../models/event.model");
const momentTimeZone = require('moment-timezone');
const MenuItemBookings = require("../models/booked_menu_item.model");
const MenuItemPayments = require("../models/menu_item_payments.model");
const Menu = require("../models/menu.model");
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
      var event_record = await EventModel.findById(event_id);

      if(event_record){
        if(event_record.status == "expired"){
          res.status(400).send({ status: false, message: "Event is expired", data: null });
          return;
        }
      }else {
        res.status(200).send({ status: false, message: "Event not found", data: null });
        return;
      }

     

      var bookingData = {
        'event_id': event_id,
        'guest_id': guest_id,
        'payment_mode': payment_mode,
        'transaction_id': transaction_id,
        'fcm_token': fcm_token,
         'amount' : event_record.amount
      };

      const result = await Booking(bookingData).save();

      if (result) {
        
        var bookingMenu = req.body.menu_list;

        if(bookingMenu.length > 0){
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
  var event_id = req.body.event_id;
  var guest_id = req.body.guest_id;
  var status = req.body.status;
  var validator_id = req.body.validator_id;
  var payment_mode = req.body.payment_mode;

  // validator id will be taken from token

  if (!event_id || !guest_id || !status || !validator_id || !payment_mode) {
    res.status(400).json({ status: false, message: "event_id , guest_id, validator id , payment_mode status are required in the request body" });
  } else {
    try {
      Booking.findOneAndUpdate(
        { event_id: event_id, guest_id: guest_id },
        { $set: { validator_id: validator_id, payment_mode: payment_mode, status: status } },
        { new: true } // This option returns the modified document
      )
      .then((result) => {
        if (result) {
          if (status == "active") {
            status = "approved";
          } else {
            status = "rejected";
          }
          var message = "Booking " + status + " successfully";
          // send notification
          addNotification(validator_id, result.guest_id, "Booking status updated", message);

          res.status(200).json({
            status: true,
            message: message,
            data: result,
          });
        } else {
          res.status(200).json({
            status: false,
            message: "No booking found",
            data: null,
          });
        }
      })
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


const sendExpireEventNotification = async () => {
  try {
    const result = await Booking.aggregate([
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
    ]);

    if (result && result.length > 0) {
      for (const bookingData of result) {
        const guest_result = bookingData.guest_data;
        const event_result = bookingData.event_data;

        var guest_id = guest_result[0].user_id;

        if (guest_result && event_result && event_result.length > 0) {
          const guest_fcm_token = guest_result[0].fcm_token;
          const seller_id = event_result[0].seller_id;

          // Make sure the function is marked as async to use await
          const seller_record = await User.findById(seller_id);

          const title = "Event Expired";
          const message = 'Your event has been expired';
          const end_time = event_result[0].end_time;


          const seller_fcm_token = seller_record.fcm_token;

          const currentDateTime = new Date();
          const year = currentDateTime.getFullYear();
          const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
          const day = ('0' + currentDateTime.getDate()).slice(-2);
          const hours = ('0' + currentDateTime.getHours()).slice(-2);
          const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
          const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
          
          const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;


          var now = moment().toDate();
          const formattedCurrentDateTime = currentDateTime.toISOString();
          console.log("formattedCurrentDateTime",currentDateTimeFormatted)
          
   
          const startOfDay = new Date(currentDateTimeFormatted);
          console.log("startOfDay",startOfDay)

            // half an hour before end time Event

          const endOfDay = new Date(currentDateTimeFormatted);
          endOfDay.setSeconds(endOfDay.getSeconds() + 1); // Add 1 second
          console.log("endOfDay",endOfDay)
          const currentDateTime2 = moment();
            console.log("currentDateTime", currentDateTime2.format());

            const halfAnHourLater = moment(currentDateTime2).add(30, 'minutes');
            console.log("halfAnHourLater", halfAnHourLater.format());

            const future_events = await EventModel.find({
              end_time: { $gte: currentDateTime2.toDate(), $lt: halfAnHourLater.toDate() }
            });

          console.log("upcoming",future_events)
          if(future_events.length > 0){
            for(const ev of future_events){
                // Update successful

                const notification = {
                  title: title,
                  body: message,
                };

                const data = {
                  // Additional data to send with the notification, if needed.
                };

              // Add notification to the guest
              var type = 'app';
              addNotification(bookingData.guest_id, bookingData.guest_id, title, message, type);

              // Send push notification to the guest
              sendPushNotification(guest_fcm_token, notification, data)
                .then(() => {
                  console.log('Push notification sent successfully to guest.');
                })
                .catch((error) => {
                  console.error('Error sending push notification to guest:', error);
                });

                // Add notification to the seller
              var type = 'app';
              addNotification(seller_id, seller_id, title, message, type);

              // Send push notification to the seller
              sendPushNotification(seller_fcm_token, notification, data)
                .then(() => {
                  console.log('Push notification sent successfully to seller.');
                })
                .catch((error) => {
                  console.error('Error sending push notification to seller:', error);
                });
               
            }
          }
        }
      }
    } else {
      console.log("No bookings found");
    }
  } catch (error) {
    console.error(error.toString() || "Error");
  }
};

const sendExpiredEventNotification = async () => {
  try {
    const result = await Booking.aggregate([
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
    ]);

    if (result && result.length > 0) {
      for (const bookingData of result) {
        const guest_result = bookingData.guest_data;
        const event_result = bookingData.event_data;

        var guest_id = guest_result[0].user_id;

        if (guest_result && event_result && event_result.length > 0) {
          const guest_fcm_token = guest_result[0].fcm_token;
          const seller_id = event_result[0].seller_id;

          // Make sure the function is marked as async to use await
          const seller_record = await User.findById(seller_id);

          const title = "Event Expired";
          const message = 'Your event has been expired';
          const end_time = event_result[0].end_time;


          const seller_fcm_token = seller_record.fcm_token;

          const currentDateTime = new Date();
          const year = currentDateTime.getFullYear();
          const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
          const day = ('0' + currentDateTime.getDate()).slice(-2);
          const hours = ('0' + currentDateTime.getHours()).slice(-2);
          const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
          const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
          
          const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;


          var now = moment().toDate();
          const formattedCurrentDateTime = currentDateTime.toISOString();
          console.log("formattedCurrentDateTime",currentDateTimeFormatted)
          
   
          const startOfDay = new Date(currentDateTimeFormatted);
          console.log("startOfDay",startOfDay)

          const endOfDay = new Date(currentDateTimeFormatted);
          endOfDay.setSeconds(endOfDay.getSeconds() + 1); // Add 1 second
          console.log("endOfDay",endOfDay)
          const future_events = await EventModel.find({
            end_time: { $gte: startOfDay, $lt: endOfDay }
          });
          console.log("future_events",future_events)
          if(future_events.length > 0){
            for(const ev of future_events){
                  var eventId = ev._id;

                  const menuItemBookingResult = await MenuItemBookings.aggregate([
                    {
                      $match: {
                        guest_id: new mongoose.Types.ObjectId(guest_id),
                        event_id: new mongoose.Types.ObjectId(eventId),
                      },
                    },
                  ]);

                  if(menuItemBookingResult.length > 0){
                     for(itembooking of menuItemBookingResult){
                        var payment_id = itembooking.payment_id;
                         // Update amount in the menu item payment record
                        await MenuItemPayments.findByIdAndUpdate(payment_id, { $set: { amount: 0 } });
                     }
                  }



                  EventModel.findByIdAndUpdate(eventId, { 'status': 'expired' })
                  .then(() => {
                    // Update successful

                const notification = {
                  title: title,
                  body: message,
                };

                const data = {
                  // Additional data to send with the notification, if needed.
                };

              // Add notification to the guest
              var type = 'app';
              addNotification(bookingData.guest_id, bookingData.guest_id, title, message, type);

              // Send push notification to the guest
              sendPushNotification(guest_fcm_token, notification, data)
                .then(() => {
                  console.log('Push notification sent successfully to guest.');
                })
                .catch((error) => {
                  console.error('Error sending push notification to guest:', error);
                });

                // Add notification to the seller
              var type = 'app';
              addNotification(seller_id, seller_id, title, message, type);

              // Send push notification to the seller
              sendPushNotification(seller_fcm_token, notification, data)
                .then(() => {
                  console.log('Push notification sent successfully to seller.');
                })
                .catch((error) => {
                  console.error('Error sending push notification to seller:', error);
                });
                })
              .catch((error) => {
                console.error('Error updating event status:', error);
              }); 
            }
          }
        }
      }
    } else {
      console.log("No bookings found");
    }
  } catch (error) {
    console.error(error.toString() || "Error");
  }
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





const get_guest_coupon_balanceold = async (req, res) => {
  const guest_id = req.query.guest_id;

  if (!guest_id) {
    res.status(400).json({ status: false, message: "Guest ID is required in the request body" });
  } else {
    try {
      // Fetch all MenuItemBooking records for the guest
      const result = await MenuItemBookings.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
          },
        },
        {
          $lookup: {
            from: 'MenuItemPayments',
            localField: 'payment_id',
            foreignField: '_id',
            as: 'payment_data',
          },
        },

      
        
        {
          $group: {
            _id: {
              payment_id: "$payment_id", // Group by payment_id
              event_id: "$event_id", // Group by event_id if it exists
            },
          },
        },
   
        
      ]);
      
      // Initialize sum as 0
      var sum = 0;
      
      console.log("result", result);
      
      // Iterate over each MenuItemBooking record
      for (const item1 of result) {
        const payment_id = item1._id.payment_id; // Access the payment_id from the result
        const event_id = item1._id.event_id; // Access the event_id from the result
        console.log("payment_id", payment_id);
        console.log("event_id", event_id);
         // Check if the event is active
         const eventDetails = await EventModel.findOne({ '_id': event_id });

        // Fetch the MenuItemPayments records for the current payment_id
        const bookedPaymentResults = await MenuItemPayments.aggregate([
          {
            $match: {
              _id: payment_id,
              is_approved: "yes",
            },
          },
          {
            $sort: { createdAt: 1 },
          },
        ]);


        console.log("bookedPaymentResults",bookedPaymentResults)

        // Loop through each bookedPaymentResult
        if(bookedPaymentResults.length > 0){
          for (const bookedPaymentResult of bookedPaymentResults) { 
           
            if (eventDetails && eventDetails.status == 'active') {

              if(eventDetails.type == "food_event" && eventDetails.is_cover_charge_added == "yes"){
                sum += bookedPaymentResult.amount;
                break;
              }
             
            }
          }
        } else {
  
          var  coverCharge = eventDetails ? eventDetails.cover_charge : 0;
            sum = 0;
        }
        
      }

      console.log("Total Sum:", sum); // Output the total sum after the loop

      // Now you can use the sum in your aggregation
      const paymentAmount = sum;

      // Continue with the rest of your code...

      Booking.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
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
          $unwind: { path: "$booked_menu_data", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: 'menus',
            localField: 'booked_menu_data.menu_id',
            foreignField: '_id',
            as: 'menu_data',
          },
        },
        {
          $unwind: { path: "$menu_data", preserveNullAndEmptyArrays: true },
        },
        {
          $sort: { createdAt: 1 }, // Sort by createdAt in ascredsning order
        },
        {
          $project: {
            _id: 0,
            total_coupon_balance: {
              $sum: [
                {
                  $cond: {
                    if: {
                      $and: [
                        { $ifNull: ["$booked_menu_data", []] }, // Check if booked_menu_data is not null or empty
                        { $ifNull: ["$menu_data", []] }, // Check if menu_data is not null or empty
                      ],
                    },
                    then: paymentAmount, // Use paymentAmount directly
                    else: {
                      $sum: [
                        {
                          $multiply: [
                            "$booked_menu_data.quantity",
                            { $arrayElemAt: ["$menu_data.selling_price", 0] },
                          ],
                        },
                        paymentAmount, // Sum paymentAmount with the calculated value
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ])
        .then((result) => {
          console.log("result", result);
          if (result && result.length > 0) {
            const lastRecord = result[result.length - 1];

            res.status(200).json({
              status: true,
              message: "Data found",
              data: lastRecord, // Since we're grouping, result is an array with one element
            });
          } else {
            res.status(200).json({ status: false, message: "No bookings found", data: null });
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
  const guest_id = req.query.guest_id;

  if (!guest_id) {
    res.status(400).json({ status: false, message: "Guest ID is required in the request body" });
  } else {
    try {

       // Fetch all MenuItemBooking records for the guest

      const result = await MenuItemPayments.aggregate([
        {
          $lookup: {
            from: 'menuitembookings',
            localField: '_id', // Match based on _id field in MenuItemPayments
            foreignField: 'payment_id', // Match based on payment_id field in MenuItemBookings
            as: 'booking_data',
          },
        },
       
        {
          $match: {
            'booking_data.guest_id': new mongoose.Types.ObjectId(guest_id),
            'is_approved' : 'yes',
            'amount': { $gt: 0 }, 
          },
        },
        {
          $sort: { 'createdAt': -1 }, // Sort in descending order based on the 'createdAt' field
        },
        {
          $limit: 1, // Limit the result to one document
        },
      ]);  
      
      // Initialize sum as 0
      var sum = 0;
      
      if(result.length > 0){      
      // Iterate over each MenuItemBooking record
      for (const item1 of result) {
        var booking_data = item1.booking_data[0];  
    
        const event_id = booking_data.event_id; // Access the event_id from the result

         // Check if the event is active
         const eventDetails = await EventModel.findOne({ '_id': event_id });
        if (eventDetails && eventDetails.status == 'active') {
          if(eventDetails.type == "food_event" && eventDetails.is_cover_charge_added == "yes"){
            sum += item1.amount;
            break;
          }
          
        }     
        
      }
    }
    else {
        sum = 0;
    }
      

      console.log("Total Sum:", sum); // Output the total sum after the loop

      // Now you can use the sum in your aggregation
      const paymentAmount = sum;

      // Continue with the rest of your code...

      Booking.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
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
          $unwind: { path: "$booked_menu_data", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: 'menus',
            localField: 'booked_menu_data.menu_id',
            foreignField: '_id',
            as: 'menu_data',
          },
        },
        {
          $unwind: { path: "$menu_data", preserveNullAndEmptyArrays: true },
        },
        {
          $sort: { createdAt: 1 }, // Sort by createdAt in ascredsning order
        },
        {
          $project: {
            _id: 0,
            total_coupon_balance: {
              $sum: [
                {
                  $cond: {
                    if: {
                      $and: [
                        { $ifNull: ["$booked_menu_data", []] }, // Check if booked_menu_data is not null or empty
                        { $ifNull: ["$menu_data", []] }, // Check if menu_data is not null or empty
                      ],
                    },
                    then: paymentAmount, // Use paymentAmount directly
                    else: {
                      $sum: [
                        {
                          $multiply: [
                            "$booked_menu_data.quantity",
                            { $arrayElemAt: ["$menu_data.selling_price", 0] },
                          ],
                        },
                        paymentAmount, // Sum paymentAmount with the calculated value
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
      ])
        .then((result) => {
          console.log("result", result);
          if (result && result.length > 0) {
            const lastRecord = result[result.length - 1];

            res.status(200).json({
              status: true,
              message: "Data found",
              data: lastRecord, // Since we're grouping, result is an array with one element
            });
          } else {
            res.status(200).json({ status: false, message: "No bookings found", data: null });
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

const get_pending_guest_list = async (req, res) => {
  var event_id = req.query.event_id;
  var search_key = req.query.search_key;
  const sanitizedSearchKey = search_key.trim(); 

  if (!event_id) {
    res.status(400).json({
      status: false,
      message: "Guest ID is required in the request body",
    });
  } else {
    try {
      const pipeline = [
        {
          $match: {
            event_id: new mongoose.Types.ObjectId(event_id),
            status: "pending",
            payment_mode: { $ne: "upi" } ,
          },
        },
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
          $lookup: {
            from: "users",  // Assuming the contact number is in the "users" table
            localField: "guest_data.user_id",  // Assuming "user_id" links to the "users" table
            foreignField: "_id",
            as: "user_data",
          },
        },
        {
          $match: {
            $or: [
              { "guest_data.full_name": { $regex: search_key, $options: "i" } },
              { "user_data.code_phone": { $regex: search_key, $options: "i" } },
              {
                "user_data.code_phone": {
                  $regex: new RegExp(`^(\\+${sanitizedSearchKey}|0?${sanitizedSearchKey})$`, 'i')
                }
              },
              // Add more conditions if needed
            ],
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      Booking.aggregate(pipeline)
        .then((result) => {
          console.log("result", result);
          if (result && result.length > 0) {
            var data = [];


           

            for (const booking of result) {
              
              if (
                booking.guest_data &&
                booking.guest_data.length > 0 &&
                booking.guest_data[0] !== null
              ) {
                const guestRecord = booking.guest_data[0];
                guestRecord.contact_number = booking.user_data[0].code_phone


                data.push(guestRecord);
              }
            }

            res.status(200).json({
              status: true,
              message: "Data found",
              data: data,
            });
          } else {
            res.status(404).json({ status: false, message: "No guests found",data: [] });
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

const get_approved_booking_cost = async (req, res) => {
  var event_id = req.query.event_id;
  var validator_id = req.query.validator_id;

  if (!event_id) {
    res.status(400).json({
      status: false,
      message: "Guest ID is required in the request body",
    });
  } else {
    try {
      const pipeline = [
        {
          $match: {
            validator_id: new mongoose.Types.ObjectId(validator_id),
            event_id: new mongoose.Types.ObjectId(event_id),
            status: "active",
          },
        },
        {
          $lookup: {
            from: "events",
            localField: "event_id",
            foreignField: "_id",
            as: "event_data",
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ];

      Booking.aggregate(pipeline)
        .then((result) => {
          console.log("result", result);
          if (result && result.length > 0) {
            var data = [];
            var totalUPIBookingAmount = 0;
            var totalPayOnCounterBooking = 0;
            var totalCashBooking = 0;
            var totalCardBooking = 0;

            for (const booking of result) {
          

                // Calculate booking cost based on payment mode
                if (booking.payment_mode === "counter_upi") {
                  totalUPIBookingAmount += booking.amount || 0;
                } 
               

                if (booking.payment_mode === "cash") {
                  totalCashBooking += booking.amount || 0;
                }

                if (booking.payment_mode === "card") {
                  totalCardBooking += booking.amount || 0;
                }

            
              
            }

            res.status(200).json({
              status: true,
              message: "Data found",
              data : {
              'total_upi_booking_amount': totalUPIBookingAmount,
              'total_cash_booking_amount': totalCashBooking,
              'total_card_booking_amount': totalCardBooking,
              'total_amount' : totalUPIBookingAmount  + totalCashBooking + totalCardBooking
              }
              
            });
          } else {
            res.status(404).json({ status: false, message: "No data found",data: null });
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
  sendExpireEventNotification,
  sendExpiredEventNotification,
  manage_bookings,
  get_bookings,
  book,
  get_bookings_by_payment_mode,
  get_booking_detail,
  get_booked_guest_list,
  get_guest_coupon_balance,
  get_pending_guest_list,
  get_approved_booking_cost

}; 
