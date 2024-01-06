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

// async function get_active_city_events (guest_id, page, limit) {
//   try {
//     const guest = await Guest.findById(guest_id);

//     if (!guest) {
//       throw new Error("Guest not found");
//     }

//     const guestDistrict = guest.district;

//     const pipeline = [
//       {
//         $match: {
//           status: "active",
//           district: guestDistrict,
//         },
//       },
//       {
//         $sort: { start_time: 1 }, // Sort by start time, ascending order
//       },
//     ];

//     const options = {
//       page: page,
//       limit: limit,
//     };

//     const aggregate = Event.aggregate(pipeline);
//     const result = await Event.aggregatePaginate(aggregate, options);

//     return result;
//   } catch (error) {
//     console.error("Error fetching guest active events:", error);
//     throw error;
//   }
// }

// const guest_id = req.params.guest_id;
// const page = req.params.page;
// const size = req.params.size;

// get_active_city_events(guest_id, page, size)
//   .then((events) => {
//     res.status(201).send({
//       status: true,
//       message: "Updated",
//       events: events,
//     });
//   })
//   .catch((err) => {
//     res.send({
//       status: false,
//       message: err.toString() ?? "Error",
//     });
//   });

exports.get_active_city_events = async (req, res) => {
  const guest_id = req.params.guest_id;
  const page = req.params.page || 1;
  const limit = req.params.limit || 10;
  const guest = await Guest.findById(guest_id);

  if (!guest) {
    throw new Error("Guest not found");
  }
  const guestDistrict = guest.district;
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Guest.aggregate([
        {
          $match: {
            status: "active",
            district: guestDistrict,
          },
        },
        {
          $sort: { start_time: 1 }, // Sort by start time, ascending order
        },
      ]);
      const options = {
        page: page,
        limit: limit,
      };

      const aggregate = Event.aggregate(pipeline);
      await Event.aggregatePaginate(aggregate, options)
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
