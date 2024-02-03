const Guest = require("../../models/guest.model");
const User = require("../../models/user.model");

const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../../utils/enumerator");



exports.get_guests = async (req, res) => {
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
    var myAggregate = Guest.aggregate([
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
          "status" : "active"
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
          company_name: 1,
          district: 1,
          state: 1,
          country: 1,
          points: 1,
          status:1,
          createdAt:1,
          updatedAt: 1,
          __v: 1,
        }
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);
    await Guest.aggregatePaginate(myAggregate, options)
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

exports.get_guest = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Guest.aggregate([
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
            company_name: 1,
            district: 1,
            state: 1,
            country: 1,
            points: 1,
            status:1,
            createdAt:1,
            updatedAt: 1,
            __v: 1,
          }
        },
      ])
        .then((result) => {
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

exports.update_guest = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      Guest.findByIdAndUpdate(id, req.body, { new: true })
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

exports.delete_guest = async (req, res) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      const result = await Guest.findByIdAndUpdate(id, { status: "deleted" });
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


