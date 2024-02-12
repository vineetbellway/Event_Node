const Menu = require("../models/menu.model");
const MenuItem = require("../models/menu_item.model");
const BookedMenuItem = require("../models/booked_menu_item.model");
const MenuItemPayments = require("../models/menu_item_payments.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const EventModel = require("../models/event.model");
const Guest = require("../models/guest.model");
const BookingMenu = require("../models/booking_menu.model");
const BookingPayments = require("../models/booking_payments.model");
const MenuItemRecord = require("../models/menu_item_record.model");
const ValidatorQuantity = require("../models/validator_quantity.model");


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

exports.get_menu_by_event_id_working_code_on_25_jan = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

      if (event.statusenabled == "expired") {
        return  res.status(200).send({
          status: false,
          message: "Event is expired",
          data: null,
        });
      }

   

   

      var is_cover_charge_added = event.is_cover_charge_added;
    //  console.log("is_cover_charge_added",is_cover_charge_added)
     console.log("event",event);
      if(event.type == "food_event"){
        if(is_cover_charge_added == "no"){
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              console.log("s",selectedItem.menu_id.is_limited)
              var is_limited = selectedItem.menu_id.is_limited;
              
              if(is_limited == 'yes'){
                
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                
                
              } else {
                return (
                  selectedItem.menu_id 
                );
              }
             
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
  
       
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              var is_limited = selectedItem.menu_id.is_limited;
              var limited_count = selectedItem.menu_id.limited_count;
              
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                
                
              
            });

        
            if(item.is_limited =="no"){
              return menuRecord;
             
            } else {
             var menuRecordNoLimited =  !menuRecord || (item.is_limited === "yes" &&  item.limited_count > 0 && menuRecord.menu_id._id.toString() === item._id.toString() &&
                menuRecord.menu_id.category_id.toString() === item.category_id.toString());
            return menuRecordNoLimited;
            
            }
      

            
          });

         // console.log("filteredResults2",filteredResults2)
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
        } else {

          console.log("cover charge enabled");
  
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
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return menuRecord;
          });

          console.log("filteredResults",filteredResults);
          console.log("filteredResults2",filteredResults2);
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        }
      } else {
         
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

          console.log
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
          console.log("filteredResults",filteredResults)
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      }
      

      
   
   

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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.get_menu_by_event_id_backup_9_feb = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

      if (event.status == "expired") {
        return  res.status(200).send({
          status: false,
          message: "Event is expired",
          data: null,
        });
      }

   

   

      var is_cover_charge_added = event.is_cover_charge_added;
    //  console.log("is_cover_charge_added",is_cover_charge_added)
     console.log("event",event);
      if(event.type == "food_event"){
        if(is_cover_charge_added == "no"){
          console.log("cover charge disabled");
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
         

          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              //console.log("s",selectedItem.menu_id.is_limited)
              var is_limited = selectedItem.menu_id.is_limited;
              
              if(item.is_limited == 'yes' && item.limited_count > 0){
                
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                
                
              }
             
            });

            
           /* if(item.is_limited =="no"){
              console.log("item no limited",item);
              return menuRecord;
             
            } else {
              console.log("item",item);
              return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
            }*/

            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
  
            
          });
  
  
  
  
       
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');


          const filteredResults2new = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              var is_limited = selectedItem.menu_id.is_limited;
              var limited_count = selectedItem.menu_id.limited_count;
              
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                
                
              
            });

        
            if(item.is_limited =="no"){
              return menuRecord;
             
            } else {
             var menuRecordNoLimited =  !menuRecord || (item.is_limited === "yes" &&  item.limited_count > 0 && menuRecord.menu_id._id.toString() === item._id.toString() &&
                menuRecord.menu_id.category_id.toString() === item.category_id.toString());
            return menuRecordNoLimited;
            
            }
      

            
          });


          const filteredResults2 = filteredResults.filter(async(item) => {x

            const menuRecord = await selectedMenuItems2.find( async(selectedItem) => {
              var is_limited = selectedItem.menu_id.is_limited;
              var limited_count = selectedItem.menu_id.limited_count;
              var payment_id = selectedItem.payment_id;
            //  console.log("payment_id",payment_id);
              var payment_record = await MenuItemPayments.findById(payment_id);
            //  console.log("payment_record",payment_record);
              if(payment_record.is_approved && payment_record.is_approved == "yes"){
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                );
              } else {
                return (
                  selectedItem.menu_id 
              );
              }
              
             
          });
          


        
            if(item.is_limited =="no"){
              return menuRecord;
             
            } else {
             var menuRecordNoLimited =  !menuRecord || (item.is_limited === "yes" &&  item.limited_count > 0 && menuRecord.menu_id._id.toString() === item._id.toString() &&
                menuRecord.menu_id.category_id.toString() === item.category_id.toString());
             //  console.log("menuRecordNoLimited",menuRecordNoLimited)
            return menuRecordNoLimited;
            
            }
      

            
          });
          

  
  

       //  console.log("selectedMenuItems2",selectedMenuItems2)
          console.log("filteredResults2",filteredResults2)
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
        } else {

          console.log("cover charge enabled");
  
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
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return menuRecord;
          });

          console.log("filteredResults",filteredResults);
          console.log("filteredResults2",filteredResults2);
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        }
      } else {
         
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

          console.log
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
          console.log("filteredResults",filteredResults)
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      }
      

      
   
   

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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.get_menu_by_event_id = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

      if (event.status == "expired") {
        return  res.status(200).send({
          status: false,
          message: "Event is expired",
          data: null,
        });
      }

   

   

      var is_cover_charge_added = event.is_cover_charge_added;
    //  console.log("is_cover_charge_added",is_cover_charge_added)
    //  console.log("event",event);
      if(event.type == "food_event"){
        if(is_cover_charge_added == "no"){
          console.log("cover charge disabled");
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
         

          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              //console.log("s",selectedItem.menu_id.is_limited)
              var is_limited = selectedItem.menu_id.is_limited;
              
              if(item.is_limited == 'yes' && item.limited_count > 0){
                
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                
                
              }
             
            });

            
           /* if(item.is_limited =="no"){
              console.log("item no limited",item);
              return menuRecord;
             
            } else {
              console.log("item",item);
              return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
            }*/

            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
  
            
          });
  
  
  
  
       
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');


          const filteredResults2new = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              var is_limited = selectedItem.menu_id.is_limited;
              var limited_count = selectedItem.menu_id.limited_count;
              
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                
                
              
            });

        
            if(item.is_limited =="no"){
              return menuRecord;
             
            } else {
             var menuRecordNoLimited =  !menuRecord || (item.is_limited === "yes" &&  item.limited_count > 0 && menuRecord.menu_id._id.toString() === item._id.toString() &&
                menuRecord.menu_id.category_id.toString() === item.category_id.toString());
            return menuRecordNoLimited;
            
            }
      

            
          });

        //  console.log("filteredResults",filteredResults);
        //  console.log("selectedMenuItems2",selectedMenuItems2)


          const filteredResults23 = filteredResults.filter(async(item) => {

            const menuRecord = await selectedMenuItems2.find( async(selectedItem) => {
              var is_limited = selectedItem.menu_id.is_limited;
              var limited_count = selectedItem.menu_id.limited_count;
              var payment_id = selectedItem.payment_id;
            //  console.log("payment_id",payment_id);
              var payment_record = await MenuItemPayments.findById(payment_id);
            //  console.log("payment_record",payment_record);
              if(payment_record.is_approved && payment_record.is_approved == "yes"){
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() !== item.category_id.toString()
                );
              } else {
                return (
                  selectedItem.menu_id 
              );
              }
              
             
          });
          


        
            if(item.is_limited =="no"){
              return menuRecord;
             
            } else {
             var menuRecordNoLimited =  !menuRecord || (item.is_limited === "yes" &&  item.limited_count > 0 && menuRecord.menu_id._id.toString() === item._id.toString() &&
                menuRecord.menu_id.category_id.toString() === item.category_id.toString());
             //  console.log("menuRecordNoLimited",menuRecordNoLimited)
            return menuRecordNoLimited;
            
            }
      

            
          });
          

          const filteredResults2 = filteredResults.filter(item => {

            
            
            if(item.is_limited == "yes"){


                 // console.log("selectedMenuItems2",selectedMenuItems2)
                  
                   
                    // Check if the item's category ID matches any of the category IDs of selected items
                    const hasMatchingCategory = selectedMenuItems2.some(selectedItem => {
                      console.log("limited count",selectedItem.menu_id.limited_count)
                      console.log("menu name",selectedItem.menu_id.name)
                    
                     
                      return selectedItem.menu_id.category_id.toString() === item.category_id.toString() && selectedItem.menu_id._id.toString() !== item._id.toString();
                      
                  });
               
                   // If there is a matching category, exclude the item
                   return !hasMatchingCategory;
                  
              
                
                   
            } else {
              return item;
            }
           
        });
        if(filteredResults2.length > 0){
          var  filteredData = filteredResults2.filter(item => {
            if (item.is_limited === "yes") {
              return item.limited_count > 0;
            } else {
              return item.limited_count === 0;
            }
          });
        } else {
          var filteredData = [];
        }
       

      
      
        
        
  

       //  console.log("selectedMenuItems2",selectedMenuItems2)
       //   console.log("filteredResults2",filteredResults2)
     
          
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredData;
        } else {

          console.log("cover charge enabled");
  
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
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return menuRecord;
          });

          console.log("filteredResults",filteredResults);
          console.log("filteredResults2",filteredResults2);
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        }
      } else {
         
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
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
        
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      }
      

      
   
   

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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.get_menu_by_event_id_for_entry_food_event = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(event_id),
          total_stock: { $gt: 0 },
          "status" : "active"  
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

      if (event.status == "expired") {
        return  res.status(200).send({
          status: false,
          message: "Event is expired",
          data: null,
        });
      }

   
         
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
      
          }).populate('menu_id');


  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return menuRecord;
          });
          
        
  
           const selectedMenuItems2dd = await BookingMenu.find().populate('menu_id');

       
        const result = await BookingMenu.aggregate([
          {
            $lookup: {
              from: 'bookingpayments',
              localField: 'payment_id',
              foreignField: '_id',
              as: 'bookingPayment'
            }
          },
          {
            $lookup: {
              from: 'menus',
              localField: 'menu_id',
              foreignField: '_id',
              as: 'menu'
            }
          },
          {
            $match: {
              'bookingPayment.status': 'active',
            },
          }
        ]);

        console.log("result",result)
        
        // Extracting payment IDs
        const paymentIds = result.map(item => item.payment_id);
        
        // Now perform a find query to populate 'menu_id'
        const selectedMenuItems2 = await BookingMenu.find({ payment_id: { $in: paymentIds } }).populate('menu_id');
        
        

           console.log("selectedMenuItems2",selectedMenuItems2)
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2old = selectedMenuItems2.filter(item => {
            const menuRecord = selectedMenuItems2.find((selectedItem) => {
                            
              return (
                selectedItem.menu_id
              );
            });
  
             return menuRecord;
          });


           // Create a Set to store unique menu _id values
            const uniqueMenuIdsSet = new Set();

            // Iterate through selectedMenuItems2 and add unique _id values to the Set
            selectedMenuItems2.forEach(item => {
                uniqueMenuIdsSet.add(item.menu_id._id.toString());
            });

            // Create an array to store unique menu items
            const uniqueMenuItems = [];

            // Iterate through selectedMenuItems2 and add unique menu items to the array
            selectedMenuItems2.forEach(item => {
                if (uniqueMenuIdsSet.has(item.menu_id._id.toString())) {
                    uniqueMenuItems.push(item.menu_id);
                    // Remove the id from the set to avoid duplicates
                    uniqueMenuIdsSet.delete(item.menu_id._id.toString());
                }
            });


          // Construct the filtered result object
       //    console.log("uniqueMenuItems",uniqueMenuItems);


       console.log("filteredResults",filteredResults)
         
  
        //  var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : uniqueMenuItems;

        var finalResponse = menuResults;
  
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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.get_menu_by_event_id_main_branch_code_before_23_jan = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

   

   

      var is_cover_charge_added = event.is_cover_charge_added;
     console.log("is_cover_charge_added",is_cover_charge_added)
      console.log("event",event);
      var event_type = event.type;
      if(event_type == "food_event"){
        if(is_cover_charge_added == "no"){
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              console.log("s",selectedItem.menu_id.is_limited)
              var is_limited = selectedItem.menu_id.is_limited;
              if(is_limited == 'yes'){
                return (
                  selectedItem.menu_id &&
                  selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                );
              } else {
                return (
                  selectedItem.menu_id 
                );
              }
             
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
  
       
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
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
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
        } else {
  
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

          console.log("filteredResults",selectedMenuItems)

         
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });

          console.log("filteredResults",filteredResults)


          // get approved bookings 
  
  
          const selectedMenuItems2old = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');


          const selectedApprovedBooking = await BookedMenuItem.aggregate([
            
            {
              $lookup: {
                from: 'menuitempayments',  // Replace with the actual collection name for BookingPayment
                localField: '_id',  // Replace with the actual field name in BookingMenu schema
                foreignField: 'payment_id',  // Replace with the actual field name in BookingPayment schema
                as: 'menuitempayments',
              },
            },

            {
              $match: {
                "menuitempayments.is_approved": "yes",
                guest_id: guest_id,
                event_id: event_id,
              },
            },
          ]);


          //console.log("selectedApprovedBooking",selectedApprovedBooking);
         // return false;
         
        
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedApprovedBooking.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedApprovedBooking.length == 0) ? filteredResults : filteredResults2;
  
        }
      } else if(event_type == "loyalty") {
        
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

          console.log("selectedMenuItems",selectedMenuItems);
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
          console.log("filteredResults",filteredResults)
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      } 
        else if(event_type == "entry_food_event") {
          console.log("event_type",event_type)
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

          
          console.log("selectedMenuItems",selectedMenuItems)

         // return false;
  
          // Filter menu items based on the selected 
          const filteredResultsold = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              //console.log("id",selectedItem.menu_id);
              
            });

    
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });

          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
         console.log("filteredResults",filteredResults);

        // return false;

         // get approved bookings
  
          const selectedMenuItems2 = await BookingMenu.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');

          console.log("selectedMenuItems2",selectedMenuItems2)
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = selectedMenuItems.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      }else  {
        console.log("event_type",event_type)
        // Fetch all menu items selected by the guest
        const selectedMenuItems = await MenuItem.find({
          guest_id: guest_id,
          event_id: event_id,
          quantity: { $gt: 0 },
        }).populate('menu_id');

        
        console.log("selectedMenuItems",selectedMenuItems)

        // Filter menu items based on the selected 
        const filteredResults = menuResults.filter(item => {
          const menuRecord = selectedMenuItems.find(selectedItem => {
            return (
              selectedItem.menu_id 
            );
          });

          return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
        });
        
       console.log("filteredResults",filteredResults);

      // return false;

        const selectedMenuItems2 = await BookingMenu.find({
          guest_id: guest_id,
          event_id: event_id,
        }).populate('menu_id');

        console.log("selectedMenuItems2",selectedMenuItems2)



        // Filter menu items based on the selected limited item's category
        const filteredResults2 = filteredResults.filter(item => {
          const menuRecord = selectedMenuItems2.find(selectedItem => {
            return (
              selectedItem.menu_id 
            );
          });

          return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
        });

        var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;

      
    }
      
      

      
   
   

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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};


