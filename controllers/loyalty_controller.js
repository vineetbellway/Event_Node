const LoyalityOrderItem = require("../models/loyalty_order_item.model");
const mongoose = require("mongoose");
const { baseStatus } = require("../utils/enumerator");

// It will create loyality order item by seller

exports.create_loyalty_order_items = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      LoyalityOrderItem(req.body)
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
      res.status(500).send({
        status: false,
        message: "failure",
        error: error ?? "Internal Server Error",
      });
    }
  }
};


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


exports.get_guest_consumptions = async (req, res) => {
  var guest_id = req.body.guest_id;
  if (!guest_id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await LoyalityOrderItem.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
          },
        },
      ])
        .then((result) => {
          if (result && result.length > 0) {
            res.status(200).send({
              status: true,
              message: "success",
              data: result,
            });
          } else {
            res.status(404).send({
              status: false,
              message: "data not found",
              data: result[0],
            });
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
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};

exports.approve_guest_consumption = async (req, res) => {
  var guest_id = req.body.guest_id;
  if (!guest_id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      LoyalityOrderItem.findByIdAndUpdate({guest_id:guest_id},{status:baseStatus.active})
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
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};