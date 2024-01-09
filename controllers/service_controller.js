const Service = require("../models/service.model");
const MenuItem = require("../models/menu_item.model");
const BookedMenuItem = require("../models/booked_menu_item.model");
const MenuItemPayments = require("../models/menu_item_payments.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const EventModel = require("../models/event.model");
const Guest = require("../models/guest.model");


exports.create_service = async (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
      data:null
    });
  } else {
    try {
      if(req.body.is_limited == "yes"){
        if(req.body.limited_count == ""){
          res.status(400).send({
            status: false,
            message: "Limited count missing",
            data:null
          });
        }
      }

      if(req.body.limited_count > req.body.total_stock){
        res.status(400).send({
          status: false,
          message: "Item count should not be greater than total stock",
          data:null
        });
      }

      const countServiceInEvent = await Service.countDocuments({
        'event_id': req.body.event_id,
        'name': req.body.name,
      });
      

      if(countServiceInEvent > 0){
        return res.status(200).send({ status: true, message: "Service already exists", data: null });
      }
      
      Service(req.body)
        .save()
        .then((result) => {
          if (result) {
            res
              .status(201)
              .send({ status: true, message: "Service created successfully", data: result });
          } else {
            res.status(500).send({ status: false, message: "Not created",data:null });
          }
        })
        .catch((error) => {
          res.status(500).send({
            status: false,
            message: error.toString() ?? "Error",
            data:null
          });
        });
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error ?? "Internal Server Error",
        data:null
      });
    }
  }
};



exports.get_services = async (req, res) => {
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
    var myAggregate = Service.aggregate([
      {
        $match: {
          status: baseStatus.active,
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category_data",
        },
      },
      {
        $unwind: "$category_data", // Unwind to access the category_data
      },
      {
        $project: {
          _id: 1,
          event_id:1,
          name: 1,
          category_id:1,
          total_stock:1,
          point:1,
          category: "$category_data.name",
          status:1,
          is_limited:1,
          limited_count:1,
          __v:1,
          createdAt:1,
          updatedAt:1,
        },
      },
    ]);

    await Service.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result.data.length > 0) {
          res.status(200).send({
            status: true,
            message: "success",
            data: result,
          });
        } else {
          res.status(200).send({
            status: false,
            message: "No data found",
            data: [],
          });
        }
      })
      .catch((error) => {
        res.status(500).send({
          status: false,
          message: error.toString() ?? "Error",
          data: null,
        });
      });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
      data: null,
    });
  }
};


exports.get_service = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing",data:null });
  } else {
    try {
      await Service.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "category_id",
            foreignField: "_id",
            as: "category_data",
          },
        },
        {
          $unwind: "$category_data", // Unwind to access the category_data
        },
        {
          $project: {
            _id: 1,
            event_id:1,
            name: 1,
            category_id:1,
            total_stock:1,
            point:1,
            category: "$category_data.name",
            status:1,
            is_limited:1,
            limited_count:1,
            __v:1,
            createdAt:1,
            updatedAt:1,
          },
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
          res.status(500).send({
            status: false,
            message: error.toString() ?? "Error",
            data :null
          });
        });
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
        data :null
      });
    }
  }
};


exports.update_service = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      var service_record =  await Service.findById(id);

      if(service_record){
          const countServiceInEvent = await Service.countDocuments({
            'event_id': req.body.event_id,
            'name': req.body.name,
            '_id': { $ne: id }, // Exclude the current document by ID
          });
  
          if (countServiceInEvent > 0) {
            return res.status(200).send({ status: true, message: "Service already exists", data: null });
          }
    
          if (req.body.is_limited == "yes") {
            if (req.body.limited_count == "") {
              res.status(400).send({
                status: false,
                message: "Limited count missing",
                data: null,
              });
            }
          }
    
          if (req.body.limited_count > req.body.total_stock) {
            res.status(400).send({
              status: false,
              message: "Limited count should not be greater than total stock",
              data: null,
            });
          }
  
        Service.findByIdAndUpdate(id, req.body, { new: true })
            .then((result) => {
              if (result) {
                res.status(200).send({
                  status: true,
                  message: "Updated",
                  data: result,
                });
              } else {
                res.status(500).send({ status: false, message: "Not updated",data:null });
              }
            })
            .catch((error) => {
              res.send({
                status: false,
                message: error.toString() ?? "Error",
                data:null
              });
        });

      } else {
        res.status(200).send({ status: false, message: "Service not found" , data :null });
      }
     } catch (error) {
      res.status(500).send({
        status: false,
        message: "failure",
        error: error ?? "Internal Server Error",
        data:null
      });
    }
  }
};


exports.delete_service = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {

      var service_record =  await Service.findById(id);

      if(service_record){
        await Service.findByIdAndDelete(id)
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
            data:null
          });
        });

      } else {
        res.status(200).send({ status: false, message: "Service not found" , data :null });
      }

      console.log("service_record",service_record)


     
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
        data:null
      });
    }
  }
};


exports.delete_services = async (req, res) => {
  try {
    await Service.deleteMany()
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
        res.status(500).send({
          status: false,
          message: error.toString() ?? "Error",
          data:null
        });
      });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
      data:null
    });
  }
};


exports.get_service_by_event_id = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all Services
    const menuResults = await Menu.aggregate([
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(event_id),
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "category_id",
          foreignField: "_id",
          as: "category_data",
        },
      },
      {
        $unwind: "$uom_data",
      },
      {
        $unwind: "$category_data",
      },
      {
        $project: {
          _id: 1,
          event_id: 1,
          name: 1,
          uom_id: 1,
          category_id: 1,
          point: 1,
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    // Fetch all menu items selected by the guest
    const selectedMenuItems = await MenuItem.find({
      guest_id: guest_id,
      event_id: event_id,
      quantity: { $gt: 0 },
    }).populate('menu_id');

    // Filter menu items based on the selected limited item's category
    const filteredResults = menuResults.filter(item => {
      const menuRecord = selectedMenuItems.find(selectedItem => {
        return (
          selectedItem.menu_id
        
        );
      });

      return !menuRecord || (item.is_limited === "yes" && menuRecord.menu_id._id.toString() === item._id.toString());
    });

    const selectedMenuItems2 = await BookedMenuItem.find({
      guest_id: guest_id,
      event_id: event_id,
    }).populate('menu_id');


    console.log("selectedMenuItems2",selectedMenuItems2)

     // Filter menu items based on the selected limited item's category
     const filteredResults2 = filteredResults.filter(item => {
      const menuRecord = selectedMenuItems2.find(selectedItem => {
        return (
          selectedItem.menu_id &&
          selectedItem.menu_id.category_id.toString() === item.category_id.toString()
        );
      });

      return !menuRecord || (item.is_limited === "yes" && menuRecord.menu_id._id.toString() === item._id.toString());
    });

    console.log("filteredResults2",filteredResults2)
   
    var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;

    if (finalResponse.length > 0) {
      return res.status(200).send({
        status: true,
        message: "Data found",
        data: finalResponse,
      });
    } else {
      res.status(200).send({
        status: true,
        message: "No data found",
        data: [],
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};