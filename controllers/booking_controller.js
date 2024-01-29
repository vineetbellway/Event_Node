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
const BookingPayments = require("../models/booking_payments.model");
const Menu = require("../models/menu.model");
const MenuItem = require("../models/menu_item.model");
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


      if(payment_mode == "upi"){
        var status = "active";
      } else {
        var status = "pending";
      }

      

      var bookingData = {
        'event_id': event_id,
        'guest_id': guest_id,
        'payment_mode': payment_mode,
        'transaction_id': transaction_id,
        'fcm_token': fcm_token,
        'amount' : event_record.amount,
       // 'coupon_balance' : coupon_balance,
        'status' : status
      };

      const result = await Booking(bookingData).save();

      if (result) {
        
        var bookingMenu = req.body.menu_list;

        if(bookingMenu.length > 0){
           // Save booking menu data

           for (const [key, value] of Object.entries(bookingMenu)) {
   

              var bookingMenuData = {
                "booking_id": result._id,
                'guest_id': guest_id,
                "menu_id": value.menu_id,
                "quantity": value.quantity,
              
              };          
          

              const result2 =   await BookingMenu(bookingMenuData).save();
              if(key == 0){
                 // add menu payment data
                var bookingPaymentData = {
                  "booking_id": result2._id,
                  'amount' : event_record.amount,
                  "status"  : status,
                  "payment_mode" : payment_mode,
                  "transaction_id" : transaction_id
                };
                await BookingPayments(bookingPaymentData).save();
              }
              



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

  console.log("status",status)
  var match;

    if (status == "expired") {
      match = {
        $match: {
          "event_data.status": "expired", 
        }
      };
    } else {
      match = {
        $match: {
          "event_data.status": "active", // Filter by event status
        }
      };
    }


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
        match,
        
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
            payment_mode : payment_mode,                  
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
          $match: {
            "event_data.status": "active", // Filter by event status
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
          res.status(404).json({ status: false, message: "No bookings found",data:[] });
        }
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).json({
          status: false,
          message: error.toString() || "Internal Server Error",
          data:[] 
        });
      });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
        data:[] 
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
          res.status(404).json({ status: false, message: "No booking found" });
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
  const currentDateTime = new Date();
  const year = currentDateTime.getFullYear();
  const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
  const day = ('0' + currentDateTime.getDate()).slice(-2);
  const hours = ('0' + currentDateTime.getHours()).slice(-2);
  const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
  const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
  
  const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  const startDateTime = new Date(currentDateTimeFormatted);
  // console.log("startDateTime",startDateTime);
  
   const endDateTime = new Date(currentDateTimeFormatted);
   endDateTime.setMinutes(endDateTime.getMinutes() + 30); // Add 30 minutes
  // console.log("endDateTime",endDateTime);

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
      {
      $match: {
        "event_data.end_time": endDateTime
      }
    }
    ]);
   // console.log("result",result);

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

          const title = "Event Expire";
          const message = 'Your event will be expired in next half hour';


          const seller_fcm_token = seller_record.fcm_token;

         


         /* var now = moment().toDate();
          const formattedCurrentDateTime = currentDateTime.toISOString();
          console.log("formattedCurrentDateTime",currentDateTimeFormatted)*/
          
    /*
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
            });*/

            const notification = {
              title: title,
              body: message,
            };

            const data = {
              // Additional data to send with the notification, if needed.
            };

          // Add notification to the guest
          var type = 'app';
          console.log("guest id",bookingData.guest_id);
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
    } else {
     //   console.log("No bookings found");
    }
  } catch (error) {
    console.error(error.toString() || "Error");
  }
};

