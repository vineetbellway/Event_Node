const LoyalityOrderItem = require("../models/loyalty_order_item.model");
const mongoose = require("mongoose");

exports.consume_loyalty_point = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
        var total_points = req.body.consumed;
        LoyalityOrderItem.findByIdAndUpdate(req.body.loyality_id, {'consumed':total_points})
        .then((result) => {
          if (result) {
            res
              .status(200)
              .send({ status: true, message: "success", data: result });
          } else {
            res.status(404).send({ status: false, message: "Not found" });
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
  }
};
