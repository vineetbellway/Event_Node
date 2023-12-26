const Notification = require("../models/notification.model");
const mongoose = require("mongoose");


const get_notifications = async (req, res) => {
  var user_id = req.query.user_id;
  var type = req.query.type;
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
    var myAggregate = Notification.aggregate([
      {
        $match: {
          "to_user_id": new mongoose.Types.ObjectId(user_id),
          "type": type,
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
    ]);

    await Notification.aggregatePaginate(myAggregate, options)
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




const get_unread_notifications_count = async (req, res) => {
    var user_id = req.query.user_id;

    if (!user_id) {
      res.status(400).send({ status: false, message: "user_id missing" });
    } else {
      try {
        await Notification.aggregate([
          {
            $match: {
              to_user_id: new mongoose.Types.ObjectId(user_id),
              is_read : 0,
              type : 'app'
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "to_user_id",
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
                data: result.length,
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

const read_all_notifications = async (req, res) => {
  var user_id = req.body.user_id;


  // validator id will be taken from token

  if (!user_id) {
    res.status(400).json({ status: false, message: "user id is required in the request body" });
  } else {
    try {
      Notification.updateMany(
        { to_user_id: user_id },
        { $set: { is_read: 1 } }
      )
      .then((result) => {
        if (result) {

          res.status(200).json({
            status: true,
            message: "Notification read successfully",
            data: result,
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Failed ! please try again",
            data: null,
          });
        }
      })
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  }
}; 



module.exports = {
  get_notifications,
  get_unread_notifications_count,
  read_all_notifications
};
