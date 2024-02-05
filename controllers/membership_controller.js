const Membership = require("../models/membership.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const moment = require("moment");
var nodemailer = require('nodemailer');



exports.create_membership = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      Membership(req.body)
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

exports.get_memberships = async (req, res) => {
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
    var myAggregate = Membership.aggregate([
      {
        $match: {
          status: baseStatus.active,
        },
      },
    ]);
    await Membership.aggregatePaginate(myAggregate, options)
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

exports.get_membership = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Membership.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
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

exports.search_memberships = async (req, res) => {
  var keyword = req.params.keyword;
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
    let regex = new RegExp(keyword, "i");
    var myAggregate = Membership.aggregate([
      {
        $match: {
          $or: [{ name: regex }, { coupon_name: regex }],
        },
      },
    ]);
    await Membership.aggregatePaginate(myAggregate, options)
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

exports.delete_membership = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Membership.findByIdAndDelete(id)
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

exports.delete_memberships = async (req, res) => {
  try {
    await Membership.deleteMany()
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

exports.update_membership = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Membership.findByIdAndUpdate(id, req.body, { new: true })
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


exports.update_membership_plan_status = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Membership.findByIdAndUpdate(id,"active", { new: true })
        .then((result) => {
          if (result) {
            res.status(200).send({
              status: true,
              message: "Plan status updated successfully",
            });
          } else {
             res.status(404).send({ status: false, message: "Failed to update" });
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

exports.disableSellerServices= async () => {

  const currentDateTime = new Date();
  const year = currentDateTime.getFullYear();
  const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
  const day = ('0' + currentDateTime.getDate()).slice(-2);
  
  const currentDateFormatted = `${year}-${month}-${day}`;

  try {
 
    Membership.find({ status: 'active' })
      .then((result) => {
        if (result) {
          for (const membership of result) {
            const membershipEndDate = new Date(membership.end_date);
            const membershipEndDateFormatted = membershipEndDate.toISOString().split('T')[0]; // Extract date portion

            var membership_id = membership._id;
            if (membershipEndDateFormatted == currentDateFormatted) { // Compare date portion
              // Process further
              var membership_id = membership._id;
              var seller_id = membership.seller_id;



              const fcm_token = user_data.fcm_token;

              if (fcm_token) {
                const notification = {
                  title: title,
                  body: description,
                };

                // Sending push notification
                sendPushNotification(fcm_token, notification, {})
                  .then(() => {
                    console.log('Push notification sent successfully.');
                  })
                  .catch((error) => {
                    console.error('Error sending push notification:', error);
                  });
              }
       
           
              Membership.findByIdAndUpdate(membership_id, { 'status': 'blocked' })
                .then((result) => {
                  if (result) {
                    console.log("Status blocked successfully");
                  } else {
                    console.log("Failed to update");
                  }
                })
                .catch((error) => {
                  console.error(error.toString() || "Error");
                });
            }
           
            
          }
        } else {
          console.log("Data not found");
        }
      })
      .catch((error) => {
        console.error(error.toString() || "Error");
      });
  } catch (error) {
    console.error("Failure: " + (error || "Internal Server Error"));
  }
};

exports.get_membership_by_seller_id = async (req, res) => {
  var seller_id = req.params.id;
  if (!seller_id) {
      res.status(400).send({ status: false, message: "seller_id missing" });
  } else {
      try {
          await Membership.aggregate([
              {
                  $match: {
                      seller_id: new mongoose.Types.ObjectId(seller_id),
                  },
              },
              {
                  $lookup: {
                      from: 'subscriptionplans',
                      localField: 'plan_id',
                      foreignField: '_id',
                      as: 'plan_data',
                  },
              },
              {
                  $project: {
                      "_id": 1,
                      "seller_id": 1,
                      "plan_id": 1,
                      "amount": 1,
                      "txn": 1,
                      "end_date": 1,
                      "status": 1,
                      "createdAt": 1,
                      "updatedAt": 1,
                      "plan_name": { "$arrayElemAt": ["$plan_data.name", 0] } // Extracting plan_name from plan_data
                  }
              },
              {
                $sort: { "createdAt": -1 } // Sort by createdAt in descending order
            },
            {
                $limit: 1 // Limit to only the latest plan
            }

          ])
          .then((result) => {
              console.log("result",result)
              if (result.length > 0) {
                  res.status(200).send({
                      status: true,
                      message: "success",
                      data: result[0],
                  });
              } else {
                  res.status(200).send({
                      status: false,
                      message: "No data found",
                      data: null,
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