const sendExpiredEventNotification = async () => {

  const currentDateTime = new Date();
  const year = currentDateTime.getFullYear();
  const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
  const day = ('0' + currentDateTime.getDate()).slice(-2);
  const hours = ('0' + currentDateTime.getHours()).slice(-2);
  const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
  const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
  
  const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  
  const startDateTime = new Date(currentDateTimeFormatted);
 // console.log("startDateTime",startDateTime);
 
  const endDateTime = new Date(currentDateTimeFormatted);
  endDateTime.setSeconds(endDateTime.getSeconds() + 1); // Add 1 second
  //console.log("endDateTime",endDateTime);
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
      {
        $match: {
          "event_data.end_time": { $gte: startDateTime, $lt: endDateTime }
        }
      }
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
          
          const seller_fcm_token = seller_record.fcm_token;
          var eventId = bookingData.event_id;

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
        .then(async () => {
          // Update successful
          await Booking.updateMany(
            { event_id: eventId },
            { $set: { 'status': 'expired' } }
          );
        const notification = {
          title: title,
          body: message,
        };

        const data = {
          // Additional data to send with the notification, if needed.
        };

        // Add notification to the guest
        var type = 'app';
        // console.log("guest id",bookingData.guest_id);
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
    } else {
      // console.log("No bookings found");
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







const get_guest_coupon_balance_old = async (req, res) => {
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
            console.log("inside if",event_id)
            if (eventDetails && eventDetails.status == 'active') {
              var event_data = eventDetails;
              
              if(eventDetails.type == "food_event" && eventDetails.is_cover_charge_added == "yes"){
                sum += item1.amount;
                break;
              }              
            }    
          }
      }
      else {
          sum = 0;
          var event_data = null;
      }
      

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
          if (result && result.length > 0) {
            console.log("result",result)
            const lastRecord = result[result.length - 1];
            res.status(200).json({
              status: true,
              message: "Data found",
              data: {"total_coupon_balance":lastRecord.total_coupon_balance,'event_data' : (event_data == undefined) ? null : event_data},
              
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
  var guest_id = req.query.guest_id;
  var event_id = req.query.event_id;

  if (!guest_id) {
    res.status(400).json({ status: false, message: "Guest ID is required in the request body" });
  } else {
    try {

       // Fetch all MenuItemBooking records for the guest

   /*   const result = await MenuItemPayments.aggregate([
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
            console.log("inside if",event_id)
            if (eventDetails && eventDetails.status == 'active') {
              var event_data = eventDetails;
              
              if(eventDetails.type == "food_event" && eventDetails.is_cover_charge_added == "yes"){
                sum += item1.amount;
                break;
              }              
            }    
          }
      }
      else {
          sum = 0;
          var event_data = null;
      }
      

      // Now you can use the sum in your aggregation
      const paymentAmount = sum;*/

      // Continue with the rest of your code...

      Booking.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
            status : 'active'
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
          $sort: { createdAt: 1 }, // Sort by createdAt in ascending order
        },
      ])
        .then(async(result) => {
          var total_coupon_balance = 0;
          if (result && result.length > 0) {
            for (const item2 of result) {
                const event_id = item2.event_id; // Access the event_id from the result

                // Check if the event is active
                const eventDetails = await EventModel.findOne({ '_id': event_id });
                if (eventDetails && eventDetails.status == 'active') {
                  var event_data = eventDetails;
               //  console.log("eventDetails",eventDetails)
                  
                  if(eventDetails.type == "food_event" && eventDetails.is_cover_charge_added == "yes"){
                   // console.log("item2",eventDetails)
                    total_coupon_balance = eventDetails.cover_charge;
                    break;
                  }              
                }   
               // console.log("eventDetails",eventDetails);
                //return false;
            }

            var event_id = event_data._id;
           // console.log("result 3",event_id)

            
     /*     var menu_payment_record_old = await MenuItemBookings.aggregate([
            {
              $match: {
                'guest_id': new mongoose.Types.ObjectId(guest_id),
                'event_id': new mongoose.Types.ObjectId(event_id),
              },
            },
            {
              $lookup: {
                from: 'menu_item_payments',
                localField: '_id',
                foreignField: 'payment_id',
                as: 'payment_data',
              },
            },
            {
              $sort: { 'createdAt': -1 },
            },

          ])
            .then(async (result2) => {

          
            
              if (result2.length > 0) {
              // console.log("hello",result2)
              var total = 0;
                for(var p_item of result2){
                  // console.log("item 33",p_item);
                  var payment_id = p_item.payment_id;
                  var payment_record = await MenuItemPayments.findById(payment_id);
                  console.log("payment_id",payment_id);
                  console.log("payment_record id", payment_record._id);
                  console.log("amount",payment_record.amount);
                  if(payment_id == payment_record._id){
                
                    console.log("payment_id",payment_id);
                    if(payment_record.amount!=undefined){
                      
                      total += payment_record.amount;
                        console.log("amount",payment_record.amount)
                    //  console.log("inside coupon blance",total_coupon_balance)
                    
                    }
                  
                  }
            
                      
                      
                    
                }

                console.log("total",total)
              // console.log("total_coupon_balance",total_coupon_balance)
                  total_coupon_balance = total_coupon_balance - total;
              } else {
                total_coupon_balance = total_coupon_balance;
              }
            })
            .catch((error) => {
              console.error("Error:", error);
            });*/

            var menu_payment_record = await MenuItemPayments.aggregate([
              
              {
                $lookup: {
                  from: 'menuitembookings',
                  localField: '_id',
                  foreignField: 'payment_id',
                  as: 'booking_data',
                },
              },
             {
                $match: {
                  "booking_data.event_id": new mongoose.Types.ObjectId(event_id),
                  "booking_data.guest_id": new mongoose.Types.ObjectId(guest_id)
             
                },
              },
              {
                $sort: { 'createdAt': -1 },
              },
  
            ])
              .then(async (result2) => {
  
                if (result2.length > 0) {
            
                var total = 0;
                  for(var p_item of result2){
                      if(p_item.amount!=undefined){                        
                        total += p_item.amount;
                      }
                  }
                    total_coupon_balance = total_coupon_balance - total;
                } else {
                  total_coupon_balance = total_coupon_balance;
                }
              })
              .catch((error) => {
                console.error("Error:", error);
              });





            if(event_data.is_cover_charge_added == "no"){
              event_data = undefined;
            }
            res.status(200).json({
              status: true,
              message: "Data found",
              data: {"total_coupon_balance":total_coupon_balance,'event_data' : (event_data == undefined) ? null : event_data},
              
            });
          } else {
            res.status(200).json({ status: false, message: "No data found", data: null});
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
             "payment_mode": { $nin: ["upi"] } , // Exclude documents with payment_mode not equal to "upi" or "pay on counter"

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
          var all_data = [];
          if (result && result.length > 0) {
            for (const booking of result) {
             
             
                const guestRecord = booking.guest_data[0];
                guestRecord.contact_number = booking.user_data[0].code_phone;
                all_data.push({
                  "guest_data": { ...guestRecord },
                  "booking_data": {
                    _id: booking._id,
                    event_id: booking.event_id,
                    guest_id: booking.guest_id,
                    payment_mode: booking.payment_mode,
                    status: booking.status,
                    transaction_id: booking.transaction_id,
                    amount: booking.amount,
                    createdAt: booking.createdAt,
                    updatedAt: booking.updatedAt,
                    __v: booking.__v,
                  },
                });
              
            }

            res.status(200).json({
              status: true,
              message: "Data found",
              data: all_data,
            });
          } else {
            res.status(404).json({
              status: false,
              message: "No guests found",
              data: [],
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
        .then(async(result) => {
          console.log("result", result);
     
          if (result && result.length > 0) {
            var data = [];
            var totalUPIBookingAmount = 0;
            var totalPayOnCounterBooking = 0;
            var totalCashBooking = 0;
            var totalCardBooking = 0;

            for (const booking of result) {
          
              var event_record = await EventModel.findById(booking.event_id);

              

              if(event_record.type == "food_event"){
                 if(event_record.is_cover_charge_added == "yes"){
                    if (booking.payment_mode === "counter_upi") {
                      totalUPIBookingAmount = event_record.cover_charge|| 0;
                    } 
                  

                    if (booking.payment_mode === "cash") {
                      totalCashBooking = event_record.cover_charge || 0;
                    }

                    if (booking.payment_mode === "card") {
                      totalCardBooking = event_record.cover_charge || 0;
                    }
                 } else {
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
                

                 
              } else {
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

// It will expire events and event's bookings
  
const close_event_by_seller = async (req, res) => {
  var event_id = req.body.event_id;
  var seller_id = req.body.seller_id;
  if (!event_id) {
    res.status(400).json({ status: false, message: "event_id is required in the request body" });
  } else {
    try {
      EventModel.findByIdAndUpdate(event_id, { 'status': 'expired' })
        .then(async () => {
          // Update successful
          await Booking.updateMany(
            { event_id: event_id },
            { $set: { 'status': 'expired' } }
          )
            .then((result) => {
              if (result) {

                res.status(200).json({
                  status: true,
                  message: "Closed successfully",
                  data: result,
                });
              } else {
                res.status(200).json({
                  status: false,
                  message: "No booking found",
                  data: null,
                });
              }
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

const get_booked_menu_list = async (req, res) => {
  try {
    // Extracting parameters from the request
    const event_id = req.query.event_id;
    const guest_id = req.query.guest_id;

    // Validate request parameters
    if (!guest_id && event_id) {
      return res.status(400).json({
        status: false,
        message: "Guest id and event id are required in the request body",
      });
    }

    // Check if the event exists
    const event = await EventModel.findById(event_id);
    if (!event) {
      return res.status(404).send({
        status: false,
        message: "Event not found",
        data: null,
      });
    }

    // MongoDB aggregation pipeline for fetching booked menu data
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
        $lookup: {
          from: "bookingmenus",
          localField: "_id",
          foreignField: "booking_id",
          as: "booked_menu_data",
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $match: {
          "event_id": new mongoose.Types.ObjectId(event_id),
          "guest_id": new mongoose.Types.ObjectId(guest_id),
          "status": "active",
        },
      }
    ];

    // Execute the aggregation pipeline
    const result = await Booking.aggregate(bookingPipeline);


    
    if (result && result.length > 0) {
      const refinedData = await Promise.all(
        result.map(async (item) => {
          const groupedMenuData = {};

          for (const bookedMenuRecord of item.booked_menu_data) {
            const menuRecord = await Menu.findById(bookedMenuRecord.menu_id);

            // Check if paymentRecord status is active
            const paymentRecord = await BookingPayments.findById(
              bookedMenuRecord.payment_id
            );

            if (paymentRecord && paymentRecord.status === 'active') {
              const menuKey = `${menuRecord.name}_${menuRecord._id}`;

              if (groupedMenuData[menuKey]) {
                // If the menu item already exists, add the quantity
                groupedMenuData[menuKey].menu_quantity += bookedMenuRecord.quantity;
              } else {
                // If the menu item doesn't exist, create a new entry
                groupedMenuData[menuKey] = {
                  ...menuRecord.toObject(),
                  menu_quantity: bookedMenuRecord.quantity,
                };
              }
            }
          }

          return Object.values(groupedMenuData); // Return an array of unique menu data
        })
      );

      const flattenedData = refinedData.flat();
      console.log("flattenedData",flattenedData)
      if(flattenedData.length > 0){
        res.status(200).json({
          status: true,
          message: "Data found",
          data: flattenedData,
        });

      } else {
        res.status(200).json({
          status: false,
          message: "No booked menus found",
          data: [],
        });
      }

      
    } 
      
    else {
      res.status(200).json({
        status: false,
        message: "No booked menus found",
        data: [],
      });
    }
  } catch (error) {
    // Handle errors during the try block
    console.log("error", error);
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
      data:null
    });
  }
};

const book_event_menu_items = async (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      const amount = req.body.amount;
      const booking_id = req.body.booking_id;
      var payment_mode = req.body.payment_mode;
      var transaction_id = req.body.transaction_id;
      var guest_id = req.body.guest_id;
      
        var bookingMenu = req.body.menu_list;

        if(payment_mode == "upi"){
          var status = "active";
        } else {
          var status = "pending";
        }
        if(bookingMenu.length > 0){

           // add menu payment data
            var bookingPaymentData = {
              'amount' : amount,
              "status"  : status,
              "payment_mode" : payment_mode,
              "transaction_id" : transaction_id

            };
            var paymentResponse =  await BookingPayments(bookingPaymentData).save();
            var paymentId = paymentResponse._id;

            for (const [key, value] of Object.entries(bookingMenu)) {
              var bookingMenuData = {
                "booking_id": booking_id,
                "guest_id" : guest_id,
                "menu_id": value.menu_id,
                "quantity": value.quantity,
                "payment_id" : paymentId,
              };

              await BookingMenu(bookingMenuData).save();
            }
          return res.status(200).send({ status: true, message: "success" , data : {payment_id : paymentId} });
          
        }
        return res.status(200).send({ status: true, message: "success" , data : "" });
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



const approve_event_menu_items_booking = async (req, res) => {
  var payment_id = req.body.payment_id;
  var validator_id = req.body.validator_id;


  if (!validator_id || !payment_id) {
    res.status(400).json({ status: false, message: "validator_id , payment_id id and  status are required in the request body" });
  } else {
    try {
      const result = await BookingPayments.findOneAndUpdate(
        { _id: payment_id },
        { $set: { validator_id: validator_id, status: "active" } },
        { new: true }
      );  


        if (result) {
            console.log("result",result)
            if(result.status == 'active'){
              var message =  "Booking is already approved";
            } else {
              var payment_id = result._id;
              var bookingMenus = await BookingMenu.find({'payment_id':payment_id});
              if(bookingMenus.length > 0){
                for(var bookingmenu of bookingMenus){
                  var menuId = bookingmenu.menu_id;
                  console.log("menu name",bookingmenu.name)
                  var bookingQUantity = bookingmenu.quantity;
                  var menuRecord = await Menu.findById(menuId);
                  console.log("menuRecord",menuRecord);
                  var menuTotalStock = menuRecord.total_stock;
                  console.log("menu_total_stock",menuTotalStock);
                  console.log("menu_id",menuId)
                  console.log("bookingQUantity",bookingQUantity);
                  var remainingStock = menuTotalStock - bookingQUantity;
    
                  await Menu.findOneAndUpdate(
                    { _id: menuId },
                    { $set: { total_stock: remainingStock} },
                    { new: true }
                  ); 
    
                }
              }
              var message =  "Booking approved successfully";
            }
            
          res.status(200).json({
            status: true,
            message: message,
            data: result,
          });
        } else {
          res.status(200).json({
            status: false,
            message: "No record found",
            data: null,
          });
        }
      
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
  get_approved_booking_cost,
  close_event_by_seller,
  get_booked_menu_list,
  book_event_menu_items,
  approve_event_menu_items_booking
}; 
