const UPI = require("../models/upi.model"); 
const mongoose = require("mongoose");

const create_seller_upi_id = async (req, res) => {

    try {
        UPI(req.body)
        .save()
        .then((result) => {
          if (result) {            
            res.status(201).send({ status: true, message: "success", data: result });
          } else {
              res.status(404).send({ status: false, message: "Not created" });
          }
          })
          .catch((error) => {
            console.log("error",error)
            res.send({
                status: false,
                message: error.toString() ?? "Error",
            });
        });

    } catch (error) {
        console.log("error", error);
        res.status(500).send({
            status: false,
            message: error.toString() ?? "Internal Server Error",
        });
    }
    
};

const get_seller_upi_id = async (req, res) => {
    const seller_id = req.query.seller_id;

    if (!seller_id) {
        res.status(400).send({ status: false, message: "seller_id missing" });
    } else {
        try {
            await UPI.aggregate([
              {
                $match: {
                    seller_id: new mongoose.Types.ObjectId(seller_id)
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "seller_id",
                  foreignField: "_id",
                  as: "user",
                },
              },
              {
                $unwind: "$user",
              },
            ])
              .then((result) => {
                console.log("result",result)
                if (result) {
                  res.status(200).send({
                    status: true,
                    message: "success",
                    data: result[0],
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
            console.log("error",error)
            res.status(500).send({
              status: false,
              message: error.toString() ?? "Internal Server Error",
            });
          }
    }
};

const update_seller_upi_id = async (req, res) => {
 
    const seller_id = req.body.seller_id;

        try {
            UPI.findByIdAndUpdate({seller_id:seller_id}, req.body)
        .then((result) => {
          if (result) {
            res.status(201).send({
              status: true,
              message: "Updated",
              data: result,
            });
          } else {
            res.status(404).send({ status: false, message: "Not updated" });
          }
        })
        .catch((error) => {
          res.send({
            status: false,
            message: error.toString() ?? "Error",
          });
        });
    } catch (error) {
      res.status(500).send({
        status: false,
        message: "failure",
        error: error ?? "Internal Server Error",
      });
    }
    
    
};

module.exports = {
    create_seller_upi_id,
    get_seller_upi_id,
    update_seller_upi_id
};
