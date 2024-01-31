const Validator = require("../../models/validator.model");
const User = require("../../models/user.model");

const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../../utils/enumerator");
const SellerModel = require("../../models/seller.model");
const EventValidator = require("../../models/event_validator.model");



exports.get_validators = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  var search_key = req.query.search_key;
  const sanitizedSearchKey = search_key.trim(); 

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
      {
        $match: {
          $or: [
            { "full_name": { $regex: search_key, $options: "i" } },
            { "user.code_phone": { $regex: search_key, $options: "i" } },
            {
              "user.code_phone": {
                $regex: new RegExp(`^(\\+${sanitizedSearchKey}|0?${sanitizedSearchKey})$`, 'i')
              }
            },
            // Add more conditions if needed
          ],
        },
      },
      {
        $project: {
          _id: 1,
          user_id:1,
          full_name: 1,
          code_phone: "$user.code_phone",
          code: "$user.code",
          phone: "$user.phone",
          district: 1,
          state: 1,
          country: 1,
          status:1,
          fssai: 1,
          createdAt:1,
          updatedAt: 1,
          __v: 1,
        }
      },
      
      {
        $sort: { createdAt: -1 },
      },

    ]);
    await Validator.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result) {
          res.status(200).send({
            status: true,
            message: "success",
            data:result,
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
        {
          $project: {
            _id: 1,
            user_id:1,
            full_name: 1,
            code_phone: "$user.code_phone",
            code: "$user.code",
            phone: "$user.phone",
            district: 1,
            state: 1,
            country: 1,
            status:1,
            fssai: 1,
            createdAt:1,
            updatedAt: 1,
            __v: 1,
          }
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

exports.get_validator_by_user_id = async (req, res) => {
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

exports.delete_validator = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      const result = await Validator.findByIdAndUpdate(id, { status: "deleted" });
      if (result) {
        var user_id = result.user_id;
        await User.findByIdAndUpdate(user_id, { $set: { status: "deleted" } });
        res.status(200).send({
          status: true,
          message: "Deleted",
          data: result,
        });
      } else {
        res.status(404).send({ status: false, message: "Not found" });
      }
    } catch (error) {
      console.log("error",error)
      res.status(500).send({
        status: false,
        message: "failure",
        error: error ?? "Internal Server Error",
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
      .then(async(result) => {
          if (result) {
            var user_id = result.user_id;
            await User.findByIdAndUpdate(user_id, { $set: { phone: contact_number,code: code,code_phone: code_phone } });
            res.status(200).send({
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
      console.log("validators",validators[0].user_data[0])
      const validator_data = validators
        .map((validator) => ({

         
          _id: validator._id,
          user_id: validator.user_id,
          full_name: (validator.full_name) ?? '',
          district: validator.district,
          phone: (validators[0].user_data[0].code_phone) ?? '',
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





