const EventModel = require("../models/event.model");
const LoyalityOrderItem = require("../models/loyalty_order_item.model");
const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const moment = require("moment");
const { baseStatus, userStatus } = require("../utils/enumerator");

exports.create_event = (req, res, next) => {
  try {
    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const primary_number = req.body.primary_number.trim();
    const secondary_number = req.body.secondary_number.trim();
    const type = req.body.type.trim();
    const image = req.file ? req.file.filename : undefined
    const name = req.body.name.trim();
    const venue = req.body.venue.trim();
    const country = req.body.country.trim();
    const state = req.body.state.trim();
    const city = req.body.city.trim();
    const start_time = req.body.start_time.trim();
    const end_time = req.body.end_time.trim();
    const coupon_name = req.body.coupon_name.trim();
    const tax_name = req.body.tax_name.trim();
    const tax_percent = req.body.tax_percent.trim();
    const amount = req.body.amount.trim();
    const instructions = req.body.instructions.trim();
    const transportation_charge = req.body.transportation_charge.trim();
    const hire_charge = req.body.hire_charge.trim();
    const labour_charge = req.body.labour_charge.trim();
    const commision_charge = req.body.commision_charge.trim();
    const others = req.body.others.trim();
    const status = req.body.status.trim();

    const eventData = {
      seller_id: new ObjectId(seller_id),
      primary_number,
      secondary_number,
      type,
      name,
      venue,
      image,
      country,
      state,
      city,
      start_time,
      end_time,
      coupon_name,
      tax_name,
      tax_percent,
      amount,
      instructions,
      transportation_charge,
      hire_charge,
      labour_charge,
      commision_charge,
      others,
      status,
    };

    EventModel(eventData)
      .save()
      .then((result) => {
        if (result) {
          res.status(201).send({ status: true, message: 'Success', data: result });
        } else {
          res.status(404).send({ status: false, message: 'Not created' });
        }
      })
      .catch((error) => {
        res.send({
          status: false,
          message: error.toString() ?? 'Error',
        });
      });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      status: false,
      message: 'Failure',
      error: error ?? 'Internal Server Error',
    });
  }
};


exports.get_events = async (req, res) => {
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
    var myAggregate = EventModel.aggregate([
      {
        $match: {
          status: baseStatus.active,
        },
      },
    ]);
    await EventModel.aggregatePaginate(myAggregate, options)
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

exports.get_event = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await EventModel.aggregate([
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

exports.search_events = async (req, res) => {
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
    var myAggregate = EventModel.aggregate([
      {
        $match: {
          $or: [{ name: regex }, { coupon_name: regex }],
        },
      },
    ]);
    await EventModel.aggregatePaginate(myAggregate, options)
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

exports.event_by_seller_id = async (req, res) => {
  var id = req.params.id;
  console.log("id",id)
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
    var myAggregate = EventModel.aggregate([
      {
        $match: { seller_id: new mongoose.Types.ObjectId(id) },
      },
    ]);
    await EventModel.aggregatePaginate(myAggregate, options)
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


exports.get_seller_events = async (req, res) => {
  const seller_id = req.query.seller_id;
  console.log("seller_id",seller_id)

  try {
    const events = await EventModel.find({ seller_id: new mongoose.Types.ObjectId(seller_id), 'status': 'active' });

    if (events.length > 0) {
      const currentDateTime = moment();
      const eventsWithImageUrl = [];

      for (const event of events) {
        // Get the host (domain and port)
        const protocol = req.protocol;
        const host = req.get('host');

        // Combine protocol, host, and any other parts of the base URL you need
        const baseURL = `${protocol}://${host}`;
        const image = event.image ? `${baseURL}/uploads/events/${event.image}` : null;
        const end_time = moment(event.end_time);

        if (end_time >= currentDateTime) {
          eventsWithImageUrl.push({
            ...event.toObject(),
            image: image,
          });
        }
      }

      if (eventsWithImageUrl.length > 0) {
        res.status(200).send({
          status: true,
          message: "Success",
          data: eventsWithImageUrl,
        });
      } else {
        res.status(200).send({
          status: false,
          message: "No active events found",
          data: [],
        });
      }
    } else {
      res.status(200).send({
        status: false,
        message: "No events found",
        data: [],
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};





exports.delete_event = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await EventModel.findByIdAndDelete(id)
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

exports.delete_events = async (req, res) => {
  try {
    await EventModel.deleteMany()
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

exports.update_event = (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      EventModel.findByIdAndUpdate(id, req.body, { new: true })
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
