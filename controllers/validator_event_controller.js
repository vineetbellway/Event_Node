const ValidatorEvent = require("../models/validator_event.model");
const EventValidator = require("../models/event_validator.model");
const Validator = require("../models/validator.model");
const SellerModel = require("../models/seller.model");
const EventModel = require("../models/event.model");
const mongoose = require("mongoose");
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
            role: validator.validator_event_data.length > 0 ? validator.validator_event_data[0].role : null,
          }))
          .filter((validator) => {
            if (validator.validator_event_data && Array.isArray(validator.validator_event_data)) {
              return validator.validator_event_data.some((event) => event.event_id == event_id);
            }
            return false; // Return false if validator.validator_event_data is not an array or undefined
          });

      if (filtered_event_validator_data.length > 0) {
        res.status(200).send({
          status: true,
          message: "Data found",
          data: filtered_event_validator_data,
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


exports.get_event_validators_list = async (req, res) => {
  const seller_id = new mongoose.Types.ObjectId(req.query.seller_id);
  const event_id = new mongoose.Types.ObjectId(req.query.event_id);

  try {
    const eventValidators = await Validator.aggregate([
      {
        $match: { user_id: seller_id }
      },
      {
        $lookup: {
          from: "eventvalidators",
          let: { validator_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$validator_id", "$$validator_id"] },
                    { $eq: ["$event_id", event_id] }
                  ]
                }
              }
            }
          ],
          as: "validator_event_data"
        }
      },
      {
        $addFields: {
          validator_event_data: {
            $map: {
              input: "$validator_event_data",
              in: {
                _id: "$$this._id",
                validator_id: "$$this.validator_id",
                seller_id: "$$this.seller_id",
                event_id: "$$this.event_id",
                role: "$$this.role"
              }
            }
          }
        }
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
          validator_event_data: 1
        }
      }
    ]);

    if (eventValidators.length > 0) {
      res.status(200).send({
        status: true,
        message: "Data found",
        data: eventValidators
      });
    } else {
      res.status(200).send({
        status: true,
        message: "No validators found for the specified event_id",
        data: []
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null
    });
  }
};
