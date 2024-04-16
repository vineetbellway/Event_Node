
const OrderItem = require("../models/order_item.model");
const mongoose = require("mongoose");
const EventModel = require("../models/event.model");
const Seller = require("../models/seller.model");
const Category = require("../models/category.model"); 
const Booking = require("../models/booking.model");
const BookedMenuItem = require("../models/booked_menu_item.model");
const BookingMenu = require("../models/booking_menu.model");
const Validator = require("../models/validator.model");
const User = require("../models/user.model");
const GuestModel = require("../models/guest.model");
const Menu = require("../models/menu.model");



exports.get_item_sales_report_validator_wise = async (req, res) => {
    try {
        const eventId = req.query.event_id;

       

        // Find the event by eventId
        const event = await EventModel.findById(eventId);
        console.log("event",event.type)
        if (!event) {
            return res.status(200).json({ status: false, message: 'Event not found' , data :null });
          }


          if(event.type === "food_event") {
            // Perform aggregation to calculate item sales report
              var itemSalesReport = await BookedMenuItem.aggregate([
                
                
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
                    menu_id: '$menu._id',
                    category: '$menu.category_id',
                    validator_id: '$menu_item_payment_data.validator_id'
                    },
                    consumedQuantity: { $sum: '$quantity' },
                    payment_data: { $push: '$menu_item_payment_data' },
                  }
                },

                {
                  $lookup: {
                    from: 'validators',
                    localField: '_id.validator_id',
                    foreignField: 'user_id',
                    as: 'validator'
                  }
                },
                {
                  $unwind: '$validator'
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: '_id.validator_id',
                    foreignField: '_id',
                    as: 'user'
                  }
                },
                {
                  $unwind: '$user'
                },
                
                {
                  $project: {
                    _id: 0,
                    itemName: '$_id.menuName',
                    menu_id: '$_id.menu_id',
                    category: '$_id.category',
                    consumedQuantity: 1,
                    validator_name: '$validator.full_name',
                    validator_phone_number: '$user.code_phone',
                  }
                }
                
              ]);
          }

          else if(event.type === "entry_food_event"){
            // Perform aggregation to calculate item sales report
            var itemSalesReport = await BookingMenu.aggregate([
              {
                $lookup: {
                  from: 'bookingpayments',
                  localField: 'payment_id',
                  foreignField: '_id',
                  as: 'menu_item_payment_data',
                },
              },
              {
                $match: { "menu_item_payment_data.status": "active", "menu_item_payment_data.is_consumed": "yes", event_id: new mongoose.Types.ObjectId(eventId) }
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
                    menu_id: '$menu._id',
                    category: '$menu.category_id',
                    validator_id: '$menu_item_payment_data.validator_id'
                  },
                  consumedQuantity: { $sum: '$quantity' },
                  payment_data: { $push: '$menu_item_payment_data' },
                }
              },

              {
                $lookup: {
                  from: 'validators',
                  localField: '_id.validator_id',
                  foreignField: 'user_id',
                  as: 'validator'
                }
              },
              {
                $unwind: '$validator'
              },
              {
                $lookup: {
                  from: 'users',
                  localField: '_id.validator_id',
                  foreignField: '_id',
                  as: 'user'
                }
              },
              {
                $unwind: '$user'
              },
              
              {
                $project: {
                  _id: 0,
                  menu_id: '$_id.menu_id',
                  itemName: '$_id.menuName',
                  category: '$_id.category',
                  consumedQuantity: 1,
                  validator_name: '$validator.full_name',
                  validator_phone_number: '$user.code_phone',
                }
              }
            ]);
          }
    
        
  
        if(itemSalesReport.length > 0){
          const groupedData = {};
    
          for (const item of itemSalesReport) {
            console.log("item",item)
            try {
              const categoryData = await Category.findById(item.category);
              const menuData = await Menu.findById(item.menu_id);
              const key = item.validator_name;
              if (!groupedData[key]) {
                groupedData[key] = {
                  validator_data: {
                    name: key,
                    phone_number: item.validator_phone_number
                  },
                  approved_items: []
                };
              }
              groupedData[key].approved_items.push({
                category: categoryData.name,
                consumedQuantity: item.consumedQuantity,
                itemName: item.itemName,
                sellingPrice: menuData.selling_price,
                costPrice: menuData.cost_price,
              });
            } catch (error) {
              console.error("Error fetching category data:", error);
              // Handle error if necessary
            }
          }
          
          const result = Object.values(groupedData);

            
            res.json({ status: true, message : "Data found",  data: result});
        } else {
            res.json({ status: false, message : "No data found",  data: [] });
        }
    
        
      } catch (err) {
        console.log("error",err)
        res.status(500).send({
            status: false,
            message: err.toString() || "Internal Server Error",
            data: null,
        });
      }
};

