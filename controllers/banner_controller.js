const BannerModel = require("../models/banner.model");
const GuestModel = require("../models/guest.model");
const SellerModel = require("../models/seller.model");
const EventModel = require("../models/event.model");
const RelativeModel = require("../models/relative.model");
const GuestBannerModel = require("../models/guest_banner.model");
const Booking = require("../models/booking.model");

const User = require("../models/user.model");
const { ObjectId } = require('mongoose').Types;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { sendPushNotification } = require('../config/firebase.config'); // Update with the correct path to your module.
const { addNotification } = require('../helpers/notification_helper');

exports.create_banner = async (req, res, next) => {
  try {
    // Extracting values from request
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const image = req.file ? req.file.filename : undefined;
    const banner_type = req.body.banner_type;
    const date = req.body.date !== undefined && req.body.date !== null ? req.body.date.toString().trim() : null;

    // Checking if the seller exists
    const seller = await SellerModel.findOne({ user_id: seller_id });
    if (!seller) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }

    const sellerDistrict = seller.district;

    var banners = [];
    let filter;

    // Setting the dateField based on banner_type
    const dateField = banner_type === 'birthday' ? '$dob' : '$dom';

    // Filtering guests based on date and seller's district
    filter = {
      $match: {
        $expr: {
          $and: [
            {
              $gte: [
                { $substr: [dateField, 5, 5] },
                date.substring(5),
              ],
            },
            {
              $lt: [
                { $substr: [dateField, 5, 5] },
                date.substring(5) + '-01',
              ],
            },
          ],
        },
        'guest_data.district': sellerDistrict, // Matching seller's district with guest's district
      },
    };

    // Validation for date presence for specific banner types
    if (banner_type == "birthday" || banner_type == "anniversary") {
      if (!req.body.date) {
        return res.status(400).json({ status: false, message: "date is required in the request body" });
      }
    }

    // Fetching guest_list
    const guest_list = await RelativeModel.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guest_id',
          foreignField: 'user_id',
          as: 'guest_data',
        },
      },
      filter, // Applying the match condition
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              { $arrayElemAt: ['$guest_data', 0] }, // Get the first element of the 'guest_data' array
              { relative_name: '$full_name' }, // Add the relative full name to the result
            ],
          },
        },
      },
      {
        $project: {
          'guest_data': 0, // Exclude the 'guest_data' field from the final result
        },
      },
    ]);

   

    // Saving banner data
    const bannerData = {
      seller_id: new ObjectId(seller_id),
      banner_type,
      image,
    };

    const result = await BannerModel(bannerData).save();
    banners.push({
      ...result.toObject(),
      image: `${req.protocol}://${req.get('host')}/uploads/banners/${result.image}`,
    });

    var banner_id = result._id;

     // Sending push notifications to guests
    if (guest_list.length > 0) {
      for (item of guest_list) {
        const user_data = await User.findOne({ '_id': item.user_id });
        var guest_name = item.full_name;
        var relative_name = item.relative_name;

         // Building notification description based on banner type
         var description;
         if (banner_type == "birthday") {
           description = "Hi, " + guest_name + " your dear one " + relative_name + "'s birthday is on " + date + ". Come and celebrate with us";
         } else if (banner_type == "anniversary") {
           description = "Hi, " + guest_name + " your dear one " + relative_name + "'s marriage anniversary is on " + date + ". Come and celebrate with us";
         }

        var guestBannerData = {'guest_id' : item.user_id,'banner_id' : banner_id ,'description':description }

        await GuestBannerModel(guestBannerData).save();

       

        var fcm_token = user_data.fcm_token;

        console.log("description", description);
        const notification = {
          title: banner_type + ' banner added',
          body: description,
        };

        var data = {};

        // Sending push notification
        sendPushNotification(fcm_token, notification, data)
          .then(() => {
            console.log('Push notification sent successfully.');
          })
          .catch((error) => {
            console.error('Error sending push notification:', error);
          });
      }
    }




    // Sending success response
    res.status(201).send({
      status: true,
      message: 'Success',
      data: banners[0],
    });

  } catch (error) {
    console.error('Error:', error);
    // Sending error response
    res.status(500).send({
      status: false,
      message: error.toString() || 'Internal Server Error',
      data: null,
    });
  }
};



