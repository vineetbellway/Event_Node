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
    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const description = req.body.description !== undefined && req.body.description !== null ? req.body.description.toString().trim() : null;
    const image = req.file ? req.file.filename : undefined;
    const banner_type = req.body.banner_type;
    const date = req.body.date !== undefined && req.body.date !== null ? req.body.date.toString().trim() : null;

    let guest_ids = req.body.guest_ids || [];
    
    if (!Array.isArray(guest_ids)) {
      // If it's not an array, make it an array
      guest_ids = [guest_ids];
    }

    const banners = [];

    if (banner_type == "birthday" || banner_type == "anniversary") {
      if (!req.body.date || !guest_ids.length || !req.body.description) {
        return res.status(400).json({ status: false, message: "date, Guest IDs, description are required in the request body" });
      }
    }

    if (guest_ids.length > 0) {
      const bannerData = {
        seller_id: new mongoose.Types.ObjectId(seller_id),
        image,
        banner_type,
        date,
        description,
      };

      const bannerResult = await BannerModel(bannerData).save();
      const banner_id = bannerResult._id;

      for (const guest_id of guest_ids) {
        const guestBannerData = {
          banner_id: new mongoose.Types.ObjectId(banner_id),
          guest_id: new mongoose.Types.ObjectId(guest_id),
        };

        const user_data = await User.findById(guest_id);

        var fcm_token = user_data.fcm_token;       

        var guest_data = await GuestModel.findOne({'user_id':guest_id});
    
        var guest_name = guest_data.full_name;

        const notification = {
          title: banner_type + ' banner added',
          body: 'Hi,' + " " +guest_name + " " + description,
        };

        var data = {
          
        };

        sendPushNotification(fcm_token, notification, data)
        .then(() => {
          console.log('Push notification sent successfully.');
        })
        .catch((error) => {
          console.error('Error sending push notification:', error);
        });


        await GuestBannerModel(guestBannerData).save();
      }

      const bannerGuestData = await GuestBannerModel.find({ banner_id }); // Fetch guest banner data

      banners.push({
        ...bannerResult.toObject(),
        image: `${req.protocol}://${req.get('host')}/uploads/banners/${bannerResult.image}`,
        guest_banner_data: bannerGuestData,
      });
    } else {
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
    }

    res.status(201).send({
      status: true,
      message: 'Success',
      data: banners[0],
    });
  } catch (error) {
    console.error('Error:', error);
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
            guest_banner_data : await GuestBannerModel.find({ banner_id })
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
  
      // Trim values to remove extra spaces
      const banner_id = req.body.banner_id.trim();
      const image = req.file ? req.file.filename : undefined;
      var banner_type = req.body.banner_type;
  
       var bannerData = { 'banner_type' : banner_type};
      // Check if image is not undefined
        if (image !== undefined) {
          bannerData.image = image;
        }
  
      const updatedBanner = await BannerModel.findByIdAndUpdate(
        { _id: banner_id },
        bannerData,
        { new: true }
      );
       if (updatedBanner) {

          // Get the host (domain and port)
          const protocol = req.protocol;
          const host = req.get('host');

            // Combine protocol, host, and any other parts of the base URL you need
          const baseURL = `${protocol}://${host}`;
          const imageUrl = baseURL + '/uploads/banners/' + updatedBanner.image;

          res.status(201).send({
            status: true,
            message: 'Banner updated successfully',
            data: {
              ...updatedBanner.toObject(),
              image: imageUrl,
            },
          });
      } else {
        res.status(404).send({ status: false, message: "Banner not found", data:null });
      }
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send({
        status: false,
        message: 'Failure',
        error: error ?? 'Internal Server Error',
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
  
      if (banner_type == 'birthday') {
        filter = {
          $match: {
            $expr: {
              $eq: [
                { $dateToString: { format: "%Y-%m-%d", date: "$dob" } },
                date,
              ],
            },
            'guest_data.district': sellerDistrict, // Matching seller's district with guest's district
          },
        };
      } else {
        filter = {
          $match: {
            $expr: {
              $eq: [
                { $dateToString: { format: "%Y-%m-%d", date: "$dom" } },
                date,
              ],
            },
            'guest_data.district': sellerDistrict, // Matching seller's district with guest's district
          },
        };
      }
  
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
              $arrayElemAt: ['$guest_data', 0], // Get the first element of the 'guest_data' array
            },
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
  
  
  
  
  
  
  

