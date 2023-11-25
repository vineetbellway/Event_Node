const BannerModel = require("../models/banner.model");
const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const { baseStatus, userStatus } = require("../utils/enumerator");

exports.create_banner = (req, res, next) => {
  try {
    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const redirect_url = req.body.redirect_url.trim();
    const image = req.file ? req.file.filename : undefined;
    console.log("ss",req.file)

    const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    

    // Validate the redirect URL using a regular expression
    const isValidRedirectUrl = urlRegex.test(redirect_url);

    if (!isValidRedirectUrl) {
      return res.status(400).send({
        status: false,
        message: 'Invalid redirect URL',
        data: null,
      });
    }


    const eventData = {
      seller_id: new ObjectId(seller_id),
      image,
      redirect_url

    };

    BannerModel(eventData)
      .save()
      .then((result) => {
        if (result) {
          res.status(201).send({ status: true, message: 'Success', data: result });
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
                const response = {
                  _id: banner._id,
                  seller_id: banner.seller_id,
                  image: "uplods/banners/"+banner.image,
                  redirect_url: banner.redirect_url,
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
          res.status(200).send({
            status: true,
            message: "Data found",
            data: result,
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
      const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
      const redirect_url = req.body.redirect_url.trim();
      const image = req.file ? req.file.filename : undefined;
      const banner_id = req.body.banner_id.trim();
      console.log("ss",req.file);

      const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/;
    

    // Validate the redirect URL using a regular expression
    const isValidRedirectUrl = urlRegex.test(redirect_url);

    if (!isValidRedirectUrl) {
      return res.status(400).send({
        status: false,
        message: 'Invalid redirect URL',
        data: null,
      });
    }
     // return false;
      var bannerData = {
          seller_id: new ObjectId(seller_id),          
          redirect_url:redirect_url,        
      };
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
        res.status(200).send({
          status: true,
          message: "Banner updated successfully",
          data: updatedBanner,
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
      return res.status(400).send({ status: false, message: "banner ID missing",data:null });
    }
  
    try {
      const result = await BannerModel.findByIdAndDelete(banner_id);
  
      if (result) {
        return res.status(200).send({ status: true, message: "Banner deleted",data:null }); 
      } else {
        return res.status(404).send({ status: false, message: "Banner not found", data:null });
      }
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
        data:null
        
      });
    }
  };