exports.get_all_banners = async (req, res) => {
    const seller_id = req.query.seller_id;
    console.log("seller_id",seller_id)
    try {
      await BannerModel.aggregate([
        {
          $match: {
            seller_id: new mongoose.Types.ObjectId(seller_id),
          },
        },
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
      ])
        .then((result) => {
          if (result) {
          //  console.log("result",result)
            var banner_data = [];
         
  
            for(const banner of result){
               // Get the host (domain and port)
            const protocol = req.protocol;
            const host = req.get('host');

             // Combine protocol, host, and any other parts of the base URL you need
            const baseURL = `${protocol}://${host}`;
            const imageUrl = baseURL + '/uploads/banners/' + banner.image;
                const response = {
                  _id: banner._id,
                  seller_id: banner.seller_id,
                  event_id: banner.event_id,
                  image: imageUrl,
                  createdAt: banner.createdAt,
                  updatedAt: banner.updatedAt,
  
                };
                banner_data.push(response);
  
            }
            res.status(200).send({
              status: true,
              message: "Data found",
              data: banner_data,
            });
          }
        })
        .catch((error) => {
          res.send({
            status: false,
            message: error.toString() ?? "Error",
            data:null
          });
        });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
        data:null
      });
    }
};

exports.get_banner = async (req, res) => {
  const banner_id = req.query.banner_id;

  if (!banner_id) {
    res.status(400).send({ status: false, message: "Banner ID missing", data:null });
  } else {
    try {
      const result = await BannerModel.findById(banner_id);

      if (result) {
        const baseURL = `${req.protocol}://${req.get('host')}`;
        const imageUrl =  baseURL + '/uploads/banners/' + result.image;

        const bannerData = {
          _id: result._id,
          seller_id: result.seller_id,
          event_id: result.event_id,
          images: imageUrl,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt,
        };
        res.status(200).send({
          status: true,
          message: "Data found",
          data: bannerData,
        });
      } else {
        res.status(404).send({ status: false, message: "Banner not found", data:null });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
        data:null
      });
    }
  }
};


exports.update_banner = async (req, res, next) => {
  try {
    // Extracting values from request
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const image = req.file ? req.file.filename : undefined;
    const banner_type = req.body.banner_type;
    const date = req.body.date !== undefined && req.body.date !== null ? req.body.date.toString().trim() : null;
    var banner_id = req.body.banner_id;

    // Checking if the seller exists
    const seller = await SellerModel.findOne({ user_id: seller_id });
    if (!seller) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }

    const sellerDistrict = seller.district;

    var banners = [];
    let filter;

    // Setting the dateField based on banner_type
    const dateField = banner_type === 'birthday' ? '$dob' : '$dom';

    // Filtering guests based on date and seller's district
    filter = {
      $match: {
        $expr: {
          $and: [
            {
              $gte: [
                { $substr: [dateField, 5, 5] },
                date.substring(5),
              ],
            },
            {
              $lt: [
                { $substr: [dateField, 5, 5] },
                date.substring(5) + '-01',
              ],
            },
          ],
        },
        'guest_data.district': sellerDistrict, // Matching seller's district with guest's district
      },
    };

    // Validation for date presence for specific banner types
    if (banner_type == "birthday" || banner_type == "anniversary") {
      if (!req.body.date) {
        return res.status(400).json({ status: false, message: "date is required in the request body" });
      }
    }

  

    // Updating banner data
    if(image!=undefined){
      var updatedBannerData = {
        seller_id: new ObjectId(seller_id),
        banner_type,
        date,
        image,
      };
    } else {
      var updatedBannerData = {
        seller_id: new ObjectId(seller_id),
        banner_type,
        date,
      };
    }
    

    const result = await BannerModel.findOneAndUpdate(
      { _id: new ObjectId(banner_id) }, // Assuming you have a unique identifier for each banner
      updatedBannerData,
      { new: true, upsert: true } // Creating a new document if not found
    );

    banners.push({
      ...result.toObject(),
      image: `${req.protocol}://${req.get('host')}/uploads/banners/${result.image}`,
    });

    // Fetching guest_list
    const guest_list = await RelativeModel.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guest_id',
          foreignField: 'user_id',
          as: 'guest_data',
        },
      },
      filter, // Applying the match condition
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              { $arrayElemAt: ['$guest_data', 0] }, // Get the first element of the 'guest_data' array
              { relative_name: '$full_name' }, // Add the relative full name to the result
            ],
          },
        },
      },
      {
        $project: {
          'guest_data': 0, // Exclude the 'guest_data' field from the final result
        },
      },
    ]);

    console.log("guest_list", guest_list);

    // Sending push notifications to guests
    if (guest_list.length > 0) {
      for (item of guest_list) {
        const user_data = await User.findOne({ '_id': item.user_id });
        var guest_name = item.full_name;
        var relative_name = item.relative_name;

        // Building notification description based on banner type
        var description;
        if (banner_type == "birthday") {
          description = "Hi, " + guest_name + " your dear one " + relative_name + "'s birthday is on " + date + ". Come and celebrate with us";
        } else if (banner_type == "anniversary") {
          description = "Hi, " + guest_name + " your dear one " + relative_name + "'s marriage anniversary is on " + date + ". Come and celebrate with us";
        }

        var fcm_token = user_data.fcm_token;

        var guestBannerData = {'guest_id' : item.user_id,'banner_id' : banner_id,'description':description }


          // Check if the record already exists
          const existingRecord = await GuestBannerModel.findOne(guestBannerData);
          if (!existingRecord) {
            await GuestBannerModel(guestBannerData).save();
             
          }




        console.log("description", description);
        const notification = {
          title: banner_type + ' banner updated',
          body: description,
        };

        var data = {};

        // Sending push notification
        sendPushNotification(fcm_token, notification, data)
          .then(() => {
            console.log('Push notification sent successfully.');
          })
          .catch((error) => {birthday
            console.error('Error sending push notification:', error);
          });
      }
    }

    // Sending success response
    res.status(200).send({
      status: true,
      message: 'Banner updated successfully',
      data: banners[0],
    });

  } catch (error) {
    console.error('Error:', error);
    // Sending error response
    res.status(500).send({
      status: false,
      message: error.toString() || 'Internal Server Error',
      data: null,
    });
  }
};


