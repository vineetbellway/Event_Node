const Membership = require("../models/membership.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const moment = require("moment");
var nodemailer = require('nodemailer');
const Seller = require("../models/seller.model");
const User = require("../models/user.model");

const EventModel = require("../models/event.model");
const SubscriptionPlan = require("../models/subscription_plan.model");

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
      return;
  }

  try {
      // Fetch membership data
      const result = await Membership.aggregate([
          { $match: { seller_id: new mongoose.Types.ObjectId(seller_id) } },
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
                  "plan_name": { "$arrayElemAt": ["$plan_data.name", 0] },
                  "event_venue_by_google_location": { "$arrayElemAt": ["$plan_data.event_venue_by_google_location", 0] },
                  "private_events": { "$arrayElemAt": ["$plan_data.private_events", 0] },
                  "event_banner_publishing": { "$arrayElemAt": ["$plan_data.event_banner_publishing", 0] },
                  "birthday_banner_publishing": { "$arrayElemAt": ["$plan_data.birthday_banner_publishing", 0] },
                  "wedding_anniversary_banner_publishing": { "$arrayElemAt": ["$plan_data.wedding_anniversary_banner_publishing", 0] },
                  "razor_pay_account_creation": { "$arrayElemAt": ["$plan_data.razor_pay_account_creation", 0] },
                  "item_sales_report": { "$arrayElemAt": ["$plan_data.item_sales_report", 0] },
                  "fns_moving_report": { "$arrayElemAt": ["$plan_data.fns_moving_report", 0] },
                  "guest_potential_report": { "$arrayElemAt": ["$plan_data.guest_potential_report", 0] },
                  "repeated_guest_report": { "$arrayElemAt": ["$plan_data.repeated_guest_report", 0] },
                  "profit_loss_and_cover_report": { "$arrayElemAt": ["$plan_data.profit_loss_and_cover_report", 0] },
                  "loyaltiy_card_report": { "$arrayElemAt": ["$plan_data.loyaltiy_card_report", 0] },
                  "feedback_reply_by_guest": { "$arrayElemAt": ["$plan_data.feedback_reply_by_guest", 0] },
                  "event_limit": { "$arrayElemAt": ["$plan_data.event_limit", 0] },
                  "days": { "$arrayElemAt": ["$plan_data.days", 0] },
              }
          },
          { $sort: { "createdAt": -1 } },
          { $limit: 1 }
      ]);

      if (result.length > 0) {
          // Process membership data

          var seller_id = result[0].seller_id;
          var sellerRecord = await Seller.findById(seller_id);
          var user_id = sellerRecord.user_id;

          const sellerEvents = await EventModel.find({ seller_id: user_id });
          var sellerEventLength = sellerEvents.length;
          var eventLimit = result[0].event_limit;

          // Check if event limit is unlimited
          if (eventLimit === "unlimited") {
              var endDate = result[0].end_date;
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
              const currentDateTimeFormatted = `${year}-${month}-${day}`;
              var todayDateTime = new Date(currentDateTimeFormatted);

              var plan_days = result[0].days;
              var plan_amount = result[0].amount;

              console.log("plan_days",plan_days)

              // Define the dates as ISO strings
              const createdAt = result[0].createdAt;
              const planTakenDate = new Date(createdAt);

          //    var todayDateTime = new Date("2024-06-01T00:00:00.000Z");

              var oneDayAmount = Math.round(plan_amount/plan_days);
              // Check if today is the first day of the month
              const  dayOfMonth = todayDateTime.getDate() >= 1;

              console.log("dayOfMonth",dayOfMonth)

              console.log("oneDayAmount",oneDayAmount);

              // Create Date objects

                  console.log("plan taken date",planTakenDate);

                  // Calculate the difference in milliseconds
                  const diffInMilliseconds = todayDateTime - planTakenDate;

                  // Convert milliseconds to days
                  const millisecondsInADay = 24 * 60 * 60 * 1000;
                  var diffInDays = Math.round(diffInMilliseconds / millisecondsInADay);

                  console.log("used days before",diffInDays)
                  if (dayOfMonth) {
                    var todayDateTimeYear = todayDateTime.getFullYear();
                    var todayDateTimeMonth = ('0' + (todayDateTime.getMonth() + 1)).slice(-2);
                    const todayDateTimeDay = ('0' + todayDateTime.getDate()).slice(-2);
                    console.log("todayDateTimeMonth",todayDateTimeMonth);
                    console.log("todayDateTimeYear",todayDateTimeYear);
                    console.log("todayDateTimeDay",todayDateTimeDay);
                    var totalDaysInMOnth = new Date(todayDateTimeYear, todayDateTimeMonth, 0).getDate();
                    var endDateOfMonth = `${todayDateTimeYear}-${todayDateTimeMonth}-${totalDaysInMOnth}`;
                    var endDateOfMonth = new Date(endDateOfMonth);  
                     console.log("endDateOfMonth",endDateOfMonth);
                     console.log("todayDateTime",todayDateTime);


                    // Calculate the difference in milliseconds
                  const differenceInTime = endDateOfMonth.getTime() - todayDateTime.getTime();

                  // Convert the difference from milliseconds to days
                  const differenceInDays = differenceInTime / (1000 * 3600 * 24);

                    console.log("differenceInDays",differenceInDays);


                    diffInDays = diffInDays + differenceInDays - 1; 
                  }
              
                  console.log("used days after",diffInDays);
                  var used_amount =  (oneDayAmount)*diffInDays;
                  console.log("plan_amount",plan_amount);
                  console.log("used_amount",used_amount);
                  var  remaining_amount = plan_amount - used_amount;
                  if(plan_days == "180"){
                    result[0].remaining_amount = remaining_amount;
                  } else {
                    result[0].remaining_amount = 0;
                  }
                  
              if (todayDateTime >= eDateTime) {
                  result[0].status = "denied";
              }
          } else if (eventLimit !== "unlimited" && sellerEventLength >= eventLimit) {
              const endDate = new Date(result[0].end_date);
              const currentDate = new Date();
              result[0].remaining_amount = 0;

              if (currentDate >= endDate || result[0].is_event_created_after_renew_plan > '0') {
                  result[0].status = "denied";
              }
          }

          // Find highest plan name
          var highestPlanData = '';
          const sellerPlanData = await Membership.aggregate([
              { $match: { seller_id: seller_id } },
              { $sort: { createdAt: -1 } },
              {
                  $lookup: {
                      from: 'subscriptionplans',
                      localField: 'plan_id',
                      foreignField: '_id',
                      as: 'subscription_plan'
                  }
              }
          ]);

          var currentPlanDay = result[0].days;
          sellerPlanData.forEach((plan) => {
              if (currentPlanDay <= plan.subscription_plan[0].days) {
                highestPlanData = plan.subscription_plan[0];
              }
          });



         // result[0].highest_plan_name = highestPlanName;
          // Return data with highest plan name
          res.status(200).send({
              status: true,
              message: "success",
              data: {
                current_plan_data: result[0],
                highest_plan_data: highestPlanData
            },
          });
      } else {
          res.status(200).send({
              status: false,
              message: "No data found",
              data: null,
          });
      }
  } catch (error) {
    console.log('error',error)
      res.status(500).send({
          status: false,
          message: error.toString() ?? "Internal Server Error",
      });
  }
};

