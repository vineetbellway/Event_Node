const Order = require("../models/order.model");
const Menu = require("../models/menu.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
// const helper = require("../helpers/custom_helper");
const OrderItem = require("../models/order_item.model");

exports.create_order = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "body missing",
    });
  } else {
    try {
      Order(req.body)
        .save()
        .then((result) => {
            if (result) {
                    //console.log("result",result)
                    var order_id = result._id;
                    // find menu record by menu id
                    Menu.aggregate([
                        {
                        $match: {
                            _id: new mongoose.Types.ObjectId(req.body.menu_id),
                        },
                        },
                    ])
                    .then((result) => {
                            if (result) {

                                // update total stock and stock left in menu table
                                Menu.findByIdAndUpdate(req.body.menu_id,{total_stock:result[0].total_stock-1,stock_left:result[0].total_stock-1}, { new: true })
                                        .then((result) => {
                                        if (result) {
                                           /* res.status(201).send({
                                            status: true,
                                            message: "Updated",
                                            data: result,
                                            });*/
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

                                    


                            }
                    })


                    // find order item record by menu id
                    OrderItem.aggregate([
                        {
                        $match: {
                            _id: new mongoose.Types.ObjectId(req.body.order_item_id),
                        },
                        },
                    ])
                    .then((result1) => {
                            if (result1) {
                                // update consumed in order item table
                                OrderItem.findByIdAndUpdate(req.body.order_item_id,{consumed:result1[0].consumed+1})
                                        .then((result) => {
                                        if (result) {
                                           /* res.status(201).send({
                                            status: true,
                                            message: "Updated",
                                            data: result,
                                            });*/
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


                                 // update consumed in order table
                                 Order.findByIdAndUpdate(order_id,{consumed:result1[0].consumed+1})
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
                            }
                    })            
            } else {
                res.status(404).send({ status: false, message: "Not created" });
            }
        })
        .catch((error) => {
            console.log("error",error)
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
