const Booking = require("../models/booking.model");
const mongoose = require("mongoose");
const { baseStatus } = require("../utils/enumerator");

// It will book event by guest

exports.book = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
        Booking(req.body)
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