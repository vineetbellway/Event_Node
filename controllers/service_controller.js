const Service = require("../models/service.model");
const ServiceItem = require("../models/service_item.model");
const BookedServiceItem = require("../models/booked_service_item.model");
const ServiceItemPayments = require("../models/service_item_payments.model");
const mongoose = require("mongoose");
const { baseStatus, userStatus } = require("../utils/enumerator");
const EventModel = require("../models/event.model");
const Guest = require("../models/guest.model");
const Booking = require("../models/booking.model");
const EventGuestModel = require("../models/event_guest.model");


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
        $project: {
          _id: 1,
          event_id:1,
          name: 1,
          point:1,
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
          $project: {
            _id: 1,
            event_id:1,
            name: 1,
            category_id:1,
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


    // Fetch all Services
    const serviceResults = await Service.aggregate([
      {
        $match: {
          event_id: new mongoose.Types.ObjectId(event_id),
        },
      },
      {
        $project: {
          _id: 1,
          event_id: 1,
          name: 1,
          point: 1,
          status: 1,
          is_limited: 1,
          limited_count: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    var finalResponse = serviceResults;
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


exports.manage_service_item = async (req, res, next) => {
  try {
    if (!req.body || !req.body.service_id || !req.body.guest_id || req.body.quantity === undefined) {
      res.status(400).send({ status: false, message: "Invalid request body", data: [] });
    } else {
      const serviceRecord = await Service.findById(req.body.service_id);
      if (serviceRecord) {
        const event_id = serviceRecord.event_id;
        const { service_id, guest_id, quantity } = req.body;

        if (quantity < 1) {
          const serviceItem = await ServiceItem.findOneAndUpdate(
            { service_id, guest_id, event_id },
            { quantity: 0 }, // Set quantity to 0
            { new: true, upsert: true }
          );
          res.status(400).send({ status: false, message: "Quantity should be greater than 1", data: [] });
          return;
        }

        // Assuming ServiceItem is a mongoose model
        const serviceItem = await ServiceItem.findOneAndUpdate(
          { service_id, guest_id, event_id },
          { quantity },
          { new: true, upsert: true }
        );

        res.status(200).send({ status: true, message: "Quantity updated successfully", data: serviceItem });
      } else {
        res.status(404).send({ status: false, message: "Service not found", data: null });
      }
    }
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: [] });
  }
};


exports.get_service_items = async (req, res) => {
  try {
    var guest_id = req.query.guest_id;
    var event_id = req.query.event_id;
    const result = await ServiceItem.aggregate([
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
      const servicePromises = result.map(async (item) => {
        //console.log("item", item);
        if (item && typeof item.quantity === 'number' && item.quantity > 0) {
          var service_id = item.service_id;
          var service_record = await Service.findById(service_id);
          if (service_record) {
            var new_point = service_record.point * item.quantity;
            sum += new_point;
            return {
              ...item,
              quantity: item.quantity, // Include quantity in the response
            }; // Return item with new_price for Promise.all
          }
        }
      });

      const new_result = await Promise.all(servicePromises);



      const filteredServiceList = new_result.filter((item) => item && typeof item.quantity === 'number' && item.quantity > 0);
        res.status(200).send({
          status: true,
          message: "Data found",
          data: {
            service_list: filteredServiceList,
            total_points : sum, // Calculate sum after promises are resolved
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


exports.book_service_items = async (req, res, next) => {
  try {
    const serviceItems = req.body.service_items;

    


    if (!Array.isArray(serviceItems)) {
      res.status(400).send({ status: false, message: "Invalid request format. Expected an array.", data: null });
      return;
    }

    const batchSize = 5;
    const results = [];

   

    if(serviceItems.length > 0){
      
      var event_record = await EventModel.findById(serviceItems[0].event_id);
      console.log("event_record",event_record)
      if(event_record){
        if(event_record.status == "expired"){
          res.status(400).send({ status: false, message: "Event is expired", data: null });
          return;
        }
        
      } else {
        res.status(200).send({ status: false, message: "Event not found", data: null });
        return;
      }
     
     
    }

   


    const paymentData = {
      payment_status: 'paid',
     
    };

    const paymentResult = await ServiceItemPayments(paymentData).save();

    const payment_id = paymentResult._id;




    for (let i = 0; i < serviceItems.length; i += batchSize) {
      const batch = serviceItems.slice(i, i + batchSize);

      const batchResults = await Promise.all(batch.map(async (servicetem) => {
        const { _id, event_id, guest_id, service_id, quantity } = servicetem;

        if (!_id || !event_id || !guest_id || !service_id || !quantity) {
          return { status: false, message: "_id, event_id, guest_id,service_id, quantity  missing", data: null };
        }

        const serviceRecord = await Service.findById(service_id);

        if (!serviceRecord) {
         // return { status: false, message: "Service not found", data: null };

          res.status(400).send({ status: false, message: "Service not found", data: null });
          return;
        }
        var service_item_id = _id;

        const bookingData = {
          service_item_id,
          event_id,
          guest_id,
          service_id,
          quantity,
          payment_id,
        };  

      

        const result = await BookedServiceItem(bookingData).save();

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

    const bookedServiceResult = await BookedServiceItem.find({ payment_id: payment_id });
      var sum = 0;
        for (const item of bookedServiceResult) {
          if (item && typeof item.quantity === 'number' && item.quantity > 0) {
            const service_id = item.service_id;
            const serviceRecord = await Service.findById(service_id);

            if (serviceRecord) {
              sum += serviceRecord.point * item.quantity;
            }
          }
        }

        await ServiceItemPayments.findByIdAndUpdate(payment_id, { $set: { total_points: sum } });


      // Delete records from the ServiceItem model
     /* const deleteConditions = {
        event_id: { $in: results.map(item => item.event_id) },
        service_id: { $in: results.map(item => item.service_id) },
        guest_id: { $in: results.map(item => item.guest_id) },
      };
  
      await ServiceItem.deleteMany(deleteConditions);*/
      
      res.status(200).send({ status: true, message: "Service booked successfully", data : { payment_id: payment_id,booked_data: results} });
  

    
  

   
  } catch (error) {
    console.log("error", error);
    res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: null });
  }
};

exports.get_booked_service_items = async (req, res) => { 
  if (req.query.payment_id == '') {
    res.status(400).send({ status: false, message: "Invalid request body", data: [] });
    return;
  } else {
    try {
      var payment_id  = req.query.payment_id;

      console.log("payment_id",payment_id)

      // Check the existence of payment_id in the bookedServiceResult collection
      const bookedServiceResult = await BookedServiceItem.find({ payment_id: payment_id });

      if (!bookedServiceResult || bookedServiceResult.length === 0) {
        res.status(404).send({ status: false, message: "No booking found for the provided payment_id", data: [] });
        return;
      }

      const guest_id = bookedServiceResult[0].guest_id;
      const event_id = bookedServiceResult[0].event_id;

      const paymentData = await ServiceItemPayments.findById(payment_id);


   
      

      // Fetch relevant data from ServiceItem collection based on guest_id and event_id
      const serviceItemResult = await ServiceItem.aggregate([
        {
          $match: {
            guest_id: new mongoose.Types.ObjectId(guest_id),
            event_id: new mongoose.Types.ObjectId(event_id),
          },
        },
      ]);

      // Fetch service events for the specific event_id
      const event_services = await Service.aggregate([
        {
          $match: {
            event_id: new mongoose.Types.ObjectId(event_id),
          },
        },
        {
          $project: {
            _id: 1,
            event_id: 1,
            name: 1,
            category_id: 1,
            point: 1,
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

      var sum = 0;
      for (const item of bookedServiceResult) {
        if (item && typeof item.quantity === 'number' && item.quantity > 0) {
          const service_id = item.service_id;
          const serviceRecord = await Service.findById(service_id);

          if (serviceRecord) {
            sum += serviceRecord.point * item.quantity;
          }
        }
      }

      
      

      // Approve service item payments
      const result = bookedServiceResult.map(item1 => {
        // Find the matching event_service for the current item1
        const matchingEventService = event_services.find(service => service.event_id.equals(item1.event_id) && service._id.equals(item1.service_id));

         // Find the matching guest record for the current item1
         const matchingGuestRecord = guest_record.find(guest => guest.user_id.equals(item1.guest_id));
        console.log("matchingGuestRecord",matchingGuestRecord)
        // Assign the event_service information to the current item1
        return {
          ...item1.toObject(),
          event_service: matchingEventService || null,
          guest_record : matchingGuestRecord || null
        };
      });

      console.log("result", result);

      if (result.length > 0) {
        console.log("result");
        res.status(200).send({ status: true, message: "Data found", data: { total_points : sum, service_list: result } });
      } else {
        res.status(200).send({ status: true, message: "No Data found", data: [] });
      }
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: [] });
    }
  }
};


exports.approve_service_payment = async (req, res, next) => {
  // Check the existence of required fields in the request body
  if (!req.body || !req.body.payment_id || !req.body.validator_id) {
    res.status(400).send({ status: false, message: "Invalid request body", data: [] });
  } else {
    try {
      const { payment_id, validator_id } = req.body;

      // Check the existence of payment_id in the BookedMenuItem collection
      const bookedServiceResult = await BookedServiceItem.find({ payment_id: payment_id });

      if (!bookedServiceResult || bookedServiceResult.length === 0) {
        res.status(404).send({ status: false, message: "No booking found for the provided payment_id", data: [] });
        return;
      }

      const guest_id = bookedServiceResult[0].guest_id;
      const event_id = bookedServiceResult[0].event_id;

      // Fetch relevant data from ServiceItem collection based on guest_id and event_id
      const serviceItemResult = await ServiceItem.aggregate([
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
      for (const item of bookedServiceResult) {

        if (item && typeof item.quantity === 'number' && item.quantity > 0) {
          const service_id = item.service_id;

       
          const serviceRecord = await Service.findById(service_id);

          console.log("serviceRecord",serviceRecord);
       
           // Update limited count in Menu collection

           if(serviceRecord.is_limited == "yes"){
             
            const newCount = serviceRecord.limited_count - item.quantity;
    
            await Service.findByIdAndUpdate(service_id, { $set: { limited_count: newCount } });
           }

           

          if (serviceRecord) {
            sum += serviceRecord.point * item.quantity;
          }
        }
      }

   

      var total_loyality_points = eventRecord.point;

      var total_sum = 0;

      var bookedPaymentResult = await ServiceItemPayments.aggregate([
              
        {
          $lookup: {
            from: 'serviceitembookings',
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
          console.log("result2",result2)
          if (result2.length > 0) {
      
      
            for(var p_item of result2){
                if(p_item.total_points!=undefined){                        
                  total_sum += p_item.total_points;
                }
            }
            console.log("total_loyality_points",total_loyality_points)
            console.log("total_sum",total_sum)
            console.log("inside if")
            total_loyality_points = total_loyality_points - total_sum;
          } else {
            total_loyality_points = total_loyality_points;
          }
        })
        .catch((error) => {
          console.error("Error:", error);
        });
          
        console.log("total_loyality_points",total_loyality_points)
        console.log("total_sum",total_sum);
        console.log("sum",sum);
      //    return false;
         
        if (sum > total_loyality_points) {
          res.status(400).send({ status: false, message: "Total points exceeds then event loyality point", data: [] });
          return;
        }    

        console.log("sum",sum)
  
        // Update point in the service item payment record
       // await ServiceItemPayments.findByIdAndUpdate(payment_id, { $set: { total_points: 0 } });

        
      
      
     

     // Approve service item payments in ServiceItemPayments collection
      const is_approved = 'yes';
      var updatedPaymentResult = await ServiceItemPayments.findOneAndUpdate(
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
        data: { updatedPaymentResult, remainingLoyalityPoints: total_loyality_points },
      });
    } catch (error) {
      console.log("error", error);
      res.status(500).send({ status: false, message: error.toString() || "Internal Server Error", data: [] });
    }
  }
};


exports.get_guest_loyalty_pointsold = async (req, res) => {
  try {
    const guest_id = req.query.guest_id;
    const event_id = req.query.event_id;

    if (!guest_id) {
      return res.status(400).json({ status: false, message: "Guest ID is required in the request body" });
    }

    const bookings = await Booking.aggregate([
      {
        $match: {
          guest_id: mongoose.Types.ObjectId(guest_id),
          status: 'active'
        },
      },
      {
        $lookup: {
          from: 'bookingmenus',
          localField: '_id',
          foreignField: 'booking_id',
          as: 'booked_menu_data',
        },
      },
      {
        $unwind: { path: "$booked_menu_data", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: 'menus',
          localField: 'booked_menu_data.menu_id',
          foreignField: '_id',
          as: 'menu_data',
        },
      },
      {
        $unwind: { path: "$menu_data", preserveNullAndEmptyArrays: true },
      },
      {
        $sort: { createdAt: 1 }, // Sort by createdAt in ascending order
      },
    ]);

    let total_loyalty_points = 0;
    let event_data = null;

    if (bookings && bookings.length > 0) {
      for (const item of bookings) {
        const eventId = item.event_id;

        const eventDetails = await EventModel.findOne({ '_id': eventId });

        if (eventDetails && eventDetails.status === 'active') {
          event_data = eventDetails;
          total_loyalty_points = eventDetails.point;
          break;
        }
      }

      if (event_data) {
        const menu_payment_record = await ServiceItemPayments.aggregate([
          {
            $lookup: {
              from: 'serviceitembookings',
              localField: '_id',
              foreignField: 'payment_id',
              as: 'booking_data',
            },
          },
          {
            $match: {
              "booking_data.event_id": mongoose.Types.ObjectId(event_data._id),
              "booking_data.guest_id": mongoose.Types.ObjectId(guest_id),
            },
          },
          {
            $sort: { 'createdAt': -1 },
          },
        ]);

        if (menu_payment_record.length > 0) {
          let total = 0;

          for (const p_item of menu_payment_record) {
            if (p_item.total_points !== undefined) {
              total += p_item.total_points;
            }
          }

          total_loyalty_points -= total;
        }
      }

      return res.status(200).json({
        status: true,
        message: "Data found",
        data: { "total_loyalty_points": total_loyalty_points, 'event_data': event_data },
      });
    } else {
      return res.status(200).json({ status: false, message: "No data found", data: null });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};



exports.get_guest_loyalty_points = async (req, res) => {
  try {
    const guest_id = req.query.guest_id;

    if (!guest_id) {
      return res.status(400).json({ status: false, message: "Guest ID is required in the request body" });
    }

    var event_guest_record = await EventGuestModel.aggregate([
      {
        $match: { "guest_id":  new mongoose.Types.ObjectId(guest_id) } // Match documents where guest_id matches
      },
      {
        $lookup: {
          from: "events", // The collection you're looking up against
          localField: "event_id", // Field from the current collection
          foreignField: "_id", // Field from the referenced collection
          as: "event" // Name of the field that will contain the matched event document
        }
      },
      {
        $unwind: "$event" // Unwind the array created by $lookup to work with single documents
      },
      {
        $match: { "event.status": "active" } // Filter based on the status of the event
      }
    ]);

    let total_loyalty_points = 0;
    let event_data = [];

    if (event_guest_record.length > 0) {
      const uniqueEventIds = [...new Set(event_guest_record.map(item => item.event_id))];
      
      for (const eventId of uniqueEventIds) {
        const eventRecords = event_guest_record.filter(item => item.event_id === eventId);
        const lastRecord = eventRecords[eventRecords.length - 1]; // Get the last record
        total_loyalty_points += parseInt(lastRecord.point);
        event_data.push({
          event_id: eventId,
          point: parseInt(lastRecord.point)
        });
      }
    }

    // Add logic for service booking records
    const service_booking_record = await BookedServiceItem.aggregate([
      {
        $lookup: {
          from: 'serviceitempayments',
          localField: 'payment_id',
          foreignField: '_id',
          as: 'payment_data',
        },
      },
      {
        $match: {
          "guest_id": new mongoose.Types.ObjectId(guest_id),
          "payment_data.is_approved": "yes"
        },
      },
      {
        $sort: { 'createdAt': -1 },
      },
      {
        $group: {
          _id: "$payment_id", // Group by payment_id
          data: { $first: "$$ROOT" } // Keep the first document encountered for each payment_id
        }
      },
      {
        $replaceRoot: { newRoot: "$data" } // Replace the document structure to its original form
      }
    ]);

    console.log('service_booking_record',service_booking_record)

    if (service_booking_record.length > 0) {
      console.log("total_loyalty_points before",total_loyalty_points);
      var sum = 0;
      const eventPointSumMap = {}; // Map to store the total points for each event ID

    
      for (const p_item of service_booking_record) {
       /* console.log("p_item",p_item)*/
        const payment_data = p_item.payment_data;
        const event_id = p_item.event_id;
        const event_record = await EventModel.findById(event_id);
       /* console.log("payment_id",payment_data[0]._id)*/
      //  console.log("payment_data",payment_data[0])
      const total_points = parseInt(payment_data[0].total_points);

        var quantity = p_item.quantity;
        console.log("event_id",event_id);
        console.log("quantity",quantity);
        // Initialize the sum for the event ID if not already present
    if (!eventPointSumMap[event_id]) {
      eventPointSumMap[event_id] = 0;
  }
  eventPointSumMap[event_id] += total_points;
  const point = event_record.point - eventPointSumMap[event_id];

       
        console.log("point",payment_data[0].total_points)
        sum = sum + parseInt(payment_data[0].total_points);
        event_data.push({
          event_id: event_id,
          point: point
        });
        
      }

     // console.log("total_loyalty_points after",total_loyalty_points);

     // console.log("sum",sum);

      total_loyalty_points -= sum;

     
    }

        // Remove duplicate event IDs and keep only the last occurrence
    

    console.log("event data",event_data)
    const uniqueEventData = {};
    event_data.forEach(event => {
      uniqueEventData[event.event_id.toString()] = event;
    });
    event_data = Object.values(uniqueEventData);

    return res.status(200).json({
      status: true,
      message: "Data found",
      data: { total_loyalty_points, event_data }
    });

  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};


