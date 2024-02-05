const Membership = require("../models/membership.model");
const User = require("../models/user.model");
const Seller = require("../models/seller.model");

const mongoose = require('mongoose');
const { admin } = require("../config/firebase.config");


const checkSellerMemberShipPlanStatus = async (req, res, next) => {
  try {
      const token = req.header("Authorization").replace("Bearer", "").trim();
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log("decodedToken",decodedToken);

      var uid = decodedToken.uid;
      var phone_number = decodedToken.phone_number;
     
      
      const user_record = await User.findOne({ phone: phone_number , type : 'seller' });
      var user_id = user_record._id;
      var seller_record  = await Seller.findOne({ user_id : user_id});
      var seller_id = seller_record._id;
      
      // var seller_id = new mongoose.Types.ObjectId('65128513380eacbe23fda805');
      
      const result = await Membership.findOne({seller_id: new mongoose.Types.ObjectId(seller_id), status: 'active'});
      if(result){
          next();
      } else {
          return res.send({status: false,message: "Please purchase membership plan to access this feature"}); 
      }
  } catch (error) {
      console.log("error",error);
      return res.status(500).send({
          status: false,
          message: "failure",
          error: error.message || "Internal Server Error",
      });
  }
};


module.exports = { checkSellerMemberShipPlanStatus };
