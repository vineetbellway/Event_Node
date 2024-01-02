
const OrderItem = require("../models/order_item.model");
const mongoose = require("mongoose");
const EventModel = require("../models/event.model");
const Seller = require("../models/seller.model");
const Category = require("../models/category.model"); 
const Booking = require("../models/booking.model");
const BookedMenuItem = require("../models/booked_menu_item.model");



exports.get_item_sales_report = async (req, res) => {
    try {
        const eventId = req.query.event_id;

        console.log("eventId",eventId)

        // Find the event by eventId
        const event = await EventModel.findById(eventId);

        if (!event) {
            return res.status(200).json({ success: false, message: 'Event not found' , data :null });
          }
    
        // Perform aggregation to calculate item sales report
        const itemSalesReport = await BookedMenuItem.aggregate([
          
          {
            $lookup: {
              from: 'menus',
              localField: 'menu_id',
              foreignField: '_id',
              as: 'menu'
            }
          },
          {
            $lookup: {
              from: 'menu_items_payments',
              localField: '_id',
              foreignField: 'payment_id',
              as: 'payment_data',
            },
          },
          {
            $match: { "payment_data.is_approved": "yes" ,  event_id: new mongoose.Types.ObjectId(eventId) }
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
              payment_data: { $push: '$payment_data' }
            }
          },
          {
            $project: {
              _id: 0,
              itemName: '$_id.menuName',
              category: '$_id.category',
              consumedQuantity: 1,
              payment_data: 1
            }
          }
        ]);
        console.log("itemSalesReport",itemSalesReport)
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
            res.json({ success: true, message : "Data found",  data: allData });
        } else {
            res.json({ success: true, message : "No data found",  data: [] });
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
          return res.status(200).json({ success: false, message: 'Event not found' , data :null });
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
    
        res.json({ success: true, message : "Data found", data : [{ event: event.name, numberOfGuests: totalGuests }] });
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
          return res.json({ success: true, message: 'No events found for the seller',data:[] });
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
            res.json({ success: true, message: 'Data found', repeatedGuests });
        } else {
            res.json({ success: true, message: 'No data found', repeatedGuests });
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
          return res.status(200).json({ success: false, message: 'Seller not found',data: null });
        }
        
        // Find all events created by the seller
        const sellerEvents = await EventModel.find({ seller_id: sellerId });
      
    
        if (sellerEvents.length == 0) {
          return res.json({ success: true,message: 'Seller events not found', data :[{seller: seller.company_name, numberOfGuests: 0}] });
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
    
        res.json({ success: true,message: 'Data found', data : [{seller: seller.company_name, numberOfGuests: totalGuests}] });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
};