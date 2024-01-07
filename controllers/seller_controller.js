const Seller = require("../models/seller.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const Booking = require("../models/booking.model");
const Event = require("../models/event.model"); // Import the Event model
const Guest = require("../models/guest.model");


exports.create_seller = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      Seller(req.body)
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

exports.get_sellers = async (req, res) => {
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
    var myAggregate = Seller.aggregate([
      {
        $match: {
          status: baseStatus.pending,
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
    await Seller.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result) {
          res.status(200).send({
            status: true,
            message: "success",
            result,
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

exports.get_seller = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Seller.aggregate([
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

exports.get_seller_by_user_id = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Seller.aggregate([
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

exports.delete_seller = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Seller.findOneAndDelete(id)
        .then((result) => {
          if (result) {
            res.status(200).send({
              status: true,
              message: "deleted",
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

exports.delete_sellers = async (req, res) => {
  try {
    await Seller.deleteMany()
      .then((result) => {
        if (result) {
          res.status(200).send({
            status: true,
            message: "deleted",
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

exports.update_seller = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Seller.findByIdAndUpdate(id, req.body, { new: true })
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

exports.get_event_participating_guests = async (req, res) => {
  // Extract seller_id and search_key from the request parameters
  const seller_id = req.query.seller_id;
  const search_key = req.query.search_key;

  try {
    // Find events organized by the specified seller
    const events = await Event.find({ seller_id: seller_id });

    if (!events || events.length === 0) {
      // Send response if no events are found for the specified seller
      res.status(200).send({
        status: false,
        message: "No events found for the specified seller",
        data: [],
      });
      return;
    }

    // Extract event_ids from the found events
    const eventIds = events.map(event => event._id);

    // Find bookings for the extracted event_ids
    const bookings = await Booking.find({ event_id: { $in: eventIds } });

    if (bookings.length === 0) {
      // Send response if no bookings are found for the specified events
      res.status(200).send({
        status: false,
        message: "No bookings found for the specified events",
        data: [],
      });
      return;
    }

    // Define the regex pattern for the search_key
    const sanitizedSearchKey = search_key.trim();

    // Define the filter for guest search
    const guestFilter = {
      $or: [
        { full_name: { $regex: new RegExp(sanitizedSearchKey, 'i') } },
        { "user_data.code_phone": { $regex: new RegExp(sanitizedSearchKey, 'i') } },
        {
          "user_data.code_phone": {
            $regex: new RegExp(`^(\\+${sanitizedSearchKey}|0?${sanitizedSearchKey})$`, 'i'),
          },
        },
      ],
    };

    // Extract guest_ids from the found bookings based on the search filter
    const participatingGuestIds = bookings.map(booking => booking.guest_id);


    // Use $lookup to fetch user_data for the participating guests
    const participatingGuests = await Guest.aggregate([

      { $match: { user_id: { $in: participatingGuestIds } } },

      {
        $lookup: {
          from: 'users', 
          localField: 'user_id',
          foreignField: '_id',
          as: 'user_data',
        },
      },
     
     
      { $unwind: '$user_data' }, // Unwind the array created by $lookup
      { $match: guestFilter }, // Apply the original guest filter
    ])
    .then((result) => {
      if (result.length > 0) {
        const guest_data = result
        .map((guest) => ({

         
          _id: guest._id,
          user_id: guest.user_id,
          full_name: (guest.full_name) ?? '',
          district: guest.district,
          phone: (guest.user_data.code_phone) ?? '',
          state: guest.state,
          country: guest.country,
          status: guest.status,
          points: guest.points,
          createdAt: guest.createdAt,
          updatedAt: guest.updatedAt,
          __v: guest.__v,
        }));
        if (guest_data.length > 0) {
          res.status(200).send({
            status: true,
            message: "Data found",
            data: guest_data,
          });
        } else {
          res.status(200).send({
            status: false,
            message: "No guests found",
            data: validator_data,
          });
        }
      } else {
        res.status(200).send({
          status: false,
          message: "No guests found",
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
    // Send response in case of an error during database operations
    console.log("error",error)

    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
    });
  }
};