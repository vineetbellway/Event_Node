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
              res.status(404).send({ status: false, message: "Not created",data: null });
          }
          })
          .catch((error) => {
            console.log("error",error)
            res.send({
                status: false,
                message: error.toString() ?? "Error",
                data:null
            });
        });

    } catch (error) {
        console.log("error", error);
        res.status(500).send({
            status: false,
            message: error.toString() ?? "Internal Server Error",
            data:null
        });
    }
    
};

const get_seller_upi_id = async (req, res) => {
    const seller_id = req.query.seller_id;
    console.log("seller_id",seller_id)
    if (!seller_id) {
        res.status(400).send({ status: false, message: "seller_id missing",data:null });
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
                if (result.length > 0) {
                  res.status(200).send({
                    status: true,
                    message: "Data found",
                    data: result[0],
                  });
                } else {
                  res.status(404).send({
                    status: true,
                    message: "No data found",
                    data: result,
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
            console.log("error",error)
            res.status(500).send({
              status: false,
              message: error.toString() ?? "Internal Server Error",
              data:null
            });
          }
    }
};

const update_seller_upi_id = async (req, res) => {
  const seller_upi_id = req.body.seller_upi_id;

  try {
    UPI.findByIdAndUpdate({_id:seller_upi_id}, req.body, { new: true })
      .then((result) => {
        if (result) {
          res.status(201).send({
            status: true,
            message: "Updated",
            data: result,
          });
        } else {
          res.status(404).send({ status: false, message: "Not updated",data:null });
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
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Error",
      data:null
    });
  }
};

module.exports = {
    create_seller_upi_id,
    get_seller_upi_id,
    update_seller_upi_id
};
