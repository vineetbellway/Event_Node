const Facility = require("../models/facility.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const EventModel = require("../models/event.model");

exports.add_facility = (req, res, next) => {
  if (!req.body) {
    return res.status(400).send({
      status: false,
      message: "Body missing",
    });
  }

  try {
    EventModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(req.body[0].event_id),
        },
      },
    ])
      .then((result) => {
        if (result && result.length > 0) {
          const start_time = new Date(result[0].start_time);
          const end_time = new Date(result[0].end_time);
          var durationInDays = (end_time - start_time) / (1000 * 60 * 60 * 24); // Duration in days
          durationInDays =  Math.floor(durationInDays);
          durationInDays = parseInt(durationInDays);
          const promises = [];

          for (const facilities of req.body) {
            const facilityData = {
              event_id: req.body[0].event_id,
              name: facilities.name,
              duration: durationInDays,
              amount: facilities.amount,
              status: facilities.status,
            };

            const newFacility = new Facility(facilityData);

            const savePromise = newFacility.save();

            promises.push(savePromise);
          }

          Promise.all(promises)
            .then((results) => {
              const successResults = results.filter((result) => result);
              if (successResults.length > 0) {
                res.status(201).send({ status: true, message: "facility created successfully", data: successResults });
              } else {
                res.status(404).send({ status: false, message: "Not created" });
              }
            })
            .catch((error) => {
              console.log("error", error);
              res.status(500).send({
                status: false,
                message: error.toString() || "Internal Server Error",
              });
            });
        } else {
          res.status(404).send({ status: false, message: "Event not found" });
        }
      })
      .catch((error) => {
        console.log("error", error);
        res.status(500).send({
          status: false,
          message: error.toString() || "Internal Server Error",
        });
      });
  } catch (error) {
    console.log("error", error);
    res.status(500).send({
      status: false,
      message: "Failure",
      error: error.toString() || "Internal Server Error",
    });
  }
};

exports.update_facility = (req, res, next) => {
  const event_id = req.body.event_id;
  if (!event_id) {
    res.status(400).send({ status: false, message: "event id missing" });
  } else {
    try {
      Facility.findByIdAndUpdate({event_id:event_id}, req.body, { new: true })
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
  }
};


exports.get_facilities = async (req, res) => {
  var event_id = req.body.event_id;
  if (!event_id) {
    res.status(400).send({ status: false, message: "event id missing" });
  } else {
    try {
      await Facility.aggregate([
        {
          $match: {
            event_id: new mongoose.Types.ObjectId(event_id),
          },
        },
      ])
        .then((result) => {
          if (result) {
            res.status(200).send({
              status: true,
              message: "success",
              data: result,
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
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};