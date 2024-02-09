const Guest = require("../models/guest.model");
const Event = require("../models/event.model");

const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");

exports.create_guest = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      Guest(req.body)
        .save()
        .then((result) => {
          if (result) {
            res
              .status(201)
              .send({ status: true, message: "success", data: result });
          } else {
            res.status(404).send({ status: false, message: "Not created" });
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

exports.get_guests = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const myCustomLabels = {
    totalDocs: "totalDocs",
    docs: "data",
    limit: "limit",
    page: "page",
    nextPage: "nextPage",
    prevPage: "prevPage",
    totalPages: "totalPages",
    pagingCounter: "slNo",
    meta: "paginator",
  };

  const options = {
    page: page,
    limit: limit,
    customLabels: myCustomLabels,
  };
  try {
    var myAggregate = Guest.aggregate([
      {
        $match: {
          status: baseStatus.active,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
    ]);
    await Guest.aggregatePaginate(myAggregate, options)
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
};

exports.get_guest = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Guest.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
      ])
        .then((result) => {
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
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};

exports.get_guest_by_user_id = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Guest.aggregate([
        {
          $match: {
            user_id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
      ])
        .then((result) => {
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
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};

exports.delete_guest = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Guest.findByIdAndDelete(id)
        .then((result) => {
          if (result) {
            res.status(201).send({
              status: true,
              message: "Deleted",
              data: result,
            });
          } else {
            res.status(404).send({ status: false, message: "Not deleted" });
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

exports.delete_guests = (req, res, next) => {
  try {
    Guest.deleteMany()
      .then((result) => {
        if (result) {
          res.status(201).send({
            status: true,
            message: "Deleted",
            data: result,
          });
        } else {
          res.status(404).send({ status: false, message: "Not deleted" });
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

exports.update_guest = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Guest.findByIdAndUpdate(id, req.body, { new: true })
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




// Controller function to get active events for a specific city based on the provided guest_id
exports.get_active_city_events = async (req, res) => {
  // Extract guest_id from the request query parameters
  var guest_id = req.query.guest_id;

  // Check if guest_id is missing
  if (!guest_id) {
    res.status(400).send({ status: false, message: "guest_id missing" });
  } else {
    try {
      // Find the guest based on the user_id
      const guest = await Guest.findOne({ user_id: guest_id });

      // If guest is not found, throw an error
      if (!guest) {
        throw new Error("Guest not found");
      }

      // Get the district of the guest
      const guestDistrict = guest.district;

      // Use aggregate to filter active events in the guest's city
      await Event.aggregate([
        {
          $match: {
            status: "active",
            city: guestDistrict,
            type: { $ne: "loyalty" } // Exclude documents where type is "loyalty"
          },
        },
      ])
        .then((result) => {
          if (result.length > 0) {
            // Build the base URL using the request protocol and host
            const baseURL = `${req.protocol}://${req.get('host')}`;

            // Update image URLs for each event in the data array
            const events = result.map(event => {
              const eventImageUrl = baseURL + '/uploads/events/' + event.image;
              return {
                ...event,
                image: eventImageUrl,
              };
            });

            // Remove undefined values from the events array
            const filteredEvents = events.filter(event => event);

            if (filteredEvents.length > 0) {
              // Send successful response with the filtered events
              res.status(200).send({
                status: true,
                message: "success",
                data: filteredEvents,
              });
            } else {
              // Send response indicating no active events found
              res.status(200).send({
                status: false,
                message: "No events found",
                data: [],
              });
            }
          } else {
            // Send response indicating no events found
            res.status(200).send({
              status: false,
              message: "No events found",
              data: result,
            });
          }
        })
        .catch((error) => {
          // Send response in case of an error during aggregation
          res.send({
            status: false,
            message: error.toString() ?? "Error",
          });
        });
    } catch (error) {
      // Send response in case of an error during guest retrieval or other operations
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};