exports.get_item_sales_report = async (req, res) => {
  try {
      const eventId = req.query.event_id;

      console.log("eventId",eventId)

      // Find the event by eventId
      const event = await EventModel.findById(eventId);

      if (!event) {
          return res.status(200).json({ status: false, message: 'Event not found' , data :null });
      }

      if(event.type === "food_event") {
         // Perform aggregation to calculate item sales report
        var itemSalesReport = await BookedMenuItem.aggregate([
          
          
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
                menu_id: '$menu._id',
                category: '$menu.category_id'
              },
              consumedQuantity: { $sum: '$quantity' },
              payment_data: { $push: '$menu_item_payment_data' },
            }
          },
          {
            $project: {
              _id: 0,
              menu_id: '$_id.menu_id',
              itemName: '$_id.menuName',
              category: '$_id.category',
              consumedQuantity: 1,
              payment_data: 1,
            }
          }
        ]);


      } 
      else if(event.type === "entry_food_event"){
        var itemSalesReport = await BookingMenu.aggregate([
          
          
          {
            $lookup: {
              from: 'menuitempayments',
              localField: 'payment_id',
              foreignField: '_id',
              as: 'menu_item_payment_data',
            },
          },
          {
            $match: { "menu_item_payment_data.status": "active", "menu_item_payment_data.is_consumed": "yes", event_id: new mongoose.Types.ObjectId(eventId) }
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
                menu_id: '$menu._id',
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
              menu_id: '$_id.menu_id',
              category: '$_id.category',
              consumedQuantity: 1,
              payment_data: 1,
            }
          }
        ]);

      }
  
     
      if(itemSalesReport.length > 0){
          var allData = [];
          for(var item of itemSalesReport){
             var categoryData =  await Category.findById(item.category);
             const menuData = await Menu.findById(item.menu_id);
                allData.push({ 
                  "category": categoryData.name,
                  "consumedQuantity": item.consumedQuantity,
                  "itemName": item.itemName,
                  "sellingPrice": menuData.selling_price,
                  "costPrice": menuData.cost_price,
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
         var direct_cost = 0;
         var indirect_cost = event.transportation_charge + event.hire_charge + event.labour_charge  + event.commision_charge ;
         var total_cost = direct_cost + indirect_cost;
         var revenue_per_cover = 0;
         var expenditure_per_cover = total_cost/totalGuests;
         var earning_per_cover = 0;



         // Find the event by eventId
     
       
     
         let revenueReport;
     
         if (event.type === "entry_event") {
           revenueReport = await Booking.aggregate([
            
           
             {
               $match: { "status": { $in: ["active", "expired"] }, event_id: new mongoose.Types.ObjectId(eventId) }
             },
             {
               $group: {
                 _id: null,
                 totalAmount: { $sum: '$amount' }, // Sum up the total amount for all guests
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
     
        else if (event.type === "food_event") {
     
         revenueReport = await BookedMenuItem.aggregate([
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
           revenueReport = await BookingMenu.aggregate([
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


         



         if(revenueReport.length > 0){
           var revenue = revenueReport[0].totalAmount;
         } else {
          var revenue = 0;

         }
     
         console.log("revenue",revenueReport)
         var earning  = revenue - total_cost;
        res.json({ status: true, message : "Data found", data : { 
          event_name: event.name, 
          event_date: event.start_time, 
          numberOfGuests: totalGuests ,
          'direct_cost': direct_cost,
          'indirect_cost' : indirect_cost,
          'transportation_charge' : event.transportation_charge,
          'hire_charge' : event.hire_charge,
          'labour_charge' : event.labour_charge,
          'commision_charge' : event.commision_charge,
          'total_cost' : total_cost,
          'earning' : earning,
          'revenue_per_cover' : revenue_per_cover,
          'expenditure_per_cover' : expenditure_per_cover,
          'revenue_per_cover' : revenue_per_cover,
          'earning_per_cover': earning_per_cover

        } });
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
            $lookup: {
              from: 'events', // Assuming the collection name is 'events'
              localField: 'event_id',
              foreignField: '_id',
              as: 'event'
            }
          },
          {
            $group: {
              _id: '$guest_id',
              eventsAttended: { $addToSet: { $arrayElemAt: ['$event.name', 0] } }, // Assuming the event name field is 'name'
              totalEventsAttended: { $sum: 1 }
            }
          },
          {
            $match: { totalEventsAttended: { $gt: 1 } } // Filter guests who attended more than one event
          },
          {
            $project: {
              _id: 1,
              guest_id: '$_id', // Retain the guest_id field
              totalEventsAttended: 1,
              eventsAttended: {
                $reduce: {
                  input: '$eventsAttended',
                  initialValue: '',
                  in: { $concat: ['$$value', { $cond: [{ $eq: ['$$value', ''] }, '', ', '] }, '$$this'] }
                }
              }
            }
          }
        ]);
        
        
        
        if(repeatedGuests.length > 0){
           // Array to store additional information about guests
    let guestsInfo = [];
    // Iterate through repeatedGuests array
    for (let i = 0; i < repeatedGuests.length; i++) {
        const guest = repeatedGuests[i];
      
        var guest_id = guest._id;
        console.log("guest id",guest_id);
      //  return false;
        // Retrieve guest information from GuestModel
        const guestInfo =   await GuestModel.findOne({ "user_id" :  guest_id });


        console.log("guestInfo",guestInfo);
        // return true;
        // Retrieve user information from UserModel
        
         const userInfo =  guestInfo ? await User.findOne({ _id: guestInfo.user_id }) : '';
               // Add guest name and phone number to the guest object

            guest.name = guestInfo ? guestInfo.full_name : '';
            guest.phone = userInfo ? userInfo.code_phone :'';
     
    

   

        // Push the modified guest object to guestsInfo array
        guestsInfo.push(guest);
    }
            res.json({ status: true, message: 'Data found', data : guestsInfo });
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

exports.guest_presence_report = async (req, res) => {
    try {
        const event_id = req.query.event_id;
    
      
      
        const sellerEvents = await EventModel.find({ event_id: event_id });
      
    
        // Get event IDs associated with the seller's events
   

    
        // Calculate the number of guests attending events by the seller
        const numberOfGuests = await Booking.aggregate([
          {
            $match: { event_id: event_id }
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
    
        res.json({ status: true,message: 'Data found', data : [{seller: 0, numberOfGuests: totalGuests}] });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
};

exports.get_number_of_guests_for_seller_backup = async (req, res) => {
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
      console.log("event",event)


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
                  menu_id: '$menu._id',
                  category: '$menu.category_id',
                },
                consumedQuantity: { $sum: '$quantity' },
              }
            },
            {
              $project: {
                _id: 0,
                menu_id: '$_id.menu_id',
                itemName: '$_id.menuName',
                consumedQuantity: 1, 
                category: '$_id.category',
                
              }
            },
            {
              $sort: { consumedQuantity:  -1  } // Sort by consumedQuantity based on the type
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
                  menu_id: '$menu._id',
                  category: '$menu.category_id',
                  
                },
                consumedQuantity: { $sum: '$quantity' },
                payment_data: { $push: '$menu_item_payment_data' },
              }
            },
            {
              $project: {
                _id: 0,
                menu_id: '$_id.menu_id',
                itemName: '$_id.menuName',
                category: '$_id.category',
                consumedQuantity: 1,
                payment_data: 1,
              }
            },
            {
              $sort: { consumedQuantity: -1  } // Sort by consumedQuantity based on the type
            }
          ]);
      }


  
     

      console.log("fnsMovingItemsReport",fnsMovingItemsReport)

      if(fnsMovingItemsReport.length > 0){
          var allData = [];
          var sum = 0;
          for(var item of fnsMovingItemsReport){
            const menuData = await Menu.findById(item.menu_id);
            const categoryData = await Category.findById(item.category);
            sum = sum+item.consumedQuantity;
          
                allData.push({ 
                  "category": categoryData.name,
                  "consumedQuantity": item.consumedQuantity,
                  "itemName": item.itemName,
                  "sellingPrice": menuData.selling_price,
                  "costPrice": menuData.cost_price,
              });
          }

          if(allData.length > 0){
            for(var item1 of allData){            
              var consumedQuantity = item1.consumedQuantity;
              var percentage = (consumedQuantity/100)*sum;               
              item1.percentage = percentage.toString();

            }
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
              menu_id: '$menu._id',
              guestName: '$guest.full_name',
              menuName: '$menu.name',
            },
            consumedQuantity: { $sum: 1 }, // Count the occurrences of each item per guest
          }
        },
        {
          $project: {
            _id: 0,
            menu_id: '$_id.menu_id',
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
              menu_id: '$menu._id',
              guestName: '$guest.full_name',
              menuName: '$menu.name',
            },
            consumedQuantity: { $sum: 1 }, // Count the occurrences of each item per guest
          }
        },
        {
          $project: {
            _id: 0,
            menu_id: '$_id.menu_id',
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

      var allData = [];
          for(var item of potentialReport){
            const menuData = await Menu.findById(item.menu_id);
            console.log("item",item)
                allData.push({ 
                  "guestId": item.guestId,
                  "guestName": item.guestName,
                  "consumedQuantity": item.consumedQuantity,
                  "itemName": item.itemName,
                  "costPrice": menuData.cost_price,
              });
          }


      res.json({ status: true, message: "Data found", data: allData });
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

    let revenueReport;

    if (event.type === "entry_event") {
      revenueReport = await Booking.aggregate([
       
      
        {
          $match: { "status": { $in: ["active", "expired"] }, event_id: new mongoose.Types.ObjectId(eventId) }
        },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' }, // Sum up the total amount for all guests
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

   else if (event.type === "food_event") {

    revenueReport = await BookedMenuItem.aggregate([
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
      revenueReport = await BookingMenu.aggregate([
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

    if (revenueReport.length > 0) {
      res.json({ status: true, message: "Data found", data: revenueReport[0] });
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

