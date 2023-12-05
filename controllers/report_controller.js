
const OrderItem = require("../models/order_item.model");
const mongoose = require("mongoose");
const EventModel = require("../models/event.model");




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
        const itemSalesReport = await OrderItem.aggregate([
          {
            $match: { event_id: new mongoose.Types.ObjectId(eventId) }
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
              _id: '$menu.name',
              category: { $first: '$menu.category' },
              consumedQuantity: { $sum: '$consumed' }
            }
          },
          {
            $project: {
              _id: 0,
              itemName: '$_id',
              category: 1,
              consumedQuantity: 1
            }
          }
        ]);

        if(itemSalesReport.length > 0){
            res.json({ success: true, message : "Data found",  data: itemSalesReport });
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

        console.log("event data",event)
    
        if (!event) {
          return res.status(200).json({ success: false, message: 'Event not found' , data :null });
        }
    
        // Calculate the number of guests attending the event
        const numberOfGuests = await OrderItem.aggregate([
          {
            $match: { event_id: eventId }
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
          return res.json({ success: true, message: 'No events found for the seller' });
        }
    
        // Get event IDs associated with the seller's events
        const eventIds = sellerEvents.map(event => event._id);
    
        // Calculate guests who attend multiple events created by the seller
        const repeatedGuests = await OrderItem.aggregate([
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
    
        res.json({ success: true, repeatedGuests });
      } catch (err) {
        res.status(500).json({ success: false, error: err.message });
      }
};