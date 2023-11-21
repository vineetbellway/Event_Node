const Notification = require("../models/notification.model");
const mongoose = require("mongoose");

const get_notifications = async (req, res) => {
    var user_id = req.query.user_id;
    var type = req.query.type;

    if (!user_id) {
      res.status(400).send({ status: false, message: "user_id missing" });
    } else {
      try {
        await Notification.aggregate([
          {
            $match: {
              to_user_id: new mongoose.Types.ObjectId(user_id),
              type : type
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
        console.log("error",error)
        res.status(500).send({
          status: false,
          message: error.toString() ?? "Internal Server Error",
        });
      }
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


module.exports = {
  get_notifications,
  get_unread_notifications_count
};
