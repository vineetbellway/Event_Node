const ValidatorEvent = require("../models/validator_event.model");
const EventValidator = require("../models/event_validator.model");
const Validator = require("../models/validator.model");
const SellerModel = require("../models/seller.model");
const EventModel = require("../models/event.model");
const User = require("../models/user.model");
const { addNotification } = require('../helpers/notification_helper');
const { sendPushNotification } = require('../config/firebase.config'); // Update with the correct path to your module.
const mongoose = require("mongoose");
const moment = require("moment");
const { baseStatus, userStatus } = require("../utils/enumerator");

exports.create_validator_event = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      ValidatorEvent(req.body)
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

exports.get_validator_events = async (req, res) => {
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
    var myAggregate = ValidatorEvent.aggregate([
      {
        $match: {
          status: baseStatus.active,
        },
      },
      {
        $lookup: {
          from: "validators",
          localField: "validator_id",
          foreignField: "_id",
          as: "validator",
        },
      },
      {
        $unwind: "$validator",
      },
      {
        $lookup: {
          from: "events",
          localField: "event_id",
          foreignField: "_id",
          as: "event",
        },
      },
      {
        $unwind: "$event",
      },
    ]);
    await ValidatorEvent.aggregatePaginate(myAggregate, options)
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

exports.get_validator_event = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await ValidatorEvent.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "validators",
            localField: "validator_id",
            foreignField: "_id",
            as: "validator",
          },
        },
        {
          $unwind: "$validator",
        },
        {
          $lookup: {
            from: "events",
            localField: "event_id",
            foreignField: "_id",
            as: "event",
          },
        },
        {
          $unwind: "$event",
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

exports.delete_validator_event = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await ValidatorEvent.findByIdAndDelete(id)
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

exports.delete_validator_events = async (req, res) => {
  try {
    await ValidatorEvent.deleteMany()
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

exports.update_validator_event = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      ValidatorEvent.findByIdAndUpdate(id, req.body, { new: true })
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


exports.manage_validator_event_status = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      ValidatorEvent.findByIdAndUpdate(id,{"status": req.body.status}, { new: true })
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

exports.add_event_validator = async(req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {

     // Check if a validator with the same role already exists in same event
     const existingRoleInEventValidator = await EventValidator.findOne({ role: req.body.role , validator_id: req.body.validator_id , event_id: req.body.event_id });

     if (existingRoleInEventValidator) {
       // Category with the same name already exists
       return res.status(409).send({
         status: false,
         message: "Validator with same role is already added to event",
         data:null
       });
     }


      EventValidator(req.body)
        .save()
        .then((result) => {
          if (result) {
            res
              .status(201)
              .send({ status: true, message: "Validator is succesfully added to event", data: result });
          } else {
            res.status(404).send({ status: false, message: "Not created",data:null });
          }
        })
        .catch((error) => {
          res.send({
            status: false,
            message: error.toString() ?? "Error",
            data:null
          });
        });
    } catch (error) {
      console.log("error",error)
      res.status(500).send({
        status: false,
        message: error ?? "Internal Server Error",
        data:null
      });
    }
  }
};




exports.get_event_validators_list = async (req, res) => {
  const seller_id = req.query.seller_id;
  const event_id = req.query.event_id;

  try {
    var seller = await User.findById(seller_id);
    if (!seller) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }    
    var sellerData = await SellerModel.findOne({ user_id: seller_id });
    



    const event = await EventModel.findById(event_id);
    if (!event) {
      return res.status(404).send({
        status: false,
        message: "Event not found",
        data: null,
      });
    } 


    var current_date_time = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    var event_end_time = moment(event.end_time).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    var seller_district = sellerData.district;

    const event_validators = await User.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $lookup: {
          from: "eventvalidators",
          localField: "_id",
          foreignField: "validator_id",
          as: "validator_event_data",
        },
      },
      {
        $lookup: {
          from: "validators", // Assuming the name of your "validator" model
          localField: "_id", // The field in the "User" model
          foreignField: "user_id", // The corresponding field in the "validator" model
          as: "validator_data",
        },
      },
      {
        $addFields: {
          type: {
            $ifNull: [{ $arrayElemAt: ["$validator_event_data.type", 0] }, 'validator'],
          },
          validator_data: { $arrayElemAt: ["$validator_data", 0] },
        },
      },
      {
        $match: {
          "validator_event_data": { $ne: [] } // Filter out documents where validator_event_data is an empty array
        },
      },
    ]);
    
  


    if (event_validators && event_validators.length > 0) {
   
      const filtered_event_validator_data = event_validators
        .map((validator) => ({


         _id: validator.validator_data._id,
          user_id: validator.validator_data.user_id,
          full_name: validator.validator_data.full_name,
          district: validator.validator_data.district,
          state: validator.validator_data.state,
          country: validator.validator_data.country,
          status: validator.validator_data.status,
          createdAt: validator.validator_data.createdAt,
          updatedAt: validator.validator_data.updatedAt,
          __v: validator.validator_data.__v,
          validator_event_data: validator.validator_event_data.map((validatorEventData) => ({
            _id: validatorEventData._id,
            validator_id: validatorEventData.validator_id,
            seller_id: validatorEventData.seller_id,
            event_id: validatorEventData.event_id,
            role: validatorEventData.role,
            createdAt: validatorEventData.createdAt,
            updatedAt: validatorEventData.updatedAt,
            __v: validatorEventData.__v,
            validator_status : validatorEventData.status
          })),
        }));
          var all_validator_list = [];
    
        if (filtered_event_validator_data.length > 0) {    
          filtered_event_validator_data.forEach((val, k) => {

            if(seller_district == val.district){

             var validator_status =  val.validator_event_data[0].validator_status;

           //  validator_status =  (validator_status!="pending") ? validator_status+"ed" : '';
              if(validator_status == "pending"){
                all_validator_list.push({
                  _id: val._id,
                  user_id: val.user_id,
                  full_name: val.full_name,
                  district: val.district,
                  state: val.state,
                  country: val.country,
                  status: val.status,
                  createdAt: val.createdAt,
                  updatedAt: val.updatedAt,
                  __v: val.__v,
                  role : val.validator_event_data[0].role,
                  validator_status:validator_status
                });
              }

             

           }
          });
          if(all_validator_list.length >0){
            res.status(200).send({
              status: true,
              message: "Data found",
              data: all_validator_list,
            });
          } else {
            res.status(404).send({
              status: true,
              message: "No validators found",
              data: [],
            });
          }
          
        } else {
          res.status(404).send({
            status: true,
            message: "No validators found",
            data: filtered_event_validator_data,
          });
        }
    } else {
      res.status(404).send({
        status: true,
        message: "No validators found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};


exports.get_not_expired_event_validators_list = async (req, res) => {
  const seller_id = req.query.seller_id;
  const event_id = req.query.event_id;

  try {
    const seller = await SellerModel.findOne({ user_id: seller_id });
    if (!seller) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }    

    const event = await EventModel.findById(event_id);
    if (!event) {
      return res.status(404).send({
        status: false,
        message: "Event not found",
        data: null,
      });
    } 

  
    var current_date_time = moment().format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    var event_end_time = moment(event.end_time).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
    var event_status = event.status;

    if(event_status == "expiired"){
      return  res.status(404).send({
        status: true,
        message: "No validators found for the specified event id",
        data: [],
      });
    }

 


    var seller_district = seller.district;

    const event_validators = await Validator.aggregate([
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
      {
        $lookup: {
          from: "eventvalidators",
          localField: "validator_id",
          foreignField: "user_id",
          as: "validator_event_data",
        },
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          full_name: 1,
          district: 1,
          state: 1,
          country: 1,
          status: 1,
          createdAt: 1,
          updatedAt: 1,
          __v: 1,
          role: 1,
          validator_event_data: {
            $filter: {
              input: "$validator_event_data",
              as: "eventData",
              cond: {
                $eq: ["$$eventData.validator_id", "$_id"],
              },
            },
          },
        },
      },
    ]);

    if (event_validators && event_validators.length > 0) {
      const filtered_event_validator_data = event_validators
        .map((validator) => ({
          _id: validator._id,
          user_id: validator.user_id,
          full_name: validator.full_name,
          district: validator.district,
          state: validator.state,
          country: validator.country,
          status: validator.status,
          createdAt: validator.createdAt,
          updatedAt: validator.updatedAt,
          __v: validator.__v,
          validator_event_data: validator.validator_event_data.map((eventData) => ({
            _id: eventData._id,
            validator_id: eventData.validator_id,
            seller_id: eventData.seller_id,
            event_id: eventData.event_id,
            role: eventData.role,
            createdAt: eventData.createdAt,
            updatedAt: eventData.updatedAt,
            __v: eventData.__v,
          })),
        }))
        .filter((validator) => validator.validator_event_data.some((event) => event.event_id == event_id));
          var all_validator_list = [];
        if (filtered_event_validator_data.length > 0) {    
          var event_end_time = moment(event.end_time).format("YYYY-MM-DDTHH:mm:ss.SSSZ");

        
          filtered_event_validator_data.forEach((val, k) => {
            if(seller_district == val.district){

              var validator_event_create_date_time  = moment(val.validator_event_data[0].createdAt).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
              var is_validator_present_in_event = false;
    
              console.log('validator_event_create_date_time',validator_event_create_date_time)
    
              console.log('event_end_time',event_end_time)
    
              if(event_end_time > validator_event_create_date_time){
                is_validator_present_in_event = true;
              }
              all_validator_list.push({
                _id: val._id,
                user_id: val.user_id,
                full_name: val.full_name,
                district: val.district,
                state: val.state,
                country: val.country,
                status: val.status,
                createdAt: val.createdAt,
                updatedAt: val.updatedAt,
                __v: val.__v,
                role : val.validator_event_data[0].role,
                is_validator_present_in_event:is_validator_present_in_event
              });

            }
          });
          res.status(200).send({
            status: true,
            message: "Data found",
            data: all_validator_list,
          });
        } else {
          res.status(404).send({
            status: true,
            message: "No validators found for the specified event id",
            data: filtered_event_validator_data,
          });
        }
    } else {
      res.status(404).send({
        status: true,
        message: "No validators found",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.manage_event_validator_status = async (req, res) => {
  try {
    const { event_id, status, validator_id } = req.body;

    if (!event_id || !status || !validator_id) {
      return res.status(400).json({ status: false, message: "event id, validator id, and status are required in the request body" });
    }

    const result = await EventValidator.findOneAndUpdate(
      { event_id: event_id, validator_id: validator_id },
      { status: status },
      { new: true } // Returns the modified document
    );

    if (!result) {
      return res.status(404).json({ status: false, message: "Event validator not found" });
    }

  

    let updatedStatus = status;
    if (status == "accept") {
      updatedStatus = "accepted";
    } else {
      updatedStatus = "rejected";
    }

    const message = `Validator has ${updatedStatus} the event`;

    const seller_id = result.seller_id;
d;
    
    var sellerUserData = await User.findById(seller_id);
   
    var fcm_token = sellerUserData.fcm_token;


    // send notification to seller
    addNotification(validator_id, seller_id, "Event's validator " + updatedStatus, message);

    // send push notification to seller
    const notification = {
      title: 'Validator added',
      body: message,
    };
    const data = {
      // Additional data to send with the notification, if needed.
    };

    sendPushNotification(fcm_token, notification,data)
      .then(() => {
        console.log('Push notification sent successfully to seller.');
      })
      .catch((error) => {
        console.error('Error sending push notification to seller:', error);
      });

    res.status(200).json({
      status: true,
      message: message,
      data: result,
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};


exports.get_validator_events_list = async (req, res) => {
  const validator_id = req.query.validator_id;

  try {
    const validator = await User.findById(validator_id);

    if (!validator) {
      return res.status(404).send({
        status: false,
        message: "Validator not found",
        data: null,
      });
    }

    const validator_events = await EventValidator.find({ validator_id, status: { $ne: 'pending' } });


    if (validator_events && validator_events.length > 0) {
      const all_validator_events_list = await Promise.all(validator_events.map(async (validatorEventData) => {
        const eventDetails = await EventModel.findById(validatorEventData.event_id);
      
        return {
          
          
            _id: eventDetails._id,
            seller_id: eventDetails.seller_id,
            primary_number: eventDetails.primary_number,
            secondary_number: eventDetails.secondary_number,
            type: eventDetails.type,
            image: eventDetails.image,
            name: eventDetails.name,
            venue: eventDetails.venue,
            country: eventDetails.country,
            state: eventDetails.state,
            city: eventDetails.city,
            start_time: eventDetails.start_time,
            end_time: eventDetails.end_time,
            coupon_name: eventDetails.coupon_name,
            tax_name: eventDetails.tax_name,
            tax_percent: eventDetails.tax_percent,
            amount: eventDetails.amount,
            instructions: eventDetails.instructions,
            transportation_charge: eventDetails.transportation_charge,
            hire_charge: eventDetails.hire_charge,
            labour_charge: eventDetails.labour_charge,
            commision_charge: eventDetails.commision_charge,
            others: eventDetails.others,
            status: eventDetails.status,
            createdAt: eventDetails.createdAt,
            updatedAt: eventDetails.updatedAt,
            __v: eventDetails.__v,
            validator_status: validatorEventData.status+"ed" ,
          
        };
      }));

      if (all_validator_events_list.length > 0) {
        res.status(200).send({
          status: true,
          message: "Data found",
          data: all_validator_events_list,
        });
      } else {
        res.status(404).send({
          status: true,
          message: "No events found for the validator",
          data: [],
        });
      }
    } else {
      res.status(404).send({
        status: true,
        message: "No events found for the validator",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

