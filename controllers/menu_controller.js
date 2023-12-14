const Menu = require("../models/menu.model");
const MenuItem = require("../models/menu_item.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");

exports.create_menu = async (req, res, next) => {
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

      const countMenuItemsInEvent = await Menu.countDocuments({
        'event_id': req.body.event_id,
        'name': req.body.name,
      });
      

      if(countMenuItemsInEvent > 0){
        return res.status(200).send({ status: true, message: "Item already exists", data: null });
      }
      
      Menu(req.body)
        .save()
        .then((result) => {
          if (result) {
            res
              .status(201)
              .send({ status: true, message: "Menu created successfully", data: result });
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


exports.get_menus = async (req, res) => {
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
    var myAggregate = Menu.aggregate([
      {
        $match: {
          status: baseStatus.active,
        },
      },
      {
        $lookup: {
          from: "uoms",
          localField: "uom_id",
          foreignField: "_id",
          as: "uom_data",
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
        $unwind: "$uom_data", // Unwind to access the uom_data
      },
      {
        $unwind: "$category_data", // Unwind to access the category_data
      },
      {
        $project: {
          _id: 1,
          event_id:1,
          name: 1,
          uom_id:1,
          category_id:1,
          total_stock:1,
          cost_price:1,
          selling_price:1,
          uom: "$uom_data.name",
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

    await Menu.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result.data.length > 0) {
          res.status(200).send({
            status: true,
            message: "success",
            data: result,
          });
        } else {
          res.status(200).send({
            status: true,
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


exports.get_menu = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing",data:null });
  } else {
    try {
      await Menu.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(id),
          },
        },
        {
          $lookup: {
            from: "uoms",
            localField: "uom_id",
            foreignField: "_id",
            as: "uom_data",
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
          $unwind: "$uom_data", // Unwind to access the uom_data
        },
        {
          $unwind: "$category_data", // Unwind to access the category_data
        },
        {
          $project: {
            _id: 1,
            event_id:1,
            name: 1,
            uom_id:1,
            category_id:1,
            total_stock:1,
            cost_price:1,
            selling_price:1,
            uom: "$uom_data.name",
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
              status: true,
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

exports.get_menu_by_event_idold = async (req, res) => {
  try {
    var id = req.params.id;
    await Menu.aggregate([
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "uoms",
          localField: "uom_id",
          foreignField: "_id",
          as: "uom_data",
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
        $unwind: "$uom_data", // Unwind to access the uom_data
      },
      {
        $unwind: "$category_data", // Unwind to access the category_data
      },
      {
        $project: {
          _id: 1,
          event_id:1,
          name: 1,
          uom_id:1,
          category_id:1,
          total_stock:1,
          cost_price:1,
          selling_price:1,
          uom: "$uom_data.name",
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
            message: "Data found",
            data: result,
          });
        } else {
          res.status(200).send({
            status: true,
            message: "No data found",
            data: [],
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

exports.get_menu_by_event_id = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Menu.aggregate([
      // Your existing aggregation stages here
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "uoms",
          localField: "uom_id",
          foreignField: "_id",
          as: "uom_data",
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
        $unwind: "$uom_data", // Unwind to access the uom_data
      },
      {
        $unwind: "$category_data", // Unwind to access the category_data
      },
    ]);

    if (result.length > 0) {
      const limitedList = [];
      const unlimitedList = [];

      result.forEach((item) => {
        const categoryIndexLimited = limitedList.findIndex(
          (category) => category.category_id.toString() === item.category_id.toString() && item.is_limited === 'yes'
        );
        const categoryIndexUnlimited = unlimitedList.findIndex(
          (category) => category.category_id.toString() === item.category_id.toString() && item.is_limited === 'no'
        );

        const formattedItem = {
          _id: item._id,
          event_id: item.event_id,
          name: item.name,
          uom_id: item.uom_id,
          category_id: item.category_id,
          total_stock: item.total_stock,
          cost_price: item.cost_price,
          selling_price: item.selling_price,
          is_limited: item.is_limited,
          limited_count: item.limited_count,
          status: item.status,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          uom: item.uom_data.name, // Access uom name from uom_data
          category: item.category_data.name, // Access category name from category_data
        };

        if (item.is_limited === 'yes') {
          if (categoryIndexLimited === -1) {
            limitedList.push({
              category_id: item.category_id,
              category: item.category_data.name,
              item_list: [formattedItem],
            });
          } else {
            limitedList[categoryIndexLimited].item_list.push(formattedItem);
          }
        } else {
          if (categoryIndexUnlimited === -1) {
            unlimitedList.push({
              category_id: item.category_id,
              category: item.category_data.name,
              item_list: [formattedItem],
            });
          } else {
            unlimitedList[categoryIndexUnlimited].item_list.push(formattedItem);
          }
        }
      });

      res.status(200).send({
        status: true,
        message: 'Data found',
        data: {
          limited_list: limitedList,
          unlimited_list: unlimitedList,
        },
      });
    } else {
      res.status(200).send({
        status: true,
        message: 'No data found',
        data: [],
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || 'Internal Server Error',
      data: null,
    });
  }
};



exports.delete_menu = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      await Menu.findByIdAndDelete(id)
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
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
        data:null
      });
    }
  }
};

exports.delete_menus = async (req, res) => {
  try {
    await Menu.deleteMany()
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

exports.update_menu = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      const countMenuItemsInEvent = await Menu.countDocuments({
        'event_id': req.body.event_id,
        'name': req.body.name,
        '_id': { $ne: id }, // Exclude the current document by ID
      });

      if (countMenuItemsInEvent > 0) {
        return res.status(200).send({ status: true, message: "Item already exists", data: null });
      }

      if (req.body.is_limited == "yes") {
        if (req.body.limited_count == "") {
          res.status(400).send({
            status: false,
            message: "Item count missing",
            data: null,
          });
        }
      }

      if (req.body.limited_count > req.body.total_stock) {
        res.status(400).send({
          status: false,
          message: "Item count should not be greater than total stock",
          data: null,
        });
      }

      Menu.findByIdAndUpdate(id, req.body, { new: true })
        .then((result) => {
          if (result) {
            res.status(201).send({
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

exports.manage_menu_item = async (req, res, next) => {
  if (!req.body || !req.body.menu_id || !req.body.guest_id || req.body.quantity === undefined) {
    res.status(400).send({ status: false, message: "Invalid request body", data: null });
  } else {
    try {

      var menuRecord = await Menu.findById(req.body.menu_id);
      var event_id = menuRecord.event_id;


      const { menu_id, guest_id, quantity } = req.body;
      if(quantity < 1){
        res.status(200).send({ status: false, message: "Quantity should be greter than 1", data: null });
      }

      // Assuming MenuItem is a mongoose model
      const menuItem = await MenuItem.findOneAndUpdate(
        { menu_id, guest_id  , event_id },
        { quantity:  quantity  }, // Increment quantity by the specified value
        { new: true, upsert: true } // This option returns the updated document and creates a new one if not found
      );

      res.status(200).send({ status: true, message: "Quantity updated successfully", data: menuItem });
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: null });
    }
  }
};






exports.get_menu_items = async (req, res) => {
  try {
    var guest_id = req.query.guest_id;
    var event_id = req.query.event_id;
    const result = await MenuItem.aggregate([
      {
        $match: {
          guest_id: new mongoose.Types.ObjectId(guest_id),
          event_id: new mongoose.Types.ObjectId(event_id),
        },
      },
    ]);

    if (result.length > 0) {
      let sum = 0;
      const menuPromises = result.map(async (item) => {
        var menu_id = item.menu_id;
        var menu_record = await Menu.findById(menu_id);
        var new_price = menu_record.selling_price * item.quantity;
        sum += new_price;
        return new_price; // Return new_price for Promise.all
      });

      const new_prices = await Promise.all(menuPromises);


      res.status(200).send({
        status: true,
        message: "Data found",
        data: {
          menu_list: result,
          total_selling_price: sum, // Calculate sum after promises are resolved
        },
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


