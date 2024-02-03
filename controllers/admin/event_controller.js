
const mongoose = require("mongoose");
const { baseStatus } = require("../../utils/enumerator");
const EventModel = require("../../models/event.model");
const Seller = require("../../models/seller.model");
const User = require("../../models/user.model");

exports.get_events = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    var search_key = req.query.search_key;
    const sanitizedSearchKey = search_key.trim(); 
    let regex = new RegExp(search_key, "i");
  
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
          $lookup: {
            from: "sellers",
            localField: "seller_id",
            foreignField: "user_id",
            as: "seller",
          },
        },
        {
          $unwind: "$seller",
        },
        {
            $lookup: {
              from: "users",
              localField: "seller_id",
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
                { "seller.contact_name": { $regex: search_key, $options: "i" } },
                { "user.code_phone": { $regex: search_key, $options: "i" } },
                {
                  "user.code_phone": {
                    $regex: new RegExp(`^(\\+${sanitizedSearchKey}|0?${sanitizedSearchKey})$`, 'i')
                  }
                },
                { name: regex }, { coupon_name: regex }, { venue: regex },
                // Add more conditions if needed
              ],
               "status": { $ne: "deleted" } ,
            },
          },
          {
            $sort: { createdAt: -1 },
          },
      ]);
  
      await EventModel.aggregatePaginate(myAggregate, options)
        .then((result) => {
          if (result) {
            const baseURL = `${req.protocol}://${req.get('host')}`;
  
            // Update image URLs for each event in the data array
            result.data = result.data.map(event => {
              const eventImageUrl = baseURL + '/uploads/events/' + event.image;
              return {
                event_data: {
                  ...event,
                  image: eventImageUrl,
                  seller: undefined,
                  banner_data: undefined,
                  user:undefined

                },
                seller_data: {
                  ...event.seller,
                  code_phone: event.user.code_phone,
                  code: event.user.code,
                },
               
              };
            });
  
            res.status(200).send({
              status: true,
              message: "success",
              data: result,
            });
          } else {
            res.status(200).send({
              status: false,
              message: "No Events found",
              data:null
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

exports.delete_event = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      const result = await EventModel.findByIdAndUpdate(id, { status: "deleted" });
      if (result) {
        res.status(200).send({
          status: true,
          message: "Event deleted successfully",
          data: result,
        });
      } else {
        res.status(404).send({
          status: false,
          message: "Event not found",
        });
      }
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};
  
  
  

  
  





