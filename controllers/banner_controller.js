const BannerModel = require("../models/banner.model");
const GuestModel = require("../models/guest.model");
const SellerModel = require("../models/seller.model");
const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const fs = require('fs');
const path = require('path');


exports.create_banner = (req, res, next) => {
  try {
    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const event_id  = req.body.event_id !== undefined && req.body.event_id !== null ? req.body.event_id.toString().trim() : null;
    const image = req.file ? req.file.filename : undefined;
    
    const eventData = {
      seller_id: new ObjectId(seller_id),
      event_id: new ObjectId(event_id),
      image,

    };

    BannerModel(eventData)
      .save()
      .then((result) => {
        if (result) {
             // Get the host (domain and port)
            const protocol = req.protocol;
            const host = req.get('host');

             // Combine protocol, host, and any other parts of the base URL you need
            const baseURL = `${protocol}://${host}`;
            const imageUrl = baseURL + '/uploads/banners/' + result.image;

           res.status(201).send({
             status: true,
             message: 'Success',
             data: {
               ...result.toObject(),
               image: imageUrl,
             },
           });
          
        } else {
          res.status(404).send({ status: false, message: 'Not created' });
        }
      })
      .catch((error) => {
        res.send({
          status: false,
          message: error.toString() ?? 'Error',
        });
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      status: false,
      message: 'Failure',
      error: error ?? 'Internal Server Error',
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
            console.log("result",result)
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
  
      // Trim values to remove extra spaces
      const banner_id = req.body.banner_id.trim();
      const image = req.file ? req.file.filename : undefined;
  
       var bannerData = {};
      // Check if image is not undefined
        if (image !== undefined) {
          bannerData.image = image;
        }
     
  
      console.log("bannerData",bannerData)
  
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

      const banners = await BannerModel.aggregate([
        {
          $sort: { createdAt: -1 }, // Sort by createdAt in descending order
        },
      ]);
  
      if (banners && banners.length > 0) {
        const banner_data = [];
  
        for (const banner of banners) {
          const seller = await SellerModel.findById(banner.seller_id);
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
  



