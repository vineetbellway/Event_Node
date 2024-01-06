const BannerModel = require("../models/banner.model");
const GuestModel = require("../models/guest.model");
const SellerModel = require("../models/seller.model");
const RelativeModel = require("../models/relative.model");
const GuestBannerModel = require("../models/guest_banner.model");
const User = require("../models/user.model");
const { ObjectId } = require('mongoose').Types;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { sendPushNotification } = require('../config/firebase.config'); // Update with the correct path to your module.


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
          .catch((error) => {birthday
            console.error('Error sending push notification:', error);
          });
      }
    }

    console.log("image",image);
  

    // Updating banner data
    const updatedBannerData = {
      seller_id: new ObjectId(seller_id),
      banner_type,
      date,
      image,
    };

    const result = await BannerModel.findOneAndUpdate(
      { seller_id: new ObjectId(seller_id) }, // Assuming you have a unique identifier for each banner
      updatedBannerData,
      { new: true, upsert: true } // Creating a new document if not found
    );

    banners.push({
      ...result.toObject(),
      image: `${req.protocol}://${req.get('host')}/uploads/banners/${result.image}`,
    });

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

    console.log("guestCity",guestCity)

    const banners = await BannerModel.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
    ]);

    if (banners && banners.length > 0) {
      const banner_data = [];
  
      for (const banner of banners) {
        const seller = await SellerModel.findOne({ user_id: banner.seller_id, district: guestCity });

        if (seller && seller.district === guestCity) {
          // Cities match, include banner in the response
          const protocol = req.protocol;
          const host = req.get('host');
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

  
  
  
  
  
  
  
  
  

