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
      data:null
    });
  } else {
    try {

      var eventRecord = await EventModel.findById(req.body.event_id);

      if(eventRecord){
        if(eventRecord.is_closed == "yes"){
         return  res.status(200).send({
           status: false,
           message: "Event is closed",
           data:null
         });
       }
      } else {
          return res.status(200).send({
           status: false,
           message: "Event not found",
           data:null
         });
       
      }

      


   

     // Check if a validator already exists in same event
     const existingRoleInEventValidator = await EventValidator.findOne({validator_id: req.body.validator_id , event_id: req.body.event_id });

     if (existingRoleInEventValidator) {
       return res.status(409).send({
         status: false,
         message: "Validator is already added to event",
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
            res.status(500).send({ status: false, message: "Not created",data:null });
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
  try {
    const sellerId = req.query.seller_id;
    const eventId = req.query.event_id;

    var seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(200).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }    
    var sellerData = await SellerModel.findOne({ user_id: sellerId });
    



    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(200).send({
        status: false,
        message: "Event not found",
        data: null,
      });
    } 

    const sellerDistrict = sellerData.district;

    const eventValidators = await EventValidator.aggregate([
      {
        $lookup: {
          from: "validators",
          localField: "validator_id",
          foreignField: "user_id",
          as: "validator_data",
        },
      },
      {
        $lookup: {
          from: "eventmodels",
          localField: "event_id",
          foreignField: "_id",
          as: "event_data",
        },
      },
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(eventId),
          seller_id: new mongoose.Types.ObjectId(sellerId),
        },
      },
    ]);
    console.log("eventValidators",eventValidators)
    const allValidatorList = eventValidators
      .filter((val) => sellerDistrict === val.validator_data[0].district)
      .map((val) => ({
        _id: val.validator_data[0]._id,
        user_id: val.validator_data[0].user_id, // Assuming this is the user_id from the 'validators' collection
        full_name: val.validator_data[0].full_name, // Assuming this is the full_name from the 'validators' collection
        district: val.validator_data[0].district,
        state: val.validator_data[0].state,
        country: val.validator_data[0].country,
        status: val.validator_data[0].status,
        createdAt: val.createdAt,
        updatedAt: val.updatedAt,
        role: val.role,
        validator_status: val.status,
        //...eventValidators
      }));

    if (allValidatorList.length > 0) {
      res.status(200).send({
        status: true,
        message: "Data found",
        data: allValidatorList,
      });
    } else {
      res.status(200).send({
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
  try {
    const sellerId = req.query.seller_id;
    const eventId = req.query.event_id;

    var seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(200).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }    
    var sellerData = await SellerModel.findOne({ user_id: sellerId });
    



    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(200).send({
        status: false,
        message: "Event not found",
        data: null,
      });
    } 

    var event_status = event.status;

    if(event_status == "expired"){
      return  res.status(200).send({
        status: true,
        message: "No validators found",
        data: [],
      });
    }

    const sellerDistrict = sellerData.district;

    const eventValidators = await EventValidator.aggregate([
      {
        $lookup: {
          from: "validators",
          localField: "validator_id",
          foreignField: "user_id",
          as: "validator_data",
        },
      },
      {
        $lookup: {
          from: "eventmodels",
          localField: "event_id",
          foreignField: "_id",
          as: "event_data",
        },
      },
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(eventId),
          seller_id: new mongoose.Types.ObjectId(sellerId),
        },
      },
    ]);

    const allValidatorList = eventValidators
      .filter((val) => sellerDistrict === val.validator_data[0].district)
      .map((val) => ({
        _id: val.validator_data[0]._id,
        user_id: val.validator_data[0].user_id, // Assuming this is the user_id from the 'validators' collection
        full_name: val.validator_data[0].full_name, // Assuming this is the full_name from the 'validators' collection
        district: val.validator_data[0].district,
        state: val.validator_data[0].state,
        country: val.validator_data[0].country,
        status: val.validator_data[0].status,
        createdAt: val.createdAt,
        updatedAt: val.updatedAt,
        role: val.role,
        validator_status: val.status,
      }));

    if (allValidatorList.length > 0) {
      res.status(200).send({
        status: true,
        message: "Data found",
        data: allValidatorList,
      });
    } else {
      res.status(200).send({
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
    const { event_id, status, validator_id,role } = req.body;

    if (!event_id || !status || !validator_id) {
      return res.status(400).json({ status: false, message: "event id, validator id, and role status are required in the request body" });
    }

    const result = await EventValidator.findOneAndUpdate(
      { event_id: event_id, validator_id: validator_id  },
      { status: status, role:role },
      { new: true } // Returns the modified document
    );

    console.log("event_id",event_id)

    console.log("validator_id",validator_id)

    if (!result) {
      return res.status(200).json({ status: false, message: "Event validator not found" });
    }

  

    let updatedStatus = status;
    if (status == "accept") {
      updatedStatus = "accepted";
    } else {
      updatedStatus = "rejected";
    }

    const message = `Validator has ${updatedStatus} the event`;

    const seller_id = result.seller_id;

    
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
      data :null
    });
  }
};


exports.get_validator_events_list = async (req, res) => {
  const validator_id = req.query.validator_id;
  const status = req.query.status;


  try {
    const validator = await User.findById(validator_id);
    console.log("validator_id",validator)
    if (!validator) {
      return res.status(200).send({
        status: false,
        message: "Validator not found",
        data: null,
      });
    }
  
    const validator_events = await EventValidator.find({ validator_id, status: { $eq: status } });


    if (validator_events && validator_events.length > 0) {
      const all_validator_events_list = await Promise.all(validator_events.map(async (validatorEventData) => {
          const eventDetails = await EventModel.findById(validatorEventData.event_id);
          // Get the host (domain and port)
          const protocol = req.protocol;
          const host = req.get('host');

          // Combine protocol, host, and any other parts of the base URL you need
          const baseURL = `${protocol}://${host}`;
        
          var validator_role = validatorEventData.role;
          
          
            return {
              role: validator_role,
              event_data: {
                _id: eventDetails._id,
                seller_id: eventDetails.seller_id,
                primary_number: eventDetails.primary_number,
                secondary_number: eventDetails.secondary_number,
                type: eventDetails.type,
                image: baseURL + '/uploads/events/' + eventDetails.image,
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

              }
          };
       }));

      if (all_validator_events_list.length > 0) {
        res.status(200).send({
          status: true,
          message: "Data found",
          data: all_validator_events_list,
        });
      } else {
        res.status(200).send({
          status: true,
          message: "No events found for the validator",
          data: [],
        });
      }
    } else {
      res.status(200).send({
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


exports.get_event_validator_detail = async (req, res) => {

  const eventId = req.query.event_id;
  const validatorId = req.query.validator_id;


  if (!eventId && !validatorId) {
    res.status(400).send({ status: false, message: "event and validator id missing", data:null });
  } else {
    try {

      const eventValidatorData = await EventValidator.findOne({'event_id' : eventId,'validator_id' : validatorId});   

      if (eventValidatorData) {

        var validatorData = await Validator.findOne({'user_id' : eventValidatorData.validator_id});
        var validatorName = validatorData.full_name;

        const data = {
          _id: eventValidatorData._id,
          validator_id: eventValidatorData.validator_id,
          seller_id: eventValidatorData.seller_id,
          event_id: eventValidatorData.event_id,
          role: eventValidatorData.role,
          createdAt: eventValidatorData.createdAt,
          updatedAt: eventValidatorData.updatedAt,
          __v: eventValidatorData.__v,
          validator_name:validatorName
        };
        res.status(200).send({
          status: true,
          message: "Data found",
          data: data,
        });
      } else {
        res.status(200).send({ status: false, message: "Event validator not found", data:null });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        status: false,
        message: error.toString() || "Internal Server Error",
        data:null
      });
    }
  }
};

exports.update_event_validator= async (req, res, next) => {
  try {

   

    var validatorId = req.query.validator_id;
    var eventId = req.query.event_id;
    var role = req.query.role;

    const eventValidatorData = await EventValidator.findOne({'event_id' : eventId,'validator_id' : validatorId});  
    var eventValidatorId = eventValidatorData._id;
   


    if (!eventId && !validatorId) {
      res.status(400).send({ status: false, message: "event and validator id missing", data:null });
    }

    // Check if a validator already exists in the same event
      const existingRoleInEventValidator = await EventValidator.findOne({
        validator_id: validatorId,
        event_id: eventId,
        _id: { $ne: eventValidatorId } // Exclude the current eventValidatorId
      });

    if (existingRoleInEventValidator) {
      return res.status(409).send({
        status: false,
        message: "Validator is already added to event",
        data:null
      });
    }

    var eventValidatorUpdateData = {'role' : role, 'validator_id' : validatorId};

    const result = await EventValidator.findByIdAndUpdate(
      { _id: eventValidatorId },
      eventValidatorUpdateData,
      { new: true }
    );
     if (result) {
        res.status(200).send({
          status: true,
          message: 'Event validator updated successfully',
          data: result,
        });
    } else {
      res.status(500).send({ status: false, message: "Failed ! Please try again", data:null });
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      status: false,
      message: 'Failure',
      error: error ?? 'Internal Server Error',
    });
  }
};


exports.delete_event_validator = async (req, res) => {

  var validatorId = req.query.validator_id;
  var eventId = req.query.event_id;


  if (!eventId && !validatorId) {
    res.status(400).send({ status: false, message: "event and validator id missing", data:null });
  }

  const eventValidatorData = await EventValidator.findOne({'event_id' : eventId,'validator_id' : validatorId});  
  var eventValidatorId = eventValidatorData._id;


  try {
    const eventValidatorData = await EventValidator.findById(eventValidatorId);   

    if (!eventValidatorData) {
      return res.status(200).send({ status: false, message: "Event validator not found", data: null });
    }

    const result = await EventValidator.findByIdAndDelete(eventValidatorId);

    if (result) {
      return res.status(200).send({ status: true, message: "Event validator deleted", data: null });
    } else {
      return res.status(500).send({ status: false, message: "Failed ! please try again", data: null });
    }
  } catch (error) {
    return res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null
    });
  }
};

