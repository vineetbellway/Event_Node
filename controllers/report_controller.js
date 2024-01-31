
const OrderItem = require("../models/order_item.model");
const mongoose = require("mongoose");
const EventModel = require("../models/event.model");
const Seller = require("../models/seller.model");
const Category = require("../models/category.model"); 
const Booking = require("../models/booking.model");
const BookedMenuItem = require("../models/booked_menu_item.model");
const BookingMenu = require("../models/booking_menu.model");



exports.get_item_sales_report = async (req, res) => {
    try {
        const eventId = req.query.event_id;

        console.log("eventId",eventId)

        // Find the event by eventId
        const event = await EventModel.findById(eventId);

        if (!event) {
            return res.status(200).json({ status: false, message: 'Event not found' , data :null });
          }
    
        // Perform aggregation to calculate item sales report
        const itemSalesReport = await BookedMenuItem.aggregate([
          
          
          {
            $lookup: {
              from: 'menuitempayments',
              localField: 'payment_id',
              foreignField: '_id',
              as: 'menu_item_payment_data',
            },
          },
          {
            $match: { "menu_item_payment_data.is_approved": "yes" ,  event_id: new mongoose.Types.ObjectId(eventId) }
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
            $unwind: '$menu'
          },
          {
            $group: {
              _id: {
                menuName: '$menu.name',
                category: '$menu.category_id'
              },
              consumedQuantity: { $sum: '$quantity' },
              payment_data: { $push: '$menu_item_payment_data' },
            }
          },
          {
            $project: {
              _id: 0,
              itemName: '$_id.menuName',
              category: '$_id.category',
              consumedQuantity: 1,
              payment_data: 1,
            }
          }
        ]);
  
        if(itemSalesReport.length > 0){
            var allData = [];
            for(var item of itemSalesReport){
               var categoryData =  await Category.findById(item.category);
                  allData.push({ 
                    "category": categoryData.name,
                    "consumedQuantity": item.consumedQuantity,
                    "itemName": item.itemName
                });
            }
            res.json({ status: true, message : "Data found",  data: allData });
        } else {
            res.json({ status: false, message : "No data found",  data: [] });
        }
    
        
      } catch (err) {
        res.status(500).send({
            status: false,
            message: err.toString() || "Internal Server Error",
            data: null,
        });
      }
};

exports.get_number_of_guests_for_event = async (req, res) => {
    try {
        const eventId = req.query.event_id;

    
    
        // Find the event by eventId
        const event = await EventModel.findById(eventId);
    
        if (!event) {
          return res.status(200).json({ status: false, message: 'Event not found' , data :null });
        }
    
        // Calculate the number of guests attending the event
        const numberOfGuests = await Booking.aggregate([
          {
            $match: { event_id: new mongoose.Types.ObjectId(eventId),  status: 'active' }
          },
          {
            $group: {
              _id: '$guest_id',
              totalGuests: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: null,
              totalGuests: { $sum: '$totalGuests' }
            }
          }
        ]);
        
        const totalGuests = numberOfGuests.length > 0 ? numberOfGuests[0].totalGuests : 0;
    
        res.json({ status: true, message : "Data found", data : [{ event: event.name, numberOfGuests: totalGuests }] });
      } catch (err) {
        res.status(500).send({
            status: false,
            message: err.toString() || "Internal Server Error",
            data: null,
        });
      }
};