exports.get_menu_by_event_id_trail = async (req, res) => {

  const event_id = req.params.id;
  const guest_id = req.params.guest_id;
     // Check if the event exists
     const event = await EventModel.findById(event_id);
     if (!event) {
       return res.status(404).send({
         status: false,
         message: "Event not found",
         data: null,
       });
     }

  try {

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

      var is_cover_charge_added = event.is_cover_charge_added;
     console.log("is_cover_charge_added",is_cover_charge_added)
     // console.log("event",event);
   
      var event_type = event.type;
      if(event_type == "food_event"){
        if(is_cover_charge_added == "no"){
          // Fetch all menu items selected by the guest
     
          await Promise.all(menuResults.map(async (item) => {
            var menuRecord = await Menu.findById(item._id);
      
            var menu_id = item._id;
            if(menuRecord.is_limited == "no"){
              const existingMenuItem = await MenuItem.findOne({
                menu_id: menu_id,
                guest_id: guest_id,
                event_id: event_id,
              });
              
              // If no matching document is found, create a new one
              if (!existingMenuItem) {

                // add record of event menu of is_limited no

                const newMenuItem = new MenuItem({
                  menu_id: menu_id,
                  guest_id: guest_id,
                  event_id: event_id,
                  quantity: 1,
                });
                await newMenuItem.save();
              }
            }
             
          }));


          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
           quantity: { $gt: 0 },
          }).populate('menu_id');

          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
           
              var is_limited = selectedItem.menu_id.is_limited;

            //  console.log("selectedItem",selectedItem.menu_id)
              
           
              if(is_limited == 'yes'){
                return (
                  selectedItem.menu_id &&
                  selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                );
              } /*else {
               
                return selectedItem.menu_id 
                
              }*/
             
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });

          console.log("filteredResults",filteredResults);
          //return false;
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');

              /*  const selectedMenuItems22 = await BookedMenuItem.aggregate([
                  
                  {
                    $lookup: {
                      from: 'menuitempayments',  // Replace with the actual collection name for BookingPayment
                      localField: '_id',  // Replace with the actual field name in BookingMenu schema
                      foreignField: 'payment_id',  // Replace with the actual field name in BookingPayment schema
                      as: 'menuitempayments',
                    },
                  },

                  {
                    $match: {
                      "menuitempayments.is_approved": "yes",
                      guest_id: guest_id,
                      event_id: event_id,
                    },
                  },
                ]).populate('menu_id');


                // Extract the _id values from the aggregation result
              const menuItemIds = selectedMenuItems22.map(item => item._id);

              // Use the `populate` method on the model to populate the referenced documents
              const populatedMenuItems = await BookedMenuItem.find({ _id: { $in: menuItemIds } }).populate('menu_id');*/


  
          // Filter menu items based on the selected limited item's category

                

         const filteredResults2 = await Promise.all(filteredResults.map(async (item) => {
            const menuRecord = await Promise.all(selectedMenuItems2.map(async (selectedItem) => {
              const isLimited = item.is_limited;
              console.log("isLimited", isLimited);
          
              console.log("selectedItem", selectedItem);
          
              const paymentId = selectedItem.payment_id;
              const paymentRecord = await MenuItemPayments.findById(paymentId);
          
             console.log("paymentRecord", paymentRecord);
          
              if (isLimited == "yes") {
                if(paymentRecord.is_approved == "yes"){
                  return (
                    selectedItem.menu_id &&
                    selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                  );
                }
               
              }
          
              return true; // Replace with your additional conditions or logic
            }));

            console.log("menuRecord",menuRecord);
            
            if (menuRecord) {
              console.log(menuRecord);
              return !menuRecord.some(record => record) || 
              (menuRecord.menu_id._id.toString() === item._id.toString());
            }
            
          }));         



          
          const filteredResults2old = await Promise.all(filteredResults.map(async (item) => {
            const menuRecord = await Promise.all(selectedMenuItems2.map(async (selectedItem) => {
              const isLimited = item.is_limited;
              console.log("isLimited", isLimited);
          
              console.log("selectedItem", selectedItem);
          
              const paymentId = selectedItem.payment_id;
              const paymentRecord = await MenuItemPayments.findById(paymentId);
          
              console.log("paymentRecord", paymentRecord);
          
              if (isLimited == "yes" && paymentRecord && paymentRecord.is_approved == "yes") {
                const menuId = selectedItem.menu_id;
          
                if (menuId && menuId.category_id && menuId.category_id.toString() === item.category_id.toString()) {
                  return {
                    menu_id: menuId, // or whatever menu_id structure you have
                  };
                }
              }
          
              return null; // Replace with your additional conditions or logic
            }));
          
            console.log("menuRecord", menuRecord);
          
            // Check if menuRecord is not undefined and has at least one truthy value
            if (menuRecord && menuRecord.some(record => record)) {
              // Find the first truthy value in menuRecord and compare its menu_id with item._id
              const matchingRecord = menuRecord.find(record => record);
              if (matchingRecord && matchingRecord.menu_id && matchingRecord.menu_id._id && matchingRecord.menu_id._id.toString() === item._id.toString()) {
                return matchingRecord.menu_id;
              }
            }
          
            //return ;
          }));
          
          
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
        } else {
  
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

          console.log("filteredResults",selectedMenuItems)

         
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() == item._id.toString());
          });

          console.log("filteredResults",filteredResults)


          // get approved bookings 
  
  
          const selectedMenuItems2old = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');


          const selectedApprovedBooking = await BookedMenuItem.aggregate([
            
            {
              $lookup: {
                from: 'menuitempayments',  // Replace with the actual collection name for BookingPayment
                localField: '_id',  // Replace with the actual field name in BookingMenu schema
                foreignField: 'payment_id',  // Replace with the actual field name in BookingPayment schema
                as: 'menuitempayments',
              },
            },

            {
              $match: {
                "menuitempayments.is_approved": "yes",
                guest_id: guest_id,
                event_id: event_id,
              },
            },
          ]);


          //console.log("selectedApprovedBooking",selectedApprovedBooking);
         // return false;
         
        
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedApprovedBooking.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedApprovedBooking.length == 0) ? filteredResults : filteredResults2;
  
        }
      }  
        else if(event_type == "entry_food_event") {
          console.log("event_type",event_type)
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');

  
  
          // Filter menu items based on the selected 
          const filteredResultsold = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              //console.log("id",selectedItem.menu_id);
              
            });

    
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });

          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
         console.log("filteredResults",filteredResults);

        // return false;

         // get approved bookings
  
          const selectedMenuItems2 = await BookingMenu.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');

          console.log("selectedMenuItems2",selectedMenuItems2)
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = selectedMenuItems.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      }else  {
        console.log("event_type",event_type)
        // Fetch all menu items selected by the guest
        const selectedMenuItems = await MenuItem.find({
          guest_id: guest_id,
          event_id: event_id,
          quantity: { $gt: 0 },
        }).populate('menu_id');

        
        console.log("selectedMenuItems",selectedMenuItems)

        // Filter menu items based on the selected 
        const filteredResults = menuResults.filter(item => {
          const menuRecord = selectedMenuItems.find(selectedItem => {
            return (
              selectedItem.menu_id 
            );
          });

          return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
        });
        
       console.log("filteredResults",filteredResults);

      // return false;

        const selectedMenuItems2 = await BookingMenu.find({
          guest_id: guest_id,
          event_id: event_id,
        }).populate('menu_id');

        console.log("selectedMenuItems2",selectedMenuItems2)



        // Filter menu items based on the selected limited item's category
        const filteredResults2 = filteredResults.filter(item => {
          const menuRecord = selectedMenuItems2.find(selectedItem => {
            return (
              selectedItem.menu_id 
            );
          });

          return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
        });

        var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;

      
    }
      
      

      
   
   

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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.get_menu_by_event_id_before_entry_food_event = async (req, res) => {
  try {
    const event_id = req.params.id;
    const guest_id = req.params.guest_id;

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

   

   

      var is_cover_charge_added = event.is_cover_charge_added;
      console.log("is_cover_charge_added",is_cover_charge_added)
      console.log("event",event);
      if(event.type == "food_event"){
        if(is_cover_charge_added == "no"){
          // Fetch all menu items selected by the guest
          const selectedMenuItems = await MenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
            quantity: { $gt: 0 },
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults = menuResults.filter(item => {
            const menuRecord = selectedMenuItems.find(selectedItem => {
              console.log("s",selectedItem.menu_id.is_limited)
              var is_limited = selectedItem.menu_id.is_limited;
              if(is_limited == 'yes'){
                return (
                  selectedItem.menu_id &&
                  selectedItem.menu_id.category_id.toString() === item.category_id.toString()
                );
              } else {
                return (
                  selectedItem.menu_id 
                );
              }
             
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
  
       
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
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
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
        } else {
  
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
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        }
      } else {
          console.log("inside this")
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
  
            return !menuRecord || ( menuRecord.menu_id._id.toString() === item._id.toString());
          });
          
          console.log("filteredResults",filteredResults)
  
          const selectedMenuItems2 = await BookedMenuItem.find({
            guest_id: guest_id,
            event_id: event_id,
          }).populate('menu_id');
  
  
  
          // Filter menu items based on the selected limited item's category
          const filteredResults2 = filteredResults.filter(item => {
            const menuRecord = selectedMenuItems2.find(selectedItem => {
              return (
                selectedItem.menu_id 
              );
            });
  
            return !menuRecord || (menuRecord.menu_id._id.toString() === item._id.toString());
          });
  
          var finalResponse = (selectedMenuItems2.length == 0) ? filteredResults : filteredResults2;
  
        
      }
      

      
   
   

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
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};



exports.get_menu_by_event_id_3_weeks_ago = async (req, res) => {
  try {
    var event_id = req.params.id;
    var guest_id = req.params.guest_id;

    const menuResults = await Menu.aggregate([
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

    const filteredResults = await Promise.all(
      menuResults.map(async (item) => {
        var menu_item_record = await MenuItem.find({
          "menu_id": item._id,
          'guest_id': guest_id,
          'event_id': event_id,
          'quantity': { $gt: 0 }
        });

               
        if (menu_item_record.length > 0) {
          var menu_record = await Menu.findById(menu_item_record[0].menu_id);
          if (item.category_id.toString() == menu_record.category_id.toString()) {
            if(item.is_limited == "yes"){
              // Filter out other menu items with the same category_id
              const filteredMenuList = menuResults.filter((item2) => item2.category_id === item.category_id);
              const filteredMenuList2 = menuResults.filter((item2) => item2.category_id !== item.category_id);
              const filteredMenuList3 = filteredMenuList2.filter((item2) => item2.category_id.toString() !== filteredMenuList[0].category_id.toString());
              return [...filteredMenuList,...filteredMenuList3];
            }           
          }
        } else {
          return null;
        }
      })
    ); 

   var finalResult = filteredResults.filter(item => item !== null);

    if (menuResults.length > 0) {        
       return  res.status(200).send({
          status: true,
          message: "Data found",
          data: (finalResult.length > 0) ? finalResult[0] : menuResults,
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
        .then(async(result) => {
          if (result) {

            req.body.menu_id = result._id;

            // add menu item record

            await MenuItemRecord(req.body).save();


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
        var menuItem = await MenuItem.findOneAndUpdate(
          { menu_id, guest_id  , event_id },
          { quantity:  0  }, // Increment quantity by the specified value
          { new: true, upsert: true } // This option returns the updated document and creates a new one if not found
        );
        res.status(200).send({ status: false, message: "Quantity should be greater than 1", data: [] });
        return;
      }

      // Assuming MenuItem is a mongoose model
      var menuItem = await MenuItem.findOneAndUpdate(
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
    console.log("result",result);
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
            const { _id, event_id, guest_id, menu_id, quantity } = menuItem;
    
            if (!_id || !event_id || !guest_id || !menu_id || !quantity) {
              return { status: false, message: "_id, event_id, guest_id,menu_id, quantity  missing", data: null };
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
            const { _id, event_id, guest_id, menu_id, quantity } = menuItem;
    
            if (!_id || !event_id || !guest_id || !menu_id || !quantity) {
              return { status: false, message: "_id, event_id, guest_id,menu_id, or quantity missing", data: null };
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

    } else if(event_record.type == "entry_food_event"){
      console.log("here");
      const paymentData = {
        payment_status: 'paid',
       
      };
  
      const paymentResult = await BookingPayments(paymentData).save();
  
      const payment_id = paymentResult._id;




      for (let i = 0; i < menuItems.length; i += batchSize) {
        const batch = menuItems.slice(i, i + batchSize);
  
        const batchResults = await Promise.all(batch.map(async (menuItem) => {
          const { _id, event_id, guest_id, menu_id, quantity } = menuItem;
  
          if (!_id || !event_id || !guest_id || !menu_id || !quantity) {
            return { status: false, message: "_id, event_id, guest_id,menu_id, quantity  missing", data: null };
          }
  
          const menuRecord = await Menu.findById(menu_id);
  
          if (!menuRecord) {
            return { status: false, message: "Menu not found", data: null };
          }
          var menu_item_id = _id;

          var bookingMenuData = await BookingMenu.find({"event_id":event_id,"guest_id":guest_id,"menu_id":menu_id});

          
          var booking_id = bookingMenuData[0].booking_id;
     
  
          const bookingData = {
            booking_id,
            event_id,
            guest_id,
            menu_id,
            quantity,
            payment_id,
          };  

        
  
          const result = await BookingMenu(bookingData).save();
  
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

      const bookedMenuResult = await BookingMenu.find({ payment_id: payment_id });
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

          await BookingPayments.findByIdAndUpdate(payment_id, { $set: { amount: sum } });


        // Delete records from the menuItems model
        const deleteConditions = {
          event_id: { $in: results.map(item => item.event_id) },
          menu_id: { $in: results.map(item => item.menu_id) },
          guest_id: { $in: results.map(item => item.guest_id) },
        };
    
        await MenuItem.deleteMany(deleteConditions);
        res.status(200).send({ status: true, message: "Item booked successfully", data : { payment_id: payment_id,booked_data: results} });
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

      console.log("payment_id",payment_id);

      var entryFoodBookedMenuData = await BookingMenu.find({"payment_id":payment_id});

      console.log("entryFoodBookedMenuData",entryFoodBookedMenuData)

      if(entryFoodBookedMenuData.length > 0){


       

        const guest_id = entryFoodBookedMenuData[0].guest_id;
        const event_id = entryFoodBookedMenuData[0].event_id;

        const paymentData = await BookingPayments.findById(payment_id);


    
        

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
        if(eventRecord.type == "entry_food_event"){
            var sum = 0;
            for (const item of entryFoodBookedMenuData) {
              if (item && typeof item.quantity === 'number' && item.quantity > 0) {
                const menu_id = item.menu_id;
                const menuRecord = await Menu.findById(menu_id);

                if (menuRecord) {
                  sum += menuRecord.selling_price * item.quantity;
                }
              }
            }

    
        }
        

        // Approve menu item payments
        const result = entryFoodBookedMenuData.map(item1 => {
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

        console.log("result",result);
        if (result.length > 0) {
          console.log("result");
          res.status(200).send({ status: true, message: "Data found", data: { total_selling_price: sum, menu_list: result } });
        } else {
          res.status(200).send({ status: true, message: "No Data found", data: [] });
        }

      } else {
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
            if (result.length > 0) {
              console.log("result");
              res.status(200).send({ status: true, message: "Data found", data: { total_selling_price: sum, menu_list: result } });
            } else {
              res.status(200).send({ status: true, message: "No Data found", data: [] });
            }
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

      var entryFoodBookedMenuData = await BookingMenu.find({"payment_id":payment_id});

      if(entryFoodBookedMenuData.length > 0){


        const guest_id = entryFoodBookedMenuData[0].guest_id;
        const event_id = entryFoodBookedMenuData[0].event_id;

        // Fetch relevant data from MenuItem collection based on guest_id and event_id
        const menuItemResult = await MenuItem.aggregate([
          {
            $match: {
              guest_id: new mongoose.Types.ObjectId(guest_id),
              event_id: new mongoose.Types.ObjectId(event_id),
            },
          },
        ]);
        // Fetch cover charge from the event record
        const eventRecord = await EventModel.findById(event_id);
        // Check if cover charge exceeds the sum of menu item prices
        let sum = 0;
        for (const item of entryFoodBookedMenuData) {

          if (item && typeof item.quantity === 'number' && item.quantity > 0) {
            const menu_id = item.menu_id;
            const menuRecord = await Menu.findById(menu_id);
        
            // Update total stock in Menu collection
            const newTotalStock = menuRecord.total_stock - item.quantity;

            const newCount = menuRecord.limited_count - item.quantity;
        
            await Menu.findByIdAndUpdate(menu_id, { $set: { total_stock: newTotalStock } });
            
            // await Menu.findByIdAndUpdate(menu_id, { $set: { limited_count: newCount } });
            
            

            if (menuRecord) {
              sum += menuRecord.selling_price * item.quantity;
            }
          }
        }


  
     





      if(eventRecord.type == "entry_food_event"){
        

          await BookingPayments.findByIdAndUpdate(payment_id, { $set: { amount: sum ,is_consumed: 'yes'} });

        
      }
      
     

     // Approve menu item payments in BookingPayments collection
      var updatedPaymentResult = await BookingPayments.findOneAndUpdate(
        { _id: payment_id },
        { validator_id: validator_id, status: 'active' },
        { new: true }
      );

          // Check if the result is not null
      if (updatedPaymentResult) {
        // Now, explicitly set guest_id in the updatedPaymentResult
        updatedPaymentResult = updatedPaymentResult.toObject(); // Convert to a plain JavaScript object
        updatedPaymentResult.guest_id = guest_id;
      }



      res.status(200).send({
        status: true,
        message: "Payment approved successfully",
        data: { updatedPaymentResult, remainingCoverCharge: 0 },
      });











      } else {
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
      // Fetch cover charge from the event record
      const eventRecord = await EventModel.findById(event_id);
      // Check if cover charge exceeds the sum of menu item prices
      let sum = 0;
      for (const item of bookedMenuResult) {

        if (item && typeof item.quantity === 'number' && item.quantity > 0) {
          const menu_id = item.menu_id;
          const menuRecord = await Menu.findById(menu_id);
       
           // Update total stock in Menu collection
           const newTotalStock = menuRecord.total_stock - item.quantity;

           const newCount = menuRecord.limited_count - item.quantity;
       
           await Menu.findByIdAndUpdate(menu_id, { $set: { total_stock: newTotalStock } });
           if(eventRecord.is_cover_charge_added == "no"){
            await Menu.findByIdAndUpdate(menu_id, { $set: { limited_count: newCount } });
           }
           

          if (menuRecord) {
            sum += menuRecord.selling_price * item.quantity;
          }
        }
      }

   

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



      res.status(200).send({
        status: true,
        message: "Payment approved successfully",
        data: { updatedPaymentResult, remainingCoverCharge: total_coupon_balance-sum },
      });



      }

    

          





  
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


exports.getBookingDetailByPaymentId = async (req, res) => {
  var payment_id = req.query.payment_id;


  if (!payment_id) {
    res.status(400).json({
      status: false,
      message: "payment ID is required in the request body",
    });
  } else {
    try {
      const pipeline = [
        {
          $lookup: {
            from: "bookingpayments",
            localField: "payment_id",
            foreignField: "_id",
            as: "payment_data",
          },
        },
        {
          $match: {
            payment_id: new mongoose.Types.ObjectId(payment_id),
            "payment_data.payment_mode": { $nin: ["upi"] },
          },
        },
        {
          $lookup: {
            from: "guests",
            localField: "guest_id",
            foreignField: "user_id",
            as: "guest_data",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "guest_data.user_id",
            foreignField: "_id",
            as: "user_data",
          },
        },
        
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "$payment_id",
            data: { $first: "$$ROOT" }
          }
        }
      ];

      BookingMenu.aggregate(pipeline)
        .then(async(result) => {
          console.log("result", result);
          var all_data = [];
          if (result && result.length > 0) {
            const booking = result[0].data; // Since we are grouping by payment_id and using $first, we can directly access the first element

            const guestRecord = booking.guest_data[0]; // Extract the first element from guest_data array
            guestRecord.contact_number = booking.user_data[0].code_phone;

            var event_record = await EventModel.findById(booking.event_id); 

            all_data.push({
              "guest_data": { ...guestRecord, contact_number: booking.user_data[0].code_phone },
              "booking_data": {
                _id: booking._id,
                event_id: booking.event_id,
                event_type: event_record.type,
                guest_id: booking.guest_id,
                payment_mode: booking.payment_data[0].payment_mode,
                status: booking.payment_data[0].status,
                transaction_id: booking.payment_data[0].transaction_id,
                amount: booking.payment_data[0].amount,
                createdAt: booking.createdAt,
                updatedAt: booking.updatedAt,
                __v: booking.__v,
              },
            });

            res.status(200).json({
              status: true,
              message: "Entry Food found",
              data: all_data,
            });
          } else {
            res.status(404).json({
              status: false,
              message: "No data found",
              data: [],
            });
          }
        })
        .catch((error) => {
          console.log("error", error);
          res.status(500).json({
            status: false,
            message: error.toString() || "Internal Server Error",
          });
        });
    } catch (error) {
      console.log("error", error);
      res.status(500).json({
        status: false,
        message: error.toString() || "Internal Server Error",
      });
    }
  }
};



exports.get_event_menu_list = async (req, res) => {
  try {
    const event_id = req.query.event_id;
    console.log("event_id",event_id)

    // Fetch all menu items
    const menuResults = await Menu.aggregate([
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
          total_stock: 1,
          cost_price: 1,
          selling_price: 1,
          uom: "$uom_data.name",
          category: "$category_data.name",
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);


      // Check if the event exists
      const event = await EventModel.findById(event_id);
      
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

  
    if (menuResults.length > 0) {
        for(var item of menuResults){
          const result = await ValidatorQuantity.aggregate([
           
           {
             $lookup: {
               from: 'menus',
               localField: 'menu_id',
               foreignField: 'menu_id',
               as: 'menu'
             }
           },
            
          {
            $match: {  'menu_id' :  new mongoose.Types.ObjectId(item._id)  }
          },
          
         ]);

         console.log("result",result);
         
         var total_quantity = (result.length > 0) ? result[0].quantity :0;
           // Assign the total consumed quantity to the current menu item
         item.total_consumed_quantity = total_quantity;
         } 
        
      


      

      return res.status(200).send({
        status: true,
        message: "Data found",
        data: menuResults,
      });
    } else {
      res.status(200).send({
        status: true,
        message: "No data found",
        data: [],
      });
    }
  } catch (error) {
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};


exports.update_consumed_menu_quantity = async (req, res) => {
  try {
    const validator_id = req.body.validator_id;
    const event_id = req.body.event_id;
    const menu_id = req.body.menu_id;
    var quantity = req.body.quantity;


    

      // Check if the event exists
      const event = await EventModel.findById(event_id);
      
      if (!event) {
        return res.status(404).send({
          status: false,
          message: "Event not found",
          data: null,
        });
      }

      const filter = {
        menu_id: new mongoose.Types.ObjectId(menu_id),
        event_id : new mongoose.Types.ObjectId(event_id),
      };
        // Update operation
    const updateOperation = {
      $set: {
        quantity: quantity
      }
    };

    // Update the documents that match the filter
    var result =   await ValidatorQuantity.findOneAndUpdate(filter, updateOperation, { new: true , upsert: true });

    
    if (result) {
      
     

      

      return res.status(200).send({
        status: true,
        message: "Quantity updated succesfully",
        data: result,
      });
    } else {
      res.status(200).send({
        status: true,
        message: "Failed ! Please try again",
        data: null,
      });
    }
  } catch (error) {
    console.log("error",error)
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
      data: null,
    });
  }
};



