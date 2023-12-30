const Menu = require("../models/menu.model");
const MenuItem = require("../models/menu_item.model");
const BookedMenuItem = require("../models/booked_menu_item.model");
const MenuItemPayments = require("../models/menu_item_payments.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const EventModel = require("../models/event.model");
const Guest = require("../models/guest.model");


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

exports.get_menu_by_event_id= async (req, res) => {
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

exports.get_menu_by_event_id_old = async (req, res) => {
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
    res.status(400).send({ status: false, message: "Invalid request body", data: [] });
  } else {
    try {

      var menuRecord = await Menu.findById(req.body.menu_id);
      var event_id = menuRecord.event_id;


      const { menu_id, guest_id, quantity } = req.body;
      if(quantity < 1){
        res.status(200).send({ status: false, message: "Quantity should be greter than 1", data: [] });
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
      res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: [] });
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
  //  console.log("result",result);
    //return false;
    if (result.length > 0) {
      let sum = 0;
      const menuPromises = result.map(async (item) => {
        //console.log("item", item);
        if (item && typeof item.quantity === 'number' && item.quantity > 0) {
          var menu_id = item.menu_id;
          var menu_record = await Menu.findById(menu_id);
          if (menu_record) {
            var new_price = menu_record.selling_price * item.quantity;
            sum += new_price;
            return {
              ...item,
              'category_id':menu_record.category_id,
              quantity: item.quantity, // Include quantity in the response
            }; // Return item with new_price for Promise.all
          }
        }
      });

      const new_result = await Promise.all(menuPromises);



      const filteredMenuList = new_result.filter((item) => item && typeof item.quantity === 'number' && item.quantity > 0);
        res.status(200).send({
          status: true,
          message: "Data found",
          data: {
            menu_list: filteredMenuList,
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


exports.book_menu_items = async (req, res, next) => {
  try {
    const menuItems = req.body.menu_items;

    


    if (!Array.isArray(menuItems)) {
      res.status(400).send({ status: false, message: "Invalid request format. Expected an array.", data: null });
      return;
    }

    const batchSize = 5;
    const results = [];

   

    if(menuItems.length > 0){
      var event_record = await EventModel.findById(menuItems[0].event_id);
     
    }

    if(event_record.status == "expired"){
      res.status(400).send({ status: false, message: "Event is expired", data: null });
      return;
    }
  

    if(event_record.type == "food_event"){




       if(event_record.is_cover_charge_added == "no"){
      
        const paymentData = {
          payment_status: 'paid',
         
        };
    
        const paymentResult = await MenuItemPayments(paymentData).save();
    
        const payment_id = paymentResult._id;




        for (let i = 0; i < menuItems.length; i += batchSize) {
          const batch = menuItems.slice(i, i + batchSize);
    
          const batchResults = await Promise.all(batch.map(async (menuItem) => {
            const { _id, event_id, guest_id, menu_id, quantity,category_id } = menuItem;
    
            if (!_id || !event_id || !guest_id || !menu_id || !quantity || !category_id) {
              return { status: false, message: "_id, event_id, guest_id,menu_id, quantity  or category_id missing", data: null };
            }
    
            const menuRecord = await Menu.findById(menu_id);
    
            if (!menuRecord) {
              return { status: false, message: "Menu not found", data: null };
            }
            var menu_item_id = _id;
    
            const bookingData = {
              menu_item_id,
              event_id,
              guest_id,
              menu_id,
              quantity,
              payment_id,
              category_id
            };  

          
    
            const result = await BookedMenuItem(bookingData).save();
    
            if (result) {
              const resultObject = result.toObject();
              delete resultObject.payment_id; // Remove payment_id from individual result
              return resultObject;
            } else {
              return null;
            }
          }));
    
          // Filter out null values from batchResults
          results.push(...batchResults.filter((result) => result !== null));
    
    
        }

        const bookedMenuResult = await BookedMenuItem.find({ payment_id: payment_id });
          var sum = 0;
            for (const item of bookedMenuResult) {
              if (item && typeof item.quantity === 'number' && item.quantity > 0) {
                const menu_id = item.menu_id;
                const menuRecord = await Menu.findById(menu_id);

                if (menuRecord) {
                  sum += menuRecord.selling_price * item.quantity;
                }
              }
            }

            await MenuItemPayments.findByIdAndUpdate(payment_id, { $set: { amount: sum } });


          // Delete records from the menuItems model
          const deleteConditions = {
            event_id: { $in: results.map(item => item.event_id) },
            menu_id: { $in: results.map(item => item.menu_id) },
            guest_id: { $in: results.map(item => item.guest_id) },
          };
      
          await MenuItem.deleteMany(deleteConditions);
          res.status(200).send({ status: true, message: "Item booked successfully", data : { payment_id: payment_id,booked_data: results} });
    
       
       } else {

        const paymentData = {
          payment_status: 'paid',
          amount:req.body.amount
      
        };

    
        const paymentResult = await MenuItemPayments(paymentData).save();
    
        const payment_id = paymentResult._id;



        for (let i = 0; i < menuItems.length; i += batchSize) {
          const batch = menuItems.slice(i, i + batchSize);
    
          const batchResults = await Promise.all(batch.map(async (menuItem) => {
            const { _id, event_id, guest_id, menu_id, quantity,category_id } = menuItem;
    
            if (!_id || !event_id || !guest_id || !menu_id || !quantity || !category_id) {
              return { status: false, message: "_id, event_id, guest_id,menu_id, or quantity, category_id missing", data: null };
            }
    
            const menuRecord = await Menu.findById(menu_id);
    
            if (!menuRecord) {
              return { status: false, message: "Menu not found", data: null };
            }
            var menu_item_id = _id;
    
            const bookingData = {
              menu_item_id,
              event_id,
              guest_id,
              menu_id,
              quantity,
              payment_id,
              category_id
            };
    
            const result = await BookedMenuItem(bookingData).save();
    
            if (result) {
              const resultObject = result.toObject();
              delete resultObject.payment_id; // Remove payment_id from individual result
              return resultObject;
            } else {
              return null;
            }
          }));
    
          // Filter out null values from batchResults
          results.push(...batchResults.filter((result) => result !== null));
    
    
        }
              // Delete records from the menuItems model
              const deleteConditions = {
                event_id: { $in: results.map(item => item.event_id) },
                menu_id: { $in: results.map(item => item.menu_id) },
                guest_id: { $in: results.map(item => item.guest_id) },
              };
          
              await MenuItem.deleteMany(deleteConditions);

    
        res.status(200).send({ status: true, message: "Item booked successfully", data : { payment_id: payment_id,amount:req.body.amount,booked_data: results} });
       }

    }
  

   
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: null });
  }
};

exports.get_booked_menu_items = async (req, res) => { 
  if (req.query.payment_id == '') {
    res.status(400).send({ status: false, message: "Invalid request body", data: [] });
  } else {
    try {
      var payment_id  = req.query.payment_id;

      console.log("payment_id",payment_id)

      // Check the existence of payment_id in the BookedMenuItem collection
      const bookedMenuResult = await BookedMenuItem.find({ payment_id: payment_id });

      if (!bookedMenuResult || bookedMenuResult.length === 0) {
        res.status(404).send({ status: false, message: "No booking found for the provided payment_id", data: [] });
        return;
      }

      const guest_id = bookedMenuResult[0].guest_id;
      const event_id = bookedMenuResult[0].event_id;

      const paymentData = await MenuItemPayments.findById(payment_id);


   
      

      // Fetch relevant data from MenuItem collection based on guest_id and event_id
      const menuItemResult = await MenuItem.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
            event_id: new mongoose.Types.ObjectId(event_id),
          },
        },
      ]);

      // Fetch menu events for the specific event_id
      const event_menus = await Menu.aggregate([
        {
          $match: {
            event_id: new mongoose.Types.ObjectId(event_id),
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
            event_id: 1,
            name: 1,
            uom_id: 1,
            category_id: 1,
            total_stock: 1,
            cost_price: 1,
            selling_price: 1,
            uom: "$uom_data.name",
            category: "$category_data.name",
            status: 1,
            is_limited: 1,
            limited_count: 1,
            __v: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]);


      var guest_record = await Guest.aggregate([
        {
          $match: {
            user_id: new mongoose.Types.ObjectId(guest_id),
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "ser_id",
            foreignField: "_id",
            as: "user_data",
          },
        },
      ]);

      console.log("guest_record", guest_record);
      
      // Check if cover charge exceeds the sum of menu item prices

      const eventRecord = await EventModel.findById(event_id);
      console.log("rr",eventRecord)
      if(eventRecord.type == "food_event"){
      /*  if(eventRecord.is_cover_charge_added == "yes"){*/
          var sum = 0;
          for (const item of bookedMenuResult) {
            if (item && typeof item.quantity === 'number' && item.quantity > 0) {
              const menu_id = item.menu_id;
              const menuRecord = await Menu.findById(menu_id);

              if (menuRecord) {
                sum += menuRecord.selling_price * item.quantity;
              }
            }
          }

       /* } else {
           var sum = paymentData.amount;
        }*/
      }
      

      // Approve menu item payments
      const result = bookedMenuResult.map(item1 => {
        // Find the matching event_menu for the current item1
        const matchingEventMenu = event_menus.find(event => event.event_id.equals(item1.event_id) && event._id.equals(item1.menu_id));
      //  console.log("item1",item1)
         // Find the matching guest record for the current item1
         const matchingGuestRecord = guest_record.find(guest => guest.user_id.equals(item1.guest_id));
        console.log("matchingGuestRecord",matchingGuestRecord)
        // Assign the event_menu information to the current item1
        return {
          ...item1.toObject(),
          event_menu: matchingEventMenu || null,
          guest_record : matchingGuestRecord || null
        };
      });

      console.log("result", result);

      if (result.length > 0) {
        console.log("result");
        res.status(200).send({ status: true, message: "Data found", data: { total_selling_price: sum, menu_list: result } });
      } else {
        res.status(200).send({ status: true, message: "No Data found", data: [] });
      }
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: [] });
    }
  }
};




exports.approve_menu_payment = async (req, res, next) => {
  // Check the existence of required fields in the request body
  if (!req.body || !req.body.payment_id || !req.body.validator_id) {
    res.status(400).send({ status: false, message: "Invalid request body", data: [] });
  } else {
    try {
      const { payment_id, validator_id } = req.body;

      // Check the existence of payment_id in the BookedMenuItem collection
      const bookedMenuResult = await BookedMenuItem.find({ payment_id: payment_id });

      if (!bookedMenuResult || bookedMenuResult.length === 0) {
        res.status(404).send({ status: false, message: "No booking found for the provided payment_id", data: [] });
        return;
      }

      const guest_id = bookedMenuResult[0].guest_id;
      const event_id = bookedMenuResult[0].event_id;

      // Fetch relevant data from MenuItem collection based on guest_id and event_id
      const menuItemResult = await MenuItem.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
            event_id: new mongoose.Types.ObjectId(event_id),
          },
        },
      ]);

      // Check if cover charge exceeds the sum of menu item prices
      let sum = 0;
      for (const item of bookedMenuResult) {
        console.log("item",item)
        if (item && typeof item.quantity === 'number' && item.quantity > 0) {
          const menu_id = item.menu_id;
          const menuRecord = await Menu.findById(menu_id);
       
           // Update total stock in Menu collection
           const newTotalStock = menuRecord.total_stock - item.quantity;
       
           await Menu.findByIdAndUpdate(menu_id, { $set: { total_stock: newTotalStock } });
      

          if (menuRecord) {
            sum += menuRecord.selling_price * item.quantity;
          }
        }
      }

      // Fetch cover charge from the event record
      const eventRecord = await EventModel.findById(event_id);

      var total_coupon_balance = eventRecord.cover_charge;

      var total_sum = 0;

      var bookedPaymentResult = await MenuItemPayments.aggregate([
              
        {
          $lookup: {
            from: 'menuitembookings',
            localField: '_id',
            foreignField: 'payment_id',
            as: 'booking_data',
          },
        },
       {
          $match: {
            "booking_data.event_id": new mongoose.Types.ObjectId(event_id),
            "booking_data.guest_id": new mongoose.Types.ObjectId(guest_id)
       
          },
        },
        {
          $sort: { 'createdAt': -1 },
        },

      ])
        .then(async (result2) => {

          if (result2.length > 0) {
      
      
            for(var p_item of result2){
                if(p_item.amount!=undefined){                        
                  total_sum += p_item.amount;
                }
            }
            console.log("total_coupon_balance",total_coupon_balance)
            console.log("total_sum",total_sum)
              total_coupon_balance = total_coupon_balance - total_sum;
          } else {
            total_coupon_balance = total_coupon_balance;
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
     

     /* const bookedPaymentResult = await MenuItemPayments.find({
      //  _id: { $lt: payment_id },
      })
        .sort({ _id: -1 });*/

   
   /*   var total_sum = 0;
      // Loop through each bookedPaymentResult
      if(bookedPaymentResult.length > 0){

         for(var bookpay of bookedPaymentResult){
          if(bookpay.amount!=undefined){
            total_sum += bookpay.amount;
          }
          
         
         }

         var coverCharge = total_sum;
        
      } else {
        var coverCharge = eventRecord ? eventRecord.cover_charge : 0;
      }*/





      if(eventRecord.type == "food_event"){
        if(eventRecord.is_cover_charge_added == "yes"){
          console.log("total_coupon_balance",total_coupon_balance)
          console.log("total_sum",total_sum);
          console.log("sum",sum);
      //    return false;
         
          if (sum > total_coupon_balance) {
            res.status(400).send({ status: false, message: "Total price exceeds then cover charge", data: [] });
            return;
          }    

      
          // Subtract sum from cover charge
         // coverCharge -= sum;   
          //console.log("coverCharge",sum);
          //return false;
    
          // Update amount in the menu item payment record
          await MenuItemPayments.findByIdAndUpdate(payment_id, { $set: { amount: sum } });

        } else {
          coverCharge = 0;
        }
      }  

     // Approve menu item payments in MenuItemPayments collection
      const is_approved = 'yes';
      var updatedPaymentResult = await MenuItemPayments.findOneAndUpdate(
        { _id: payment_id },
        { validator_id: validator_id, is_approved: is_approved },
        { new: true }
      );

          // Check if the result is not null
      if (updatedPaymentResult) {
        // Now, explicitly set guest_id in the updatedPaymentResult
        updatedPaymentResult = updatedPaymentResult.toObject(); // Convert to a plain JavaScript object
        updatedPaymentResult.guest_id = guest_id;
      }


      console.log("updatedPaymentResult", updatedPaymentResult);

      res.status(200).send({
        status: true,
        message: "Payment approved successfully",
        data: { updatedPaymentResult, remainingCoverCharge: total_coupon_balance-sum },
      });
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: [] });
    }
  }
};

exports.close_menu_counter_by_validator = async (req, res) => {
  var event_id = req.body.event_id;
  var validator_id = req.body.validator_id;
  console.log("event_id",event_id)
  console.log("validator_id",validator_id)

    try {
      Menu.updateMany(
        { event_id: event_id },
        { 
          $set: { 
            total_stock: 0,  
            validator_id: new mongoose.Types.ObjectId(validator_id),
          } 
        },
        { new: true } // This option returns the modified document
      )
      .then((result) => {
        if (result) {
          res.status(200).json({
            status: true,
            message: "Counter close successfully",
            data: result,
          });
        } else {
          res.status(200).json({
            status: false,
            message: "Failed ! Please try again",
            data: null,
          });
        }
      });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  
};










