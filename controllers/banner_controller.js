const BannerModel = require("../models/banner.model");
const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const fs = require('fs');
const path = require('path');

exports.create_banner = (req, res, next) => {
  try {
    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const event_id = req.body.event_id !== undefined && req.body.event_id !== null ? req.body.event_id.toString().trim() : null;
    const images = req.files.map(file => file.filename);

    // Get the protocol (http or https)
    const protocol = req.protocol;

    // Get the host (domain and port)
    const host = req.get('host');

    // Combine protocol, host, and any other parts of the base URL you need
    const baseURL = `${protocol}://${host}`;

    const eventData = {
      seller_id: new ObjectId(seller_id),
      images,
      event_id:new ObjectId(event_id),    
    };

    const bannerModel = new BannerModel(eventData);

    bannerModel
      .save()
      .then((result) => {
        if (result) {
          // Create an array of image URLs by concatenating the base URL and each filename
          const imageUrls = result.images.map(filename => baseURL + '/uploads/banners/' + filename);

          res.status(201).send({
            status: true,
            message: 'Success',
            data: {
              ...result.toObject(),
              images: imageUrls,
            },
          });
        } else {
          res.status(404).send({ status: false, message: 'Not created' });
        }
      })
      .catch((error) => {
        res.send({
          status: false,
          message: error.toString() || 'Error',
        });
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      status: false,
      message: 'Failure',
      error: error || 'Internal Server Error',
    });
  }
};



exports.get_all_banners = async (req, res) => {
    const seller_id = req.query.seller_id;
        // Get the protocol (http or https)
        const protocol = req.protocol;

        // Get the host (domain and port)
        const host = req.get('host');
    
        // Combine protocol, host, and any other parts of the base URL you need
        const baseURL = `${protocol}://${host}`;

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
                var filename = banner.image;
                const imageUrls = banner.images.map(filename => baseURL + '/uploads/banners/' + filename);
                const response = {
                  _id: banner._id,
                  seller_id: banner.seller_id,
                  event_id: banner.event_id,
                  images: imageUrls,
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
          console.error("Error:", error);
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
      res.status(400).send({ status: false, message: "Banner ID missing", data: null });
    } else {
      try {
        const banner = await BannerModel.findById(banner_id);
  
        if (banner) {
          const baseURL = `${req.protocol}://${req.get('host')}`;
          const imageUrls = banner.images.map(filename => baseURL + '/uploads/banners/' + filename);
  
          const bannerData = {
            _id: banner._id,
            seller_id: banner.seller_id,
            event_id: banner.event_id,
            images: imageUrls,
            createdAt: banner.createdAt,
            updatedAt: banner.updatedAt,
          };
  
          res.status(200).send({
            status: true,
            message: "Data found",
            data: bannerData,
          });
        } else {
          res.status(404).send({ status: false, message: "Banner not found", data: null });
        }
      } catch (error) {
        console.error("Error:", error);
        res.status(500).send({
          status: false,
          message: error.toString() || "Internal Server Error",
          data: null
        });
      }
    }
  };
  
  

  exports.update_banner = async (req, res, next) => {
    try {
      // Trim values to remove extra spaces
      const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
      const event_id = req.body.event_id !== undefined && req.body.event_id !== null ? req.body.event_id.toString().trim() : null;
      const images = req.files.map(file => file.filename);
      const banner_id = req.body.banner_id.trim();
      const baseURL = `${req.protocol}://${req.get('host')}`;
  
      var bannerData = {
        seller_id: new ObjectId(seller_id),
        event_id: new ObjectId(event_id),
      };
      console.log("images",images)
      // Check if the images array is not empty
      if (images.length > 0) {
        bannerData.images = images;  // Assuming the field name is 'images' in your BannerModel
      }
  
      const updatedBanner = await BannerModel.findByIdAndUpdate(
        banner_id,
        bannerData,
        { new: true }
      );
  
      if (updatedBanner) {
        // Create an array of image URLs by concatenating the base URL and each filename
        const imageUrls = updatedBanner.images.map(filename => baseURL + '/uploads/banners/' + filename);

        res.status(201).send({
          status: true,
          message: 'Success',
          data: {
            ...updatedBanner.toObject(),
            images: imageUrls,
          },
        });
      } else {
        res.status(404).send({ status: false, message: "Banner not found", data: null });
      }
  
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send({
        status: false,
        message: 'Failure',
        error: error.toString() || 'Internal Server Error',
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
  
      // Delete associated images from the folder
      if (banner.images && banner.images.length > 0) {
        const baseURL = `${req.protocol}://${req.get('host')}`;
        const imagePath = path.join(__dirname, '../uploads/banners'); // Adjust the path accordingly
  
        banner.images.forEach(filename => {
          const filePath = path.join(imagePath, filename);
          fs.unlinkSync(filePath); // Synchronously delete the file
        });
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