exports.delete_banner = async (req, res) => {
  const banner_id = req.query.banner_id;

  if (!banner_id) {
    return res.status(400).send({ status: false, message: "banner ID missing", data: null });
  }

  try {
    const banner = await BannerModel.findById(banner_id);

    if (!banner) {
      return res.status(404).send({ status: false, message: "Banner not found", data: null });
    }

    // Delete associated image from the folder
    if (banner.image) {
      const imagePath = path.join(__dirname, '../uploads/banners'); // Adjust the path accordingly
      const filePath = path.join(imagePath, banner.image);

      try {
        fs.unlinkSync(filePath); // Synchronously delete the file
      } catch (err) {
        console.error("Error deleting file:", err);
        // Handle the error as needed, e.g., log it and continue
      }
    }

    const result = await BannerModel.findByIdAndDelete(banner_id);

    if (result) {
      return res.status(200).send({ status: true, message: "Banner deleted", data: null });
    } else {
      return res.status(404).send({ status: false, message: "Banner not found", data: null });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null
    });
  }
};

exports.get_guest_banner_list = async (req, res) => {
  const guest_id = req.query.guest_id;

  try {
    const guest = await GuestModel.findById(guest_id);
    if (!guest) {
      return res.status(404).send({
        status: false,
        message: "Guest not found",
        data: null,
      });
    }

    const guestCity = guest.district;
    var guestUserId =  guest.user_id;


    const banners = await BannerModel.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
    ]);

    if (banners && banners.length > 0) {
      const banner_data = [];
  
      for (const banner of banners) {
        const seller = await SellerModel.findOne({ user_id: banner.seller_id, district: guestCity });
        var user_record = await User.findById(seller.user_id);
        console.log("user_record",user_record)


        if (seller && seller.district === guestCity) {
          // Cities match, include banner in the response
          const protocol = req.protocol;
          const host = req.get('host');
          const baseURL = `${protocol}://${host}`;
          const imageUrl = baseURL + '/uploads/banners/' + banner.image;
          var bannerType = banner.banner_type;
          let includeBanner = true;
          

        
          if(bannerType == "birthday" || bannerType == "anniversary"){
          
           var guestBannerResult =  await GuestBannerModel.aggregate([
              {
                $match: {
                  guest_id: new mongoose.Types.ObjectId(guestUserId),
                  banner_id: new mongoose.Types.ObjectId(banner._id),
                },
              },
              {
                $sort: { createdAt: -1 }, // Sort by createdAt in descending order
              },
            ]);
            console.log("guestBannerResult",guestBannerResult)

            if (guestBannerResult.length == 0) {
              // If the guest doesn't have this type of banner, exclude it from the response
              includeBanner = false;
              
            }
            console.log("includeBanner",includeBanner)
            if (includeBanner){
              

              const response = {
                _id: banner._id,
                seller_id: banner.seller_id,
                event_id: "",
                banner_type:bannerType,
                image: imageUrl,
                seller_mobile_number:user_record.code_phone,
                description: guestBannerResult[0].description,
                createdAt: banner.createdAt,
                updatedAt: banner.updatedAt,
              };

          banner_data.push(response);
             

            }
          } else {

            var  eventRecord  = await EventModel.findOne({ banner_id : banner._id });
            const response = {
              _id: banner._id,
              seller_id: banner.seller_id,
              event_id: eventRecord ? eventRecord._id:"",
              banner_type:bannerType,
              image: imageUrl,
              description:'',
              seller_mobile_number:user_record.code_phone,
              createdAt: banner.createdAt,
              updatedAt: banner.updatedAt,
            };

          banner_data.push(response);
          }
        }
      }
      if(banner_data.length > 0){
        res.status(200).send({
          status: true,
          message: "Data found",
          data: banner_data,
        });
      } else {
        res.status(200).send({
          status: true,
          message: "No banners found",
          data: banner_data,
        });
      }
      
    } else {
      res.status(200).send({
        status: true,
        message: "No banners found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};


exports.get_guest_list_for_banner = async (req, res) => {
  const seller_id = req.query.seller_id;
  const banner_type = req.query.banner_type;
  const date = req.query.date;

  try {
    const seller = await SellerModel.findOne({ user_id: seller_id });
    if (!seller) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }

    const sellerDistrict = seller.district;
    let filter;

    const dateField = banner_type === 'birthday' ? '$dob' : '$dom';




    filter = {
      $match: {
        $expr: {
          $and: [
            {
              $gte: [
                { $substr: [dateField, 5, 5] },
                date.substring(5),
              ],
            },
            {
              $lt: [
                { $substr: [dateField, 5, 5] },
                date.substring(5) + '-01',
              ],
            },
          ],
        },
        'guest_data.district': sellerDistrict, // Matching seller's district with guest's district
      },
    };

    const guest_list = await RelativeModel.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $lookup: {
          from: 'guests',
          localField: 'guest_id',
          foreignField: 'user_id',
          as: 'guest_data',
        },
      },
      filter, // Applying the match condition
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              { $arrayElemAt: ['$guest_data', 0] }, // Get the first element of the 'guest_data' array
              { relative_name: '$full_name' }, // Add the relative full name to the result
            ],
          },
        },
      },
      {
        $project: {
          'guest_data': 0, // Exclude the 'guest_data' field from the final result
        },
      },
    ]);

    console.log("guest_list", guest_list);

    if (guest_list && guest_list.length > 0) {
      res.status(200).send({
        status: true,
        message: "Data found",
        data: guest_list,
      });
    } else {
      res.status(200).send({
        status: true,
        message: "No guests found",
        data: [],
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.get_remind_list_for_event = async (req, res) => {
  const guest_id = req.query.guest_id;
  const currentDateTime = new Date();
  const year = currentDateTime.getFullYear();
  const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
  const day = ('0' + currentDateTime.getDate()).slice(-2);
  const hours = ('0' + currentDateTime.getHours()).slice(-2);
  const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
  const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
  
  const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
  
  const startDateTime = new Date(currentDateTimeFormatted);

  try {
      const guest = await GuestModel.findOne({ user_id: guest_id });
      if (!guest) {
          return res.status(404).send({
              status: false,
              message: "Guest not found",
              data: null,
          });
      }

      var guestBannerResult = await GuestBannerModel.aggregate([
          {
              $match: {
                  guest_id: new mongoose.Types.ObjectId(guest_id),
              },
          },
          {
              $lookup: {
                  from: 'relatives',
                  localField: 'guest_id',
                  foreignField: 'guest_id',
                  as: 'relative_data',
              },
          },
          {
              $lookup: {
                  from: 'banners',
                  localField: 'banner_id',
                  foreignField: '_id',
                  as: 'banner_data',
              },
          },
          {
              $sort: { createdAt: -1 }, // Sort by createdAt in descending order
          },
      ]);

      if (guestBannerResult && guestBannerResult.length > 0) {
          var invitation_list = [];
          var addedEventIds = new Set(); // Keep track of added event IDs

          for (const item of guestBannerResult) {
              var relative_data = item.relative_data[0];
              console.log("banner",item);
              var banner_data = item.banner_data[0];
            
              const relative_name = relative_data.full_name;
              var birthday_date = relative_data.dob;
              var anniversay_date = relative_data.dom;
              var banner_type = (banner_data) ? banner_data.banner_type : '';
              var seller_id = (banner_data) ? banner_data.seller_id : '';
              let description, title;

              if (banner_type == "birthday") {
                  birthday_date = new Date(birthday_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  description = "Your dear one " + relative_name + "'s birthday is on " + birthday_date + ". Come and celebrate with us";
                  title = 'Birthday invitation';
                  invitation_list.push({ 'title': title, 'description': description });
              } else if (banner_type == "anniversary") {
                  anniversay_date = new Date(anniversay_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  description = "Your dear one " + relative_name + "'s marriage anniversary is on " + anniversay_date + ". Come and celebrate with us";
                  title = 'Anniversary invitation';
                  invitation_list.push({ 'title': title, 'description': description });
              }
          }

          var bookedEventData = await Booking.aggregate([
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
                      guest_id: new mongoose.Types.ObjectId(guest_id),
                      'event_data.seller_id': banner_data ? new mongoose.Types.ObjectId(seller_id) : '',
                      'event_data.status': 'active',
                      'event_data.start_time': { $gte: startDateTime}

                  },
              },
              {
                  $sort: { createdAt: -1 }, // Sort by createdAt in descending order
              },
          ]);

          console.log("bookedEventData", bookedEventData);

          if (bookedEventData.length > 0) {
              for (const [key, item1] of Object.entries(bookedEventData)) {

                  var event_data = item1.event_data[0];
                  console.log("event_data", event_data);

                  var event_name = event_data.name;
                  var event_start_date = event_data.start_time;
                  var event_end_date = event_data.event_end_time;
                  description = "your event " + event_name + " is on " + event_start_date;
                  title = 'Event invitation';
                  var event_id = event_data._id.toString(); // Convert ObjectID to string
                  // Check if event ID already added
                  if (!addedEventIds.has(event_id)) {
                      addedEventIds.add(event_id); // Add event ID to set
                      var event_name = event_data.name;
                      var event_start_date = event_data.start_time;
                      var event_end_date = event_data.event_end_time;
                      description = "Your event " + event_name + " is on " + event_start_date;
                      title = 'Event invitation';
                      invitation_list.push({ 'title': title, 'description': description });
                  }
              }
          }

          if(invitation_list.length > 0){
              res.status(200).send({
                status: true,
                message: "Data found",
                data: invitation_list,
            });
          } else {
            res.status(200).send({
              status: false,
              message: "No data found",
              data: invitation_list,
          });
          }

          
      } else {
          res.status(200).send({
              status: false,
              message: "No data found",
              data: [],
          });
      }
  } catch (error) {
      console.log("error", error);
      res.status(500).send({
          status: false,
          message: error.toString() || "Internal Server Error",
          data: null,
      });
  }
};


exports.sendRemindNotificationOfEventold = async () => {
  const currentDateTime = new Date();
  const month = currentDateTime.getMonth() + 1;
  const day = currentDateTime.getDate();

  try {
    let filter;

    filter = [
      {
        $match: {
          $expr: {
            $or: [
              {
                $and: [
                  { $eq: [{ $month: '$dob' }, month] }, 
                  { $eq: [{ $dayOfMonth: '$dob' }, day] },
                ],
              },
              {
                $and: [
                  { $eq: [{ $month: '$dom' }, month] }, 
                  { $eq: [{ $dayOfMonth: '$dom' }, day] },
                ],
              },
            ],
          },
        },
      },
    ];

    const remind_list = await RelativeModel.aggregate([
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      {
        $lookup: {
          from: 'guests',
          localField: 'guest_id',
          foreignField: 'user_id',
          as: 'guest_data',
        },
      },
      {
        $addFields: {
          dob_minus_12h: { $subtract: ['$dob', 12 * 60 * 60 * 1000] }, // 12 hours before dob
          dom_minus_12h: { $subtract: ['$dom', 12 * 60 * 60 * 1000] }, // 12 hours before dom
          dob_minus_24h: { $subtract: ['$dob', 24 * 60 * 60 * 1000] }, // 24 hours before dob
          dom_minus_24h: { $subtract: ['$dom', 24 * 60 * 60 * 1000] }, // 24 hours before dom
        },
      },
      {
        $match: {
          $or: [
            { $and: [{ $eq: [{ $month: '$dob' }, month] }, { $eq: [{ $dayOfMonth: '$dob' }, day] }] }, // Current date is dob
            { $and: [{ $eq: [{ $month: '$dom' }, month] }, { $eq: [{ $dayOfMonth: '$dom' }, day] }] }, // Current date is dom
            { $and: [{ $eq: [{ $month: '$dob_minus_12h' }, month] }, { $eq: [{ $dayOfMonth: '$dob_minus_12h' }, day] }] }, // 12 hours before dob
            { $and: [{ $eq: [{ $month: '$dom_minus_12h' }, month] }, { $eq: [{ $dayOfMonth: '$dom_minus_12h' }, day] }] }, // 12 hours before dom
            { $and: [{ $eq: [{ $month: '$dob_minus_24h' }, month] }, { $eq: [{ $dayOfMonth: '$dob_minus_24h' }, day] }] }, // 24 hours before dob
            { $and: [{ $eq: [{ $month: '$dom_minus_24h' }, month] }, { $eq: [{ $dayOfMonth: '$dom_minus_24h' }, day] }] }, // 24 hours before dom
          ],
        },
      },
      { $unset: 'guest_data' },
    ]);
    if (remind_list && remind_list.length > 0) {
      for (const item of remind_list) {
        console.log("item",item);

        const user_data = await User.findOne({ '_id': item.guest_id });
        const guest_name = item.full_name;
        const relative_name = item.relative_name;
        let description;
        console.log("dob month",item.dob.getMonth() + 1)

        if (month === item.dob.getMonth() + 1 && day === item.dob.getDate()) {
          description = `Hi, ${guest_name}, your dear one ${relative_name}'s birthday is today. Come and celebrate with us!`;
        } else if (month === item.dom.getMonth() + 1 && day === item.dom.getDate()) {
          description = `Hi, ${guest_name}, your dear one ${relative_name}'s marriage anniversary is today. Come and celebrate with us!`;
        } else if (month === item.dob.getMonth() + 1 && day === item.dob.getDate() &&
          month === item.dom.getMonth() + 1 && day === item.dom.getDate()) {
          description = `Hi, ${guest_name}, your dear one ${relative_name} has both birthday and marriage anniversary today. Come and celebrate with us!`;
        }else if ((month === item.dob_minus_12h.getMonth() + 1 && day === item.dob_minus_12h.getDate()) ||
        (month === item.dom_minus_12h.getMonth() + 1 && day === item.dom_minus_12h.getDate())) {
        description = `Hi, ${guest_name}, your dear one ${relative_name}'s birthday or marriage anniversary is 12 hours away. Don't forget to prepare!`;
      }

        const fcm_token = user_data.fcm_token;

        const notification = {
          title: 'Event Notification',
          body: description,
        };

        // Sending push notification
        sendPushNotification(fcm_token, notification, {})
          .then(() => {
            console.log('Push notification sent successfully.');
          })
          .catch((error) => {
            console.error('Error sending push notification:', error);
          });
      }
    }
  } catch (error) {
    console.log("error", error);
  }
};

exports.sendRemindNotificationOfEvent = async () => {
  const currentDateTime = new Date();
  const year = currentDateTime.getFullYear();

  const month = currentDateTime.getMonth() + 1;
  const day = currentDateTime.getDate();
  const c_month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
  const c_day = ('0' + currentDateTime.getDate()).slice(-2);
  const hours = ('0' + currentDateTime.getHours()).slice(-2);
  const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
  const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);

  // Calculate twelve hours before the current time
// Calculate twelve hours before the current time
const twelveHoursBeforeStartForEvent1 = new Date(currentDateTime.getTime() - (12 * 60 * 60 * 1000));
const offset = currentDateTime.getTimezoneOffset() * 60 * 1000; // Get timezone offset in milliseconds
const twelveHoursBeforeStartForEventAdjusted = new Date(twelveHoursBeforeStartForEvent1.getTime() - offset);
const twelveHoursBeforeStartForEventFormatted = twelveHoursBeforeStartForEventAdjusted.toISOString().substring(0, 19) + '.000';console.log("twelveHoursBeforeStartForEventFormatted",twelveHoursBeforeStartForEventFormatted);
console.log("twelveHoursBeforeStartForEventFormatted",twelveHoursBeforeStartForEventFormatted);


// Calculate 24 hours before the current time
const twentyFourHoursBeforeStartForEvent1 = new Date(currentDateTime.getTime() - (24 * 60 * 60 * 1000));
const offset24 = currentDateTime.getTimezoneOffset() * 60 * 1000; // Get timezone offset in milliseconds
const twentyFourHoursBeforeStartForEventAdjusted = new Date(twentyFourHoursBeforeStartForEvent1.getTime() - offset24);
const twentyFourHoursBeforeStartForEventFormatted = twentyFourHoursBeforeStartForEventAdjusted.toISOString().substring(0, 19) + '.000';

console.log("twentyFourHoursBeforeStartForEventFormatted",twentyFourHoursBeforeStartForEventFormatted);

console.log("current month",month);
  console.log("current day",day);

  var thour1 = (hours > 12) ? hours - 12 : 12 - hours;
  thour  = thour1 < 10 ? '0' + thour1 :thour1;


  var thhour1 = (hours > 24) ? hours - 24 : 24 - hours;
 
  thhour  = thhour1 < 10 ? '0' + thhour1 :hours;

  console.log("hours",hours);
  console.log("thour",thour)

  const currentDateTimeFormatted = `${year}-${c_month}-${c_day}T${hours}:${minutes}:${seconds}.000Z`;
  var  currentDateTimeFormattedForEvent = `${year}-${c_month}-${c_day}T00:00:00.000`;
  const currentDateTimeFormattedForEvent1 = `${year}-${c_month}-${c_day}T${hours}:${minutes}:${seconds}.000`;
 
  currentDateTime.setHours(currentDateTime.getHours() - 24);
  
  const twentyFourHoursBeforeStart = `${year}-${c_month}-${day}T${hours}:${minutes}:${seconds}.000Z`;


  
  const startDateTime = new Date(currentDateTimeFormatted);



  try {
    const remind_list = await RelativeModel.aggregate([
      { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
      {
        $lookup: {
          from: 'guests',
          localField: 'guest_id',
          foreignField: 'user_id',
          as: 'guest_data',
        },
      },
      {
        $addFields: {
          dob_minus_12h: { $subtract: ['$dob', 12 * 60 * 60 * 1000] }, // 12 hours before dob
          dom_minus_12h: { $subtract: ['$dom', 12 * 60 * 60 * 1000] }, // 12 hours before dom
          dob_minus_24h: { $subtract: ['$dob', 24 * 60 * 60 * 1000] }, // 24 hours before dob
          dom_minus_24h: { $subtract: ['$dom', 24 * 60 * 60 * 1000] }, // 24 hours before dom
        },
      },
      {
        $match: {
          $expr: {
            $or: [
              { $and: [{ $eq: [{ $month: '$dob' }, month] }, { $eq: [{ $dayOfMonth: '$dob' }, day] }] }, // Current date is dob
              { $and: [{ $eq: [{ $month: '$dom' }, month] }, { $eq: [{ $dayOfMonth: '$dom' }, day] }] }, // Current date is dom
              { $and: [
                { $eq: [{ $month: '$dob_minus_12h' }, month] },
                { $eq: [{ $dayOfMonth: '$dob_minus_12h' }, day] },
                { $eq: [{ $hour: '$dob_minus_12h' }, currentDateTime.getHours()] },
                { $eq: [{ $minute: '$dob_minus_12h' }, currentDateTime.getMinutes()] },
              ]}, // 12 hours before dob
              { $and: [
                { $eq: [{ $month: '$dom_minus_12h' }, month] },
                { $eq: [{ $dayOfMonth: '$dom_minus_12h' }, day] },
                { $eq: [{ $hour: '$dom_minus_12h' }, currentDateTime.getHours()] },
                { $eq: [{ $minute: '$dom_minus_12h' }, currentDateTime.getMinutes()] },
              ]}, // 12 hours before dom
              { $and: [
                { $eq: [{ $month: '$dob_minus_24h' }, month] },
                { $eq: [{ $dayOfMonth: '$dob_minus_24h' }, day] },
                { $eq: [{ $hour: '$dob_minus_24h' }, currentDateTime.getHours()] },
                { $eq: [{ $minute: '$dob_minus_24h' }, currentDateTime.getMinutes()] },
              ]}, // 24 hours before dob
              { $and: [
                { $eq: [{ $month: '$dom_minus_24h' }, month] },
                { $eq: [{ $dayOfMonth: '$dom_minus_24h' }, day] },
                { $eq: [{ $hour: '$dom_minus_24h' }, currentDateTime.getHours()] },
                { $eq: [{ $minute: '$dom_minus_24h' }, currentDateTime.getMinutes()] },
              ]}, // 24 hours before dom

            ],
          },
        },
      },
      { $unset: 'guest_data' },
    ]);

    console.log("remind_list",remind_list)

    if (remind_list && remind_list.length > 0) {
      for (const item of remind_list) {
        console.log("user_data",item);

        const user_data = await User.findOne({ '_id': item.guest_id });
        const guest_name = item.full_name;
        const relative_name = item.full_name;
        console.log("dob month",item.dob.getMonth() + 1);
        console.log("dob day",item.dob_minus_12h.getDate());
        let description;
        let title;

        if((month === item.dob.getMonth() + 1 && day === item.dob.getDate() -1)) {
            console.log("here")
            title = 'Birthday invitation';
            description = `Your dear one ${relative_name}'s birthday today. Come and celebrate with us!`;
        } 
        if((month === item.dom.getMonth() + 1 && day === item.dom.getDate() -1 )) {
          title = 'Anniversary invitation';
             description = `Your dear one ${relative_name}'s marriage anniversary is today. Come and celebrate with us!`;
         } 
         if ((month === item.dob_minus_12h.getMonth() + 1 && day === item.dob_minus_12h.getDate()) && currentDateTime.getHours() === item.dob_minus_12h.getHours() && currentDateTime.getMinutes() === item.dob_minus_12h.getMinutes()) {
          title = 'Birthday invitation';
          description = `Your dear one ${relative_name}'s birthday  is 12 hours away. Don't forget to prepare!`;
        } 

        if ((month === item.dom_minus_12h.getMonth() + 1 && day === item.dom_minus_12h.getDate()) &&
        currentDateTime.getHours() === item.dom_minus_12h.getHours() &&
        currentDateTime.getMinutes() === item.dom_minus_12h.getMinutes()) {
          title = 'Anniversary invitation';
          description = `Your dear one ${relative_name}'s marriage anniversary is 12 hours away. Don't forget to prepare!`;
        }


        if ((month === item.dob_minus_24h.getMonth() + 1 && day === item.dob_minus_24h.getDate()) &&
        currentDateTime.getHours() === item.dob_minus_24h.getHours() &&
        currentDateTime.getMinutes() === item.dob_minus_24h.getMinutes()) {
              title = 'Birthday invitation';
          description = `Your dear one ${relative_name}'s birthday is 24 hours away. Get ready for the celebration!`;
        }

        if ((month === item.dom_minus_24h.getMonth() + 1 && day === item.dom_minus_24h.getDate() &&
        currentDateTime.getHours() === item.dom_minus_24h.getHours() &&
        currentDateTime.getMinutes() === item.dom_minus_24h.getMinutes() )) {
          title = 'Anniversary invitation';
        description = `Your dear one ${relative_name}'s marriage anniversary is 24 hours away. Get ready for the celebration!`;
      }

        console.log("description",description);

        const fcm_token = user_data.fcm_token;

        if (description && fcm_token) {
          const notification = {
            title: title,
            body: description,
          };
          addNotification(item.guest_id, item.guest_id , title, description, 'app');


          // Sending push notification
          sendPushNotification(fcm_token, notification, {})
            .then(() => {
              console.log('Push notification sent successfully.');
            })
            .catch((error) => {
              console.error('Error sending push notification:', error);
            });
        }
      }
    }


    var eventBannerData = await BannerModel.find({'banner_type' : 'event'});
    console.log("eventBannerData",eventBannerData);
    console.log("currentDateTimeFormattedForEvent",currentDateTimeFormattedForEvent1);
    console.log("twelveHoursBeforeStartForEvent",twelveHoursBeforeStartForEventFormatted);
    console.log("twentyFourHoursBeforeStartForEvent",twentyFourHoursBeforeStartForEventFormatted)


    if(eventBannerData.length > 0){
      for(item of eventBannerData){
        var seller_id = item.seller_id;
        var bookedEventData = await Booking.aggregate([
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
                  'event_data.status': 'active',
                  'event_data.seller_id': new mongoose.Types.ObjectId(seller_id),

                  $or: [
                    { 'event_data.start_time': { $gte: currentDateTimeFormattedForEvent } }, // Event is today or in the future
                    { 'event_data.start_time': { $gte: twelveHoursBeforeStartForEventFormatted, $lt: currentDateTimeFormattedForEvent1 } }, // Event is 12 hours before current date time
                    { 'event_data.start_time': { $gte: twentyFourHoursBeforeStartForEventFormatted, $lt: currentDateTimeFormattedForEvent1 } }, // Event is 24 hours before current date time
                ]
    
              },
          },
          {
              $sort: { createdAt: -1 }, // Sort by createdAt in descending order
          },
        ]);
    
         console.log("bookedEventData", bookedEventData);
         var addedEventIds = new Set(); 
        if (bookedEventData.length > 0) {
            for (const [key, item1] of Object.entries(bookedEventData)) {
    
                var event_data = item1.event_data[0];
                console.log("event_data", event_data);
    
                var event_name = event_data.name;
                var event_start_date = event_data.start_time;
                var event_end_date = event_data.event_end_time;
                description = "your event " + event_name + " is on " + event_start_date;
                title = 'Event invitation';
                var event_id = event_data._id.toString(); // Convert ObjectID to string
                // Check if event ID already added
                if (!addedEventIds.has(event_id)) {
                    addedEventIds.add(event_id); // Add event ID to set
                    var event_name = event_data.name;
                    var event_start_date = event_data.start_time;
                    var event_end_date = event_data.event_end_time;
                    description = "Your event " + event_name + " is on " + event_start_date;
                    title = 'Event invitation';
                    const user_data = await User.findOne({ '_id': item1.guest_id});
                    var fcm_token = user_data.fcm_token;
                    const notification = {
                      title: title,
                      body: description,
                    };

                    addNotification(item1.guest_id, item1.guest_id , title, description, 'app');
          
                    // Sending push notification
                    sendPushNotification(fcm_token, notification, {})
                      .then(() => {
                        console.log('Push notification sent successfully.');
                      })
                      .catch((error) => {
                        console.error('Error sending push notification:', error);
                      });
                }
            }
        }
      }
    }



  } catch (error) {
    console.log("error", error);
  }
};

  
  
  
  
  
  
  