exports.get_repeated_guests_for_seller_attending_events = async (req, res) => {
    try {
        const sellerId = req.query.seller_id;
    
        // Find events created by the seller
        const sellerEvents = await EventModel.find({ seller_id: sellerId }, '_id');
    
        if (sellerEvents.length === 0) {
          return res.json({ status: false, message: 'No events found for the seller',data:[] });
        }
    
        // Get event IDs associated with the seller's events
        const eventIds = sellerEvents.map(event => event._id);
    
        // Calculate guests who attend multiple events created by the seller
        const repeatedGuests = await Booking.aggregate([
          {
            $match: { event_id: { $in: eventIds } }
          },
          {
            $group: {
              _id: '$guest_id',
              eventsAttended: { $addToSet: '$event_id' },
              totalEventsAttended: { $sum: 1 }
            }
          },
          {
            $match: { totalEventsAttended: { $gt: 1 } } // Filter guests who attended more than one event
          },
          {
            $project: {
              _id: 1,
              totalEventsAttended: 1,
              eventsAttended: 1
            }
          }
        ]);
        if(repeatedGuests.length > 0){
            res.json({ status: true, message: 'Data found', repeatedGuests });
        } else {
            res.json({ status: false, message: 'No data found', repeatedGuests });
        }
        
      } catch (err) {
        res.status(500).send({
            status: false,
            message: err.toString() || "Internal Server Error",
            data: null,
        });
      }
};

