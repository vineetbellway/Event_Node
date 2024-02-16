const Validator = require("../models/validator.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const SellerModel = require("../models/seller.model");
const EventValidator = require("../models/event_validator.model");
const EventModel = require("../models/event.model");
const User = require("../models/user.model");


exports.create_validator = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      Validator(req.body)
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

exports.get_validators = async (req, res) => {
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
    var myAggregate = Validator.aggregate([
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
    await Validator.aggregatePaginate(myAggregate, options)
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

exports.get_validator = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Validator.aggregate([
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

exports.get_validator_by_user_id3 = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Validator.aggregate([
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

exports.get_validator_by_user_id44 = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {


    const eventValidators = await EventValidator.aggregate([
      {
        $match: {
          validator_id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "validators",
          localField: "validator_id",
          foreignField: "user_id",
          as: "validator_data",
        },
      
      },
      
     
    ])  .then(async(result) => {
      if (result) {

       //  console.log("result",result)
         const currentDateTime = new Date();
         const year = currentDateTime.getFullYear();
         const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
         const day = ('0' + currentDateTime.getDate()).slice(-2);
         const hours = ('0' + currentDateTime.getHours()).slice(-2);
         const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
         const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
         
         const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
         
         const presentDateTime = new Date(currentDateTimeFormatted);
        var all_data = [];
         if(result.length > 0){
            for(item of result){
              var validator_status = item.status;
             // console.log("status",status)
              if(validator_status == "accept"){
                var eventRecord = await EventModel.findById(item.event_id);
               // console.log("eventRecord",eventRecord)
                if(eventRecord){
                  const eventStartDateTime = eventRecord.start_time;
                  const eventEndDateTime = eventRecord.end_time;
                  if (presentDateTime >= eventStartDateTime && presentDateTime <= eventEndDateTime) {
                    var validator_role = result[0].role;
                  } else {
                    var validator_role = '';
                  }
                }
                
                
              } else {
                var validator_role = '';
              }
              const userData = await User.findOne({ _id: item.validator_id });

              const validatorData = await Validator.findOne({ user_id: userData._id });
              
              var response = 
                {
                  _id: validatorData._id,
                  user_id: validatorData.user_id,
                  full_name: validatorData.full_name,
                  district: validatorData.district,
                  state: validatorData.state,
                  country: validatorData.country,
                  status: validatorData.status,
                  createdAt: validatorData.createdAt,
                  updatedAt: validatorData.updatedAt,
                  __v: validatorData.__v,
                  role: validator_role,
                  user: userData,
                  validator_status: validator_status,
                  event:eventRecord
                }

                all_data.push(response)

            }
       
           
            
         }

  

    
 

         res.status(200).send({
          status: true,
          message: "success",
          data: all_data
        });
    console.log("validator_role",validator_role)
    console.log("eventRecord",eventRecord)

      
      }
    })
    .catch((error) => {
      console.log("error",error)
      res.send({
        status: false,
        message: error.toString() ?? "Error",
      });
    });






    /*  await Validator.aggregate([
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
        });*/
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};
exports.get_validator_by_user_id = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) {
      return res.status(400).send({ status: false, message: "id missing" });
    }

    const validator = await Validator.findOne({ user_id: id });
    if (!validator) {
      return res.status(404).send({ status: false, message: "Validator not found" });
    }

    const userData = await User.findOne({ _id: id });

    const eventValidatorData = await EventValidator.find({ validator_id: id });
    const filteredData = [];
    const currentDateTime = new Date();
    const year = currentDateTime.getFullYear();
    const month = ('0' + (currentDateTime.getMonth() + 1)).slice(-2);
    const day = ('0' + currentDateTime.getDate()).slice(-2);
    const hours = ('0' + currentDateTime.getHours()).slice(-2);
    const minutes = ('0' + currentDateTime.getMinutes()).slice(-2);
    const seconds = ('0' + currentDateTime.getSeconds()).slice(-2);
    
    const currentDateTimeFormatted = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
    
    const presentDateTime = new Date(currentDateTimeFormatted);

    console.log("presentDateTime",presentDateTime)

//console.log("validator event data",eventValidatorData)

    if(eventValidatorData.length > 0){
      for (const item of eventValidatorData) {
        const eventRecord = await EventModel.findById(item.event_id);

        if (!eventRecord) continue;
  
        const eventStartDateTime = eventRecord.start_time;
        const eventEndDateTime = eventRecord.end_time;
        var validator_role = '';
          if(item.status == "accept"){
            if (presentDateTime >= eventStartDateTime && presentDateTime <= eventEndDateTime ) {
                var validator_role = item.role;
                break;
            }
          }
      }

      res.status(200).send({
        status: true,
        message: "success",
        data: {
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
          role: validator_role,
          user: userData
        }
      });
    } else {
      filteredData.push({
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
        role: '',
        user: userData,
      });
      res.status(200).send({
        status: true,
        message: "success",
        data: filteredData[0]
      });
    }
   
    
   // console.log("here",filteredData)
    

   
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};

exports.delete_validator = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Validator.findByIdAndDelete(id)
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

exports.delete_validators = async (req, res) => {
  try {
    await Validator.deleteMany()
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

exports.update_validator = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Validator.findByIdAndUpdate(id, req.body, { new: true })
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


exports.get_seller_validator_list = async (req, res) => {
  const seller_id = req.query.seller_id;
  const search_key = req.query.search_key;
  try {
    const seller = await SellerModel.findOne({ user_id: seller_id });
    if (!seller) {
      return res.status(404).send({
        status: false,
        message: "Seller not found",
        data: null,
      });
    }

   

    // Define the regex pattern for the search_key
    const sanitizedSearchKey = search_key.trim(); 

    const filter = {
      $or: [
        { full_name: { $regex: new RegExp(sanitizedSearchKey, 'i') } },
        { "user_data.code_phone": { $regex: new RegExp(sanitizedSearchKey, 'i') } },
        {
          "user_data.code_phone": {
            $regex: new RegExp(`^(\\+${sanitizedSearchKey}|0?${sanitizedSearchKey})$`, 'i')
          }
        },
      ],
    };

    const validators = await Validator.aggregate([
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
        $lookup: {
          from: "users",
          localField: "user_id", // Assuming this is the field in Validator that corresponds to the _id in Users
          foreignField: "_id", // Assuming this is the field in Users that corresponds to the _id in Validator
          as: "user_data",
        },
      },
      {
        $match: filter,
      },
    ]);

    if (validators && validators.length > 0) {
      const validator_data = validators
        .map((validator) => ({

         
          _id: validator._id,
          user_id: validator.user_id,
          full_name: (validator.full_name) ?? '',
          district: validator.district,
          phone: (validator.user_data[0].code_phone) ?? '',
          state: validator.state,
          country: validator.country,
          status: validator.status,
          createdAt: validator.createdAt,
          updatedAt: validator.updatedAt,
          __v: validator.__v,
          role: validator.validator_event_data.length > 0 ? validator.validator_event_data[0].role : '',
        }));

      if (validator_data.length > 0) {
        res.status(200).send({
          status: true,
          message: "Data found",
          data: validator_data,
        });
      } else {
        res.status(200).send({
          status: true,
          message: "No validators found",
          data: validator_data,
        });
      }
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





