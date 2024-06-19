const Membership = require("../models/membership.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const moment = require("moment");
var nodemailer = require('nodemailer');
const Seller = require("../models/seller.model");
const User = require("../models/user.model");

const EventModel = require("../models/event.model");


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
      .then(async(result) => {
        if (result) {
          for (const membership of result) {
            const membershipEndDate = new Date(membership.end_date);
            const membershipEndDateFormatted = membershipEndDate.toISOString().split('T')[0]; // Extract date portion

            var membership_id = membership._id;
            if (membershipEndDateFormatted == currentDateFormatted) { // Compare date portion
              // Process further
              var membership_id = membership._id;
              var seller_id = membership.seller_id;
              var seller_record = await Seller.findById(seller_id);
              
              var  user_data = await User.findById(seller_record._id);



              const fcm_token = user_data.fcm_token;

              if (fcm_token) {
                const notification = {
                  title: "Membership expired",
                  body: "Your membership expired. Please purchase new plan to access app features",
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
                      "is_event_created_after_renew_plan": 1,
                      "plan_name": { "$arrayElemAt": ["$plan_data.name", 0] }, // Extracting plan_name from plan_data
                      "event_venue_by_google_location" : { "$arrayElemAt": ["$plan_data.event_venue_by_google_location", 0] },
                      "private_events" : { "$arrayElemAt": ["$plan_data.private_events", 0] },
                      "event_banner_publishing" : { "$arrayElemAt": ["$plan_data.event_banner_publishing", 0] },
                      "birthday_banner_publishing" : { "$arrayElemAt": ["$plan_data.birthday_banner_publishing", 0] },
                      "wedding_anniversary_banner_publishing" : { "$arrayElemAt": ["$plan_data.wedding_anniversary_banner_publishing", 0] },
                      "razor_pay_account_creation" : { "$arrayElemAt": ["$plan_data.razor_pay_account_creation", 0] },
                      "item_sales_report" : { "$arrayElemAt": ["$plan_data.item_sales_report", 0] },
                      "fns_moving_report" : { "$arrayElemAt": ["$plan_data.fns_moving_report", 0] },
                      "guest_potential_report" : { "$arrayElemAt": ["$plan_data.guest_potential_report", 0] },
                      "repeated_guest_report" : { "$arrayElemAt": ["$plan_data.repeated_guest_report", 0] },
                      "profit_loss_and_cover_report" : { "$arrayElemAt": ["$plan_data.profit_loss_and_cover_report", 0] },
                      "loyaltiy_card_report" : { "$arrayElemAt": ["$plan_data.loyaltiy_card_report", 0] },
                      "feedback_reply_by_guest" : { "$arrayElemAt": ["$plan_data.feedback_reply_by_guest", 0] },
                      "event_limit": { "$arrayElemAt": ["$plan_data.event_limit", 0] } 
                  }
              },
              {
                $sort: { "createdAt": -1 } // Sort by createdAt in descending order
            },
            {
                $limit: 1 // Limit to only the latest plan
            }

          ])
          .then(async(result) => {

              if (result.length > 0) {
                console.log("result",result);
                var seller_id = result[0].seller_id;
              //  console.log("seller_id",seller_id)
                var sellerRecord = await Seller.findById(seller_id);
              //  console.log("sellerRecord",sellerRecord.user_id)
                var user_id = sellerRecord.user_id;
             
              
              const sellerEvents = await EventModel.find({ seller_id: user_id });
              var sellerEventLength = sellerEvents.length; 
              var eventLimit = result[0].event_limit;
              console.log("eventLimit",eventLimit);


              if(eventLimit == "unlimited"){
               
                var endDate = result[0].end_date;

                console.log("endDate",endDate)




                const endDateTime = new Date(endDate);
                const endYear = endDateTime.getFullYear();
                const endMonth = ('0' + (endDateTime.getMonth() + 1)).slice(-2);
                const endDay = ('0' + endDateTime.getDate()).slice(-2);

                const endDateTimeFormatted = `${endYear}-${endMonth}-${endDay}`;
                
                const eDateTime = new Date(endDateTimeFormatted);




                const currentDateTime = new Date();
                const year = currentDateTime.getFullYear();
                const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
                const day = ('0' + currentDateTime.getDate()).slice(-2);
                const hours = ('0' + currentDateTime.getHours()).slice(-2);
                const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
                const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
                
                const currentDateTimeFormatted = `${year}-${month}-${day}`;
                
                const todayDateTime = new Date(currentDateTimeFormatted);

                console.log("todayDateTime",todayDateTime)

                console.log("eDateTime",eDateTime)

                

                if(todayDateTime >= eDateTime){
                  console.log("inside this")
                  result[0].status = "denied";
                }
            } else if (eventLimit !== "unlimited" && sellerEventLength >= eventLimit) {
              console.log("sellerEventLength",sellerEventLength)
              // Only set status to "denied" if event limit is exceeded and the end date has passed
              const endDate = new Date(result[0].end_date);
              const currentDate = new Date();
              console.log("currentDate",currentDate);
              console.log("endDate",endDate);

              if (currentDate >= endDate) {
                result[0].status = "denied";
              }

              console.log("is_event_created_after_renew_plan",result[0].is_event_created_after_renew_plan)

              if(result[0].is_event_created_after_renew_plan > '0'){
                result[0].status = "denied";
              }
              

          }
          var currentPlanCreatedAt = result[0].createdAt;
          console.log("currentPlanCreatedAt",currentPlanCreatedAt)

          // Query to find the previous plan data
          var previousPlanData = await Membership.aggregate([
            { 
                $match: {
                    seller_id: seller_id,
                    createdAt: { $lt: currentPlanCreatedAt }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $limit: 1
            },
            {
                $lookup: {
                    from: 'subscriptionplans', // collection name for Subscription model
                    localField: 'plan_id',
                    foreignField: '_id',
                    as: 'subscription_plan'
                }
            }
        ]);
        var previousPlanName =   (previousPlanData.length > 0) ? previousPlanData[0].subscription_plan[0].name : '';             
        result[0].previous_plan_name = previousPlanName;
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

