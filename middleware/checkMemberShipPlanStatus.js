const Membership = require("../models/membership.model");
const mongoose = require('mongoose');

const checkSellerMemberShipPlanStatus = async (req, res, next) => {
    var id = req.params.id;
    var seller_id = new mongoose.Types.ObjectId('65128513380eacbe23fda805');
    try {        
        Membership.findOne({seller_id: seller_id},{status: 'active'})
          .then((result) => {
             // console.log("result",result)
            if(result){
             // console.log("inside this");  
              next();
            } else {
                res.send({
                    status: false,
                    message: "Please purchase memembership plan to access this feature",
                }); 
            }            
          })
          .catch((error) => {
            res.send({
              status: false,
              message: error.toString() ?? "Error",
            });
          });
    } catch (error) {
        console.log("error",error);
        res.status(500).send({
          status: false,
          message: "failure",
          error: error ?? "Internal Server Error",
        });
    }
};

module.exports = { checkSellerMemberShipPlanStatus };