exports.get_number_of_guests_for_seller = async (req, res) => {
    try {
        const sellerId = req.query.seller_id;
    
        // Find the seller by sellerId
        const seller = await Seller.findOne({ user_id: sellerId });
    
        if (!seller) {
          return res.status(200).json({ status: false, message: 'Seller not found',data: null });
        }
        
        // Find all events created by the seller
        const sellerEvents = await EventModel.find({ seller_id: sellerId });
      
    
        if (sellerEvents.length == 0) {
          return res.json({ status: false,message: 'Seller events not found', data :[{seller: seller.company_name, numberOfGuests: 0}] });
        }
    
        // Get event IDs associated with the seller's events
        const eventIds = sellerEvents.map(event => event._id);

        console.log("eventIds",eventIds)
    
        // Calculate the number of guests attending all events by the seller
        const numberOfGuests = await Booking.aggregate([
          {
            $match: { event_id: { $in: eventIds } }
          },
          {
            $group: {
              _id: '$guest_id'
            }
          },
          {
            $group: {
              _id: null,
              totalGuests: { $sum: 1 }
            }
          }
        ]);
    
        const totalGuests = numberOfGuests.length > 0 ? numberOfGuests[0].totalGuests : 0;
    
        res.json({ status: true,message: 'Data found', data : [{seller: seller.company_name, numberOfGuests: totalGuests}] });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
};

exports.fns_moving_item_report = async (req, res) => {
  try {
      const eventId = req.query.event_id;
      const type  = req.query.type;

   

      // Find the event by eventId
      const event = await EventModel.findById(eventId);


      if (!event) {
          return res.status(200).json({ status: false, message: 'Event not found' , data :null });
      }

      if(event.type="food_event"){
          // Perform aggregation to calculate fns report
          var fnsMovingItemsReport = await BookedMenuItem.aggregate([
            {
              $lookup: {
                from: 'menuitempayments',
                localField: 'payment_id',
                foreignField: '_id',
                as: 'menu_item_payment_data',
              },
            },
            {
              $match: { "menu_item_payment_data.is_approved": "yes", event_id: new mongoose.Types.ObjectId(eventId) }
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
              $unwind: '$menu'
            },
            {
              $group: {
                _id: {
                  menuName: '$menu.name',
                },
                consumedQuantityNew: { $sum: 1 }, // Rename the field here
              }
            },
            {
              $project: {
                _id: 0,
                itemName: '$_id.menuName',
                consumedQuantity: '$consumedQuantityNew', // Rename the field here
              }
            },
            {
              $sort: { consumedQuantity: type === "most" ? -1 : 1 } // Sort by consumedQuantity based on the type
            }
          ]);
          
          
          

      } else {
         // Perform aggregation to calculate fns report
          var fnsMovingItemsReport = await BookingMenu.aggregate([
        
            
            {
              $lookup: {
                from: 'bookingpayments',
                localField: 'payment_id',
                foreignField: '_id',
                as: 'menu_item_payment_data',
              },
            },
            {
              $match: { "menu_item_payment_data.status": "active" ,  event_id: new mongoose.Types.ObjectId(eventId) }
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
              $unwind: '$menu'
            },
            {
              $group: {
                _id: {
                  menuName: '$menu.name',
                },
                consumedQuantity: { $sum: '$quantity' },
                payment_data: { $push: '$menu_item_payment_data' },
              }
            },
            {
              $project: {
                _id: 0,
                itemName: '$_id.menuName',
                category: '$_id.category',
                consumedQuantity: 1,
                payment_data: 1,
              }
            },
            {
              $sort: { consumedQuantity: type === "most" ? -1 : 1 } // Sort by consumedQuantity based on the type
            }
          ]);
      }


  
     

      console.log("fnsMovingItemsReport",fnsMovingItemsReport)

      if(fnsMovingItemsReport.length > 0){
          var allData = [];
          for(var item of fnsMovingItemsReport){
            console.log("item",item)
                allData.push({ 
                  "consumedQuantity": item.consumedQuantity,
                  "itemName": item.itemName,
              });
          }
          res.json({ status: true, message : "Data found",  data: allData });
      } else {
          res.json({ status: false, message : "No data found",  data: [] });
      }
  
      
    } catch (err) {
      res.status(500).send({
          status: false,
          message: err.toString() || "Internal Server Error",
          data: null,
      });
    }
};

exports.guest_potential_report = async (req, res) => {
  try {
    const eventId = req.query.event_id;

    // Find the event by eventId
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(200).json({ status: false, message: 'Event not found', data: null });
    }

    let potentialReport;

    if (event.type === "food_event") {
   
      potentialReport = await BookedMenuItem.aggregate([
        {
          $lookup: {
            from: 'menuitempayments',
            localField: 'payment_id',
            foreignField: '_id',
            as: 'menu_item_payment_data',
          },
        },
        {
          $match: { "menu_item_payment_data.is_approved": "yes", event_id: new mongoose.Types.ObjectId(eventId) }
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
          $unwind: '$menu'
        },
        {
          $lookup: {
            from: 'guests',
            localField: 'guest_id',
            foreignField: 'user_id',
            as: 'guest'
          }
        },
        {
          $unwind: '$guest'
        },
        {
          $group: {
            _id: {
              guestId: '$guest_id',
              guestName: '$guest.full_name',
              menuName: '$menu.name',
            },
            consumedQuantity: { $sum: 1 }, // Count the occurrences of each item per guest
          }
        },
        {
          $project: {
            _id: 0,
            guestId: '$_id.guestId',
            guestName: '$_id.guestName',
            itemName: '$_id.menuName',
            consumedQuantity: 1,
          }
        },
        {
          $sort: { consumedQuantity : -1  } 
        }
      ]);
    } else {
      potentialReport = await BookingMenu.aggregate([
        {
          $lookup: {
            from: 'bookingpayments',
            localField: 'payment_id',
            foreignField: '_id',
            as: 'menu_item_payment_data',
          },
        },
        {
          $match: { "menu_item_payment_data.status": "active" ,  event_id: new mongoose.Types.ObjectId(eventId) }
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
          $unwind: '$menu'
        },
        {
          $lookup: {
            from: 'guests',
            localField: 'guest_id',
            foreignField: 'user_id',
            as: 'guest'
          }
        },
        {
          $unwind: '$guest'
        },
        {
          $group: {
            _id: {
              guestId: '$guest_id',
              guestName: '$guest.full_name',
              menuName: '$menu.name',
            },
            consumedQuantity: { $sum: 1 }, // Count the occurrences of each item per guest
          }
        },
        {
          $project: {
            _id: 0,
            guestId: '$_id.guestId',
            guestName: '$_id.guestName',
            itemName: '$_id.menuName',
            consumedQuantity: 1,
          }
        },
        {
          $sort: { consumedQuantity : -1  } 
        }
      ]);
    }

    if (potentialReport.length > 0) {
      res.json({ status: true, message: "Data found", data: potentialReport });
    } else {
      res.json({ status: false, message: "No data found", data: [] });
    }

  } catch (err) {
    res.status(500).send({
      status: false,
      message: err.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.menu_audit_report = async (req, res) => {
  try {
    const sellerId = req.query.seller_id;

     // Find the seller by sellerId
     const seller = await Seller.findOne({ user_id: sellerId });
    
     if (!seller) {
       return res.status(200).json({ status: false, message: 'Seller not found',data: null });
     }

     // Find all events and event's menu created by the seller
     const menus = await EventModel.aggregate([
      {
        $match: { seller_id: new mongoose.Types.ObjectId(sellerId) }
      },
  
      {
        $lookup: {
          from: 'menuitemrecords',
          localField: '_id',
          foreignField: 'event_id',
          as: 'menu_items'
        }
      },
      {
        $unwind: '$menu_items'
      },
      {
        $project: {
          _id: '$menu_items._id',
          event_id: '$menu_items.event_id',
          name: '$menu_items.name',
          uom_id: '$menu_items.uom_id',
          category_id: '$menu_items.category_id',
          total_stock: '$menu_items.total_stock',
          cost_price: '$menu_items.cost_price',
          total_stock: '$menu_items.total_stock',
          selling_price: '$menu_items.selling_price',
          is_limited: '$menu_items.is_limited',
          limited_count: '$menu_items.limited_count',
          status: '$menu_items.status',
          createdAt: '$menu_items.createdAt',
          updatedAt: '$menu_items.updatedAt',
          __v: '$menu_items.__v',
          
        }
      }
    ]);
      
    console.log("menus",menus.length)

    if (menus.length > 0) {
      res.json({ status: true, message: "Data found", data: menus });
    } else {
      res.json({ status: false, message: "No data found", data: [] });
    }

  } catch (err) {
    res.status(500).send({
      status: false,
      message: err.toString() || "Internal Server Error",
      data: null,
    });
  }
};

exports.revenue_comparison_report = async (req, res) => {
  try {
    const eventId = req.query.event_id;

    // Find the event by eventId
    const event = await EventModel.findById(eventId);

    if (!event) {
      return res.status(200).json({ status: false, message: 'Event not found', data: null });
    }

    let potentialReport;

    if (event.type === "food_event") {
      console.log("event",event)

      potentialReport = await BookedMenuItem.aggregate([
        {
          $lookup: {
            from: 'menuitempayments',
            localField: 'payment_id',
            foreignField: '_id',
            as: 'menu_item_payment_data',
          },
        },
        {
          $unwind: '$menu_item_payment_data' // Deconstruct the array
        },
        {
          $match: { "menu_item_payment_data.is_approved": "yes", event_id: new mongoose.Types.ObjectId(eventId) }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$menu_item_payment_data.amount' }, // Sum up the total amount for all guests
          }
        },
        {
          $project: {
            _id: 0,
            totalAmount: 1,
          }
        }
      ]);
    } else {
      potentialReport = await BookingMenu.aggregate([
        {
          $lookup: {
            from: 'bookingpayments',
            localField: 'payment_id',
            foreignField: '_id',
            as: 'menu_item_payment_data',
          },
        },
        {
          $unwind: '$menu_item_payment_data' // Deconstruct the array
        },
        {
          $match: { "menu_item_payment_data.status": "active", event_id: new mongoose.Types.ObjectId(eventId) }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$menu_item_payment_data.amount' }, // Sum up the total amount for all guests
          }
        },
        {
          $project: {
            _id: 0,
            totalAmount: 1,
          }
        }
      ]);
    }

    if (potentialReport.length > 0) {
      res.json({ status: true, message: "Data found", data: potentialReport });
    } else {
      res.json({ status: false, message: "No data found", data: [] });
    }

  } catch (err) {
    res.status(500).send({
      status: false,
      message: err.toString() || "Internal Server Error",
      data: null,
    });
  }
};

