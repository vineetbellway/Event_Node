const EventModel = require("../models/event.model");
const EventGuestModel = require("../models/event_guest.model");
const LoyalityOrderItem = require("../models/loyalty_order_item.model");
const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const moment = require("moment");
const { baseStatus, userStatus } = require("../utils/enumerator");
const Booking = require("../models/booking.model");
const Membership = require("../models/membership.model");
const Seller = require("../models/seller.model");
const UPI = require("../models/upi.model");
const BusinessSettings = require("../models/business_settings.model");
const Feedback = require("../models/feedback.model");


exports.create_event = async(req, res, next) => {
  try {
    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const primary_number = req.body.primary_number.trim();
    const secondary_number = req.body.secondary_number.trim();
    const type = req.body.type.trim();
    const image = req.file ? req.file.filename : undefined;
    const name = req.body.name.trim();
    const venue = req.body.venue.trim();
    const country = req.body.country.trim();
    const state = req.body.state.trim();
    const city = req.body.city.trim();
    var start_time = req.body.start_time.trim();
    var end_time = req.body.end_time.trim();
    const coupon_name = req.body.coupon_name.trim();
    const amount = req.body.amount.trim();
    const instructions = req.body.instructions.trim();
    const transportation_charge = req.body.transportation_charge.trim();
    const hire_charge = req.body.hire_charge.trim();
    const labour_charge = req.body.labour_charge.trim();
    const commision_charge = req.body.commision_charge.trim();
    const is_cover_charge_added = (req.body.is_cover_charge_added!='') ?  req.body.is_cover_charge_added.trim() : 'no';

    
    const user_booking_limit = req.body.user_booking_limit ?  req.body.user_booking_limit.trim() : '';

    const is_private =  req.body.is_private.trim() ? req.body.is_private.trim() : 'no';
    const latitude = req.body.latitude ?  req.body.latitude.trim() : '';
    const longitude = req.body.longitude ?  req.body.longitude.trim() : '';
    const selected_payment = req.body.selected_payment ?  req.body.selected_payment.trim() : '';

    var user_record = await Seller.findOne({"user_id" : seller_id});
    console.log("user_record",user_record._id)

    var sellerMemberShip = await Membership.aggregate([
      {
          $match: {
              seller_id: new mongoose.Types.ObjectId(user_record._id),
          },
      },
      {
          $lookup: {
              from: 'subscriptionplans',
              localField: 'plan_id',
              foreignField: '_id',
              as: 'plan_data',
          },
      },
      {
          $project: {
              "_id": 1,
              "seller_id": 1,
              "plan_id": 1,
              "amount": 1,
              "txn": 1,
              "end_date": 1,
              "status": 1,
              "createdAt": 1,
              "updatedAt": 1,
              "event_limit" :1,
              "plan_name": { "$arrayElemAt": ["$plan_data.name", 0] } ,
              "description": { "$arrayElemAt": ["$plan_data.description", 0] },
              "event_limit": { "$arrayElemAt": ["$plan_data.event_limit", 0] } 
          }
      },
      {
        $sort: { "createdAt": -1 } // Sort by createdAt in descending order
    },
    {
        $limit: 1 // Limit to only the latest plan
    }

  ]);
  console.log("sellerMemberShip",sellerMemberShip)


  start_time = start_time.split(" ");
  start_time = start_time[0]+"T"+start_time[1];

  end_time = end_time.split(" ");
  end_time = end_time[0]+"T"+end_time[1];
 


   if(sellerMemberShip.length > 0){
     var eventLimit = sellerMemberShip[0].event_limit;
     console.log("eventLimit",eventLimit)
      if(eventLimit == "unlimited"){
              
        const cover_charge = (req.body.cover_charge!='') ?  req.body.cover_charge.trim() : '';
        const others = req.body.others.trim();
        const status = req.body.status.trim();
        const banner_id = req.body.banner_id ? req.body.banner_id.trim() : null;
        const point = req.body.point ? req.body.point.trim() : 0;

        if(type == "loyalty"){
          if (point == '' || point == 0) {
            res.status(400).send({ status: false, message: "Please enter point", data: null  });
            return;
          }  
        }



        const guest_ids = req.body.guest_ids; 

        



        const eventData = {
          seller_id: new ObjectId(seller_id),
          primary_number,
          secondary_number,
          type,
          name,
          venue,
          image,
          country,
          state,
          city,
          start_time,
          end_time,
          coupon_name,
          amount,
          instructions,
          transportation_charge,
          hire_charge,
          labour_charge,
          commision_charge,
          others,
          is_cover_charge_added,
          cover_charge,
          status,
          banner_id,
          point,
          user_booking_limit,
          is_private,
          latitude,
          longitude,
          selected_payment
        };

        EventModel(eventData)
          .save()
          .then(async(result) => {
            if (result) {
              // Get the host (domain and port)
              const protocol = req.protocol;
              const host = req.get('host');

              // Combine protocol, host, and any other parts of the base URL you need
              const baseURL = `${protocol}://${host}`;
              const imageUrl = baseURL + '/uploads/events/' + result.image;
              console.log("result",result)

            
            
              if(type == "loyalty"){
                const jsonArray = JSON.parse(guest_ids);
                if(jsonArray.length > 0){
                  for(item of jsonArray){
                    var eventguestdata = {
                      "event_id" : result._id,
                      "guest_id" : item,
                      "point" : point
                  }
                    await EventGuestModel(eventguestdata).save();


                  var bookingData = {
                    'event_id': result._id,
                    'guest_id': item,
                    'point' : point,
                    'status' : "active"
                  };

                  await Booking(bookingData).save();



                  }
                }
              }





              res.status(201).send({ status: true, message: 'Event created',  data: {
                ...result.toObject(),
                image: imageUrl,
              }, });
            } else {
              res.status(500).send({ status: false, message: 'Not created' ,data :null });
            }
          })
          .catch((error) => {
            console.log("error",error)
            res.send({
              status: false,
              message: error.toString() ?? 'Error',
            });
          });
      }
      const sellerEvents = await EventModel.find({ seller_id: seller_id, 'status' : 'active' });
      var sellerEventLength = sellerEvents.length; 
      if(eventLimit > 0){
        if(sellerEventLength >= eventLimit){
          res.status(200).send({
            status: false,
            message: "You can add more than "+eventLimit + "event",
            data:null
          });
        } else {
          // add event
          const cover_charge = (req.body.cover_charge!='') ?  req.body.cover_charge.trim() : '';
        const others = req.body.others.trim();
        const status = req.body.status.trim();
        const banner_id = req.body.banner_id ? req.body.banner_id.trim() : null;
        const point = req.body.point ? req.body.point.trim() : 0;

        if(type == "loyalty"){
          if (point == '' || point == 0) {
            res.status(400).send({ status: false, message: "Please enter point", data: null  });
            return;
          }  
        }



        const guest_ids = req.body.guest_ids; 

        



        const eventData = {
          seller_id: new ObjectId(seller_id),
          primary_number,
          secondary_number,
          type,
          name,
          venue,
          image,
          country,
          state,
          city,
          start_time,
          end_time,
          coupon_name,
          amount,
          instructions,
          transportation_charge,
          hire_charge,
          labour_charge,
          commision_charge,
          others,
          is_cover_charge_added,
          cover_charge,
          status,
          banner_id,
          point,
          user_booking_limit,
          is_private,
          latitude,
          longitude,
          selected_payment
        };

        EventModel(eventData)
          .save()
          .then(async(result) => {
            if (result) {
              // Get the host (domain and port)
              const protocol = req.protocol;
              const host = req.get('host');

              // Combine protocol, host, and any other parts of the base URL you need
              const baseURL = `${protocol}://${host}`;
              const imageUrl = baseURL + '/uploads/events/' + result.image;
              console.log("result",result)

            
            
              if(type == "loyalty"){
                const jsonArray = JSON.parse(guest_ids);
                if(jsonArray.length > 0){
                  for(item of jsonArray){
                    var eventguestdata = {
                      "event_id" : result._id,
                      "guest_id" : item,
                      "point" : point
                  }
                    await EventGuestModel(eventguestdata).save();


                  var bookingData = {
                    'event_id': result._id,
                    'guest_id': item,
                    'point' : point,
                    'status' : "active"
                  };

                  await Booking(bookingData).save();



                  }
                }
              }





              res.status(201).send({ status: true, message: 'Event created',  data: {
                ...result.toObject(),
                image: imageUrl,
              }, });
            } else {
              res.status(500).send({ status: false, message: 'Not created' ,data :null });
            }
          })
          .catch((error) => {
            console.log("error",error)
            res.send({
              status: false,
              message: error.toString() ?? 'Error',
            });
          });
        }
      }
     
   }
    
 

  
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({
      status: false,
      message: 'Failure',
      error: error ?? 'Internal Server Error',
    });
  }
};


exports.get_events = async (req, res) => {
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
    var myAggregate = EventModel.aggregate([
      {
        $lookup: {
          from: 'banners',
          localField: 'banner_id',
          foreignField: '_id',
          as: 'banner_data',
        },
      },
      {
        $match: {
          status: baseStatus.active,
        },
      },
      {
        $sort: {
          createdAt: -1 // Sort by createdAt field in descending order (latest first)
        }
      }
    ]);
    await EventModel.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result) {
            const baseURL = `${req.protocol}://${req.get('host')}`;

              // Update image URLs for each event in the data array
              result.data = result.data.map(event => {
              const eventImageUrl = baseURL + '/uploads/events/' + event.image;
              var banner_data =   event.banner_data[0];
              var bannerImageUrl = '';
              if(banner_data){
                var bannerImageUrl = baseURL + '/uploads/banners/' + banner_data.image;
                return {
                  ...event,
                  image: eventImageUrl,
                  banner_data: {
                    ...banner_data,
                    image:bannerImageUrl
  
                  },
                };
              } else {
                return {
                  ...event,
                  image: eventImageUrl,
                  banner_data: null,
                };
              }            
            });         

            res.status(200).send({
              status: true,
              message: "success",
              data: result,
            });
        } else {
          res.status(200).send({
            status: false,
            message: "No Events found",
            data:null
          });

        }
      })
      .catch((error) => {
        res.send({
          status: false,
          message: error.toString() ?? "Error",
        });
      });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
    });
  }
};

exports.get_event = async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
    return;
  }

  try {
    const result = await EventModel.aggregate([
      {
        $lookup: {
          from: 'banners',
          localField: 'banner_id',
          foreignField: '_id',
          as: 'banner_data',
        },
      },
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
    ]);

    if (result && result.length > 0) {
      console.log("result",result)
      var event = result[0];
      const baseURL = `${req.protocol}://${req.get('host')}`;
      
      // Update the image URL for the event
      const eventImageUrl = baseURL + '/uploads/events/' + result[0].image;
      
      // Include the image URL in the "banner_data" field for the banner
      var bannerImageUrl = '';
      if(result[0].banner_data.length > 0){
        var  bannerImageUrl = baseURL + '/uploads/banners/' + result[0].banner_data[0].image;
        var banner_data = result[0].banner_data[0];
      } else {
        var banner_data = null;
      }

      const sellerEvents = await EventModel.find({ seller_id: event.seller_id });
      const eventIds = sellerEvents.map(e => e._id);

      const guestRatings = await Feedback.aggregate([
        {
          $match: {
            event_id: { $in: eventIds }
          },
        },
        {
          $group: {
            _id: {
              guest_id: "$guest_id",
              rating: "$rating"
            }
          }
        },
        {
          $group: {
            _id: "$_id.rating",
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: -1 }
        }
      ]);

      const totalGuestsResult = await Feedback.aggregate([
        {
          $match: {
            event_id: { $in: eventIds }
          },
        },
        {
          $group: {
            _id: "$guest_id"
          }
        },
        {
          $count: "totalGuests"
        }
      ]);

      const totalGuests = totalGuestsResult.length > 0 ? totalGuestsResult[0].totalGuests : 0;
    
      const ratingsPercentage = {};
      var totalSum = 0;

      guestRatings.forEach(rating => {
        totalSum += rating.count;
      });
      

      guestRatings.forEach(rating => {
        ratingsPercentage[rating._id] = ((rating.count / totalSum) * 100).toFixed(2).toString();
      });


      console.log("banner_data",banner_data)

      if(banner_data == null){
         // Update the event response
        var updatedResult = {
          ...result[0],
          image: eventImageUrl,
          banner_data: null,
          rating_data: ratingsPercentage
        };
      } else {
        // Update the event response
        var updatedResult = {
          ...result[0],
          image: eventImageUrl,
          rating_data: ratingsPercentage,
          banner_data: {
            ...banner_data, // Assuming there's only one banner
            image: bannerImageUrl,
          },
        };
      }

     

      res.status(200).send({
        status: true,
        message: "success",
        data: updatedResult,
      });
    } else {
      res.status(200).send({
        status: false,
        message: "Event not found",
        data:null
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};


exports.search_events_old = async (req, res) => {
  var keyword = req.params.keyword;
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
    let regex = new RegExp(keyword, "i");
    var myAggregate = EventModel.aggregate([
      {
        $lookup: {
          from: 'banners',
          localField: 'banner_id',
          foreignField: '_id',
          as: 'banner_data',
        },
      },
      {
        $match: {
          "is_private": "no" ,
          $or: [{ name: regex }, { coupon_name: regex }, { venue: regex } ],
          'status' : 'active',
          type: { $ne: "loyalty" } // Exclude documents where type is "loyalty"

        },
      },
      {
        $sort: {
          createdAt: -1 // Sort by createdAt field in descending order (latest first)
        }
      }
    ]);
    EventModel.aggregatePaginate(myAggregate, options)
      .then(async (result) => {
        console.log("result",result)
        if (result) {
          const baseURL = `${req.protocol}://${req.get('host')}`;
          const ratingsPercentage = {};
          // Update image URLs for each event in the data array
          result.data = await Promise.all(result.data.map(async (event) => {
           // console.log("event",event)
            var selected_payment = event.selected_payment;
            if(selected_payment == 'admin'){
                let settingData = await BusinessSettings.findOne({ razor_pay_key });
                if (settingData && settingData.upi_id) {
                  var  razor_pay_key = settingData.upi_id;
                } else {
                  var  razor_pay_key = '';
                }
              
            } else {
           
                let settingData = await UPI.findOne({ "seller_id" : event.seller_id });
                if (settingData && settingData.upi_id) {
                  var  razor_pay_key = settingData.upi_id;
                } else {
                  var  razor_pay_key = '';
                }
              
                // Process existingData here if needed
              
            }
            if(event.status!='expired'){
              const eventImageUrl = baseURL + '/uploads/events/' + event.image;
              var banner_data =   event.banner_data[0];
              var bannerImageUrl = '';
              if(banner_data){
                bannerImageUrl = baseURL + '/uploads/banners/' + banner_data.image;
              }
              var seller_id = event.seller_id;

              var sellerEvents  = await EventModel.find({ seller_id: seller_id });
          
              sellerEvents.forEach(async(event) => {
                // console.log("event",event._id);
                var event_id = event._id;
                const ratingBreakdown = await Feedback.aggregate([
                  {
                    $match: {
                      "event_id": new mongoose.Types.ObjectId(event_id),
                    },
                  },
                  {
                    $group: {
                      _id: "$rating",
                      count: { $sum: 1 }
                    }
                  },
                  {
                    $sort: { _id: -1 } // Sort by rating in descending order
                  }
                ]);



                console.log("ratingBreakdown",ratingBreakdown)  

                // Calculate rating percentages
                const ratingsCount = { 5.0: 0, 4.0: 0, 3.0: 0, 2.0: 0, 1.0: 0 };
                const totalRatings = ratingBreakdown.length;
                ratingBreakdown.forEach(rating => {
                  if (ratingsCount[rating.stars] !== undefined) {
                    ratingsCount[rating.stars]++;
                  }
                });
  
              
                for (let star in ratingsCount) {
                  ratingsPercentage[star] = (ratingsCount[star] / totalRatings) * 100;
                }
              });


             

                 
              return {
                ...event,
                image: eventImageUrl,
                razor_pay_key:razor_pay_key,
                banner_data: banner_data ? {...banner_data, image: bannerImageUrl} : null,
                rating_data:ratingsPercentage
              };
            } else {
              return event;
            }
          }));

          res.status(200).send({
            status: true,
            message: "success",
            data: result,
          });
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
      message: error.toString() ?? "Internal Server Error",
    });
  }
};

exports.search_events = async (req, res) => {
  const keyword = req.params.keyword;
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
    const regex = new RegExp(keyword, "i");
    const myAggregate = EventModel.aggregate([
      {
        $lookup: {
          from: 'banners',
          localField: 'banner_id',
          foreignField: '_id',
          as: 'banner_data',
        },
      },
      {
        $match: {
          is_private: "no",
          $or: [{ name: regex }, { coupon_name: regex }, { venue: regex }],
          status: 'active',
          type: { $ne: "loyalty" }
        },
      },
      {
        $sort: {
          createdAt: -1
        }
      }
    ]);

    EventModel.aggregatePaginate(myAggregate, options)
      .then(async (result) => {
        if (result) {
          const baseURL = `${req.protocol}://${req.get('host')}`;

          result.data = await Promise.all(result.data.map(async (event) => {
            const selected_payment = event.selected_payment;
            let razor_pay_key = '';

            if (selected_payment === 'admin') {
              const settingData = await BusinessSettings.findOne({ razor_pay_key });
              razor_pay_key = settingData?.upi_id || '';
            } else {
              const settingData = await UPI.findOne({ seller_id: event.seller_id });
              razor_pay_key = settingData?.upi_id || '';
            }

            const sellerEvents = await EventModel.find({ seller_id: event.seller_id });
              const eventIds = sellerEvents.map(e => e._id);

              const guestRatings = await Feedback.aggregate([
                {
                  $match: {
                    event_id: { $in: eventIds }
                  },
                },
                {
                  $group: {
                    _id: {
                      guest_id: "$guest_id",
                      rating: "$rating"
                    }
                  }
                },
                {
                  $group: {
                    _id: "$_id.rating",
                    count: { $sum: 1 }
                  }
                },
                {
                  $sort: { _id: -1 }
                }
              ]);

              const totalGuestsResult = await Feedback.aggregate([
                {
                  $match: {
                    event_id: { $in: eventIds }
                  },
                },
                {
                  $group: {
                    _id: "$guest_id"
                  }
                },
                {
                  $count: "totalGuests"
                }
              ]);

              const totalGuests = totalGuestsResult.length > 0 ? totalGuestsResult[0].totalGuests : 0;
            
              const ratingsPercentage = {};
              var totalSum = 0;

              guestRatings.forEach(rating => {
                totalSum += rating.count;
              });
              

              guestRatings.forEach(rating => {
                ratingsPercentage[rating._id] = ((rating.count / totalSum) * 100).toFixed(2).toString();
              });

            if (event.status !== 'expired') {
              const eventImageUrl = baseURL + '/uploads/events/' + event.image;
              const banner_data = event.banner_data[0];
              const bannerImageUrl = banner_data ? baseURL + '/uploads/banners/' + banner_data.image : '';

              



              return {
                ...event,
                image: eventImageUrl,
                razor_pay_key: razor_pay_key,
                banner_data: banner_data ? { ...banner_data, image: bannerImageUrl } : null,
                rating_data: ratingsPercentage
              };
            } else {
              return {
                ...event,
                rating_data: ratingsPercentage

              }
            }
          }));

          res.status(200).send({
            status: true,
            message: "success",
            data: result,
          });
        }
      })
      .catch((error) => {
        console.log("error", error);
        res.send({
          status: false,
          message: error.toString() ?? "Error",
        });
      });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
    });
  }
};




exports.event_by_seller_id = async (req, res) => {
  var id = req.params.id;
  console.log("id",id)
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
    var myAggregate = EventModel.aggregate([
      {
        $lookup: {
          from: 'banners',
          localField: 'banner_id',
          foreignField: '_id',
          as: 'banner_data',
        },
      },
      {
        $match: { seller_id: new mongoose.Types.ObjectId(id) , 'status' : 'active' },
      },
      {
        $sort: {
          createdAt: -1 // Sort by createdAt field in descending order (latest first)
        }
      }
    ]);
    await EventModel.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result) {
          const baseURL = `${req.protocol}://${req.get('host')}`;

          // Update image URLs for each event in the data array
          result.data = result.data.map(event => {
          const eventImageUrl = baseURL + '/uploads/events/' + event.image;
          var banner_data =   event.banner_data[0];
          var bannerImageUrl = '';
          if(banner_data){
            var bannerImageUrl = baseURL + '/uploads/banners/' + banner_data.image;
            return {
              ...event,
              image: eventImageUrl,
              banner_data: {
                ...banner_data,
                image:bannerImageUrl

              },
            };
          } else {
            return {
              ...event,
              image: eventImageUrl,
              banner_data: null,
            };
          }            
        });         

        res.status(200).send({
          status: true,
          message: "success",
          data: result,
        });
        }
      })
      .catch((error) => {
        res.send({
          status: false,
          message: error.toString() ?? "Error",
        });
      });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
    });
  }
};


exports.get_seller_events = async (req, res) => {
  const sellerId = req.query.seller_id;

  try {
    const myAggregate = EventModel.aggregate([
      {
        $lookup: {
          from: 'banners',
          localField: 'banner_id',
          foreignField: '_id',
          as: 'banner_data',
        },
      },
      {
        $match: { seller_id: new mongoose.Types.ObjectId(sellerId), 'status': 'active' },
      },
      {
        $sort: {
          createdAt: -1 // Sort by createdAt field in descending order (latest first)
        }
      }
    ]);

    const result = await myAggregate.exec();

    if (result.length > 0) {
      const currentDateTime = moment();
      const baseURL = `${req.protocol}://${req.get('host')}`;

      // Update image URLs for each event in the data array
      const events = result.map(event => {
        const eventStartDateTime = moment(event.start_time);
        const eventEndDateTime = moment(event.event_id_time);
        const eventImageUrl = baseURL + '/uploads/events/' + event.image;
        const banner_data = event.banner_data[0];
        let bannerImageUrl = '';
        console.log("eventEndDateTime",eventEndDateTime)
        console.log("currentDateTime",currentDateTime)
        console.log("eventStartDateTime",eventStartDateTime)

        if (eventEndDateTime >= currentDateTime) {
          if (banner_data) {
            bannerImageUrl = baseURL + '/uploads/banners/' + banner_data.image;
          }

          return {
            ...event,
            image: eventImageUrl,
            banner_data: banner_data
              ? { ...banner_data, image: bannerImageUrl }
              : null,
          };
        }
      });

      const filteredEvents = events.filter(event => event); // Remove undefined values

      if (filteredEvents.length > 0) {
        res.status(200).send({
          status: true,
          message: "success",
          data: filteredEvents,
        });
      } else {
        res.status(200).send({
          status: false,
          message: "No active events found",
          data: [],
        });
      }
    } else {
      res.status(200).send({
        status: false,
        message: "No events found",
        data: [],
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};






exports.delete_event = async (req, res) => {
  var id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {
      const result = await EventModel.findByIdAndUpdate(id, { status: "deleted" });
      if (result) {
        res.status(200).send({
          status: true,
          message: "Event deleted successfully",
          data: result,
        });
      } else {
        res.status(404).send({
          status: false,
          message: "Event not found",
        });
      }
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error.toString() ?? "Internal Server Error",
      });
    }
  }
};


exports.delete_events = async (req, res) => {
  try {
    await EventModel.deleteMany()
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
        });
      });
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() ?? "Internal Server Error",
    });
  }
};

exports.update_event = async (req, res, next) => {
  const id = req.params.id;
  if (!id) {
    res.status(400).send({ status: false, message: "id missing" });
  } else {
    try {

      


    // Trim values to remove extra spaces
    const seller_id = req.body.seller_id !== undefined && req.body.seller_id !== null ? req.body.seller_id.toString().trim() : null;
    const primary_number = req.body.primary_number.trim();
    const secondary_number = req.body.secondary_number.trim();
    const type = req.body.type.trim();
    const image = req.file ? req.file.filename : undefined
    const name = req.body.name.trim();
    const venue = req.body.venue.trim();
    const country = req.body.country.trim();
    const state = req.body.state.trim();
    const city = req.body.city.trim();
    var start_time = req.body.start_time.trim();
    var end_time = req.body.end_time.trim();
    const coupon_name = req.body.coupon_name.trim();
    const amount = req.body.amount.trim();
    const instructions = req.body.instructions.trim();
    const transportation_charge = req.body.transportation_charge.trim();
    const hire_charge = req.body.hire_charge.trim();
    const labour_charge = req.body.labour_charge.trim();
    const commision_charge = req.body.commision_charge.trim();
    const others = req.body.others.trim();
    const is_cover_charge_added = req.body.is_cover_charge_added.trim();
    const cover_charge = req.body.cover_charge.trim();
    const status = req.body.status.trim();
    const banner_id = req.body.banner_id ? req.body.banner_id.trim() : null;
    const point = req.body.point ? req.body.point.trim() : 0;
    const user_booking_limit = req.body.user_booking_limit ?  req.body.user_booking_limit.trim() : '';
    const is_private =  req.body.is_private.trim() ? req.body.is_private.trim() : 'no';
    const latitude = req.body.latitude ?  req.body.latitude.trim() : '';
    const longitude = req.body.longitude ?  req.body.longitude.trim() : '';  
    const selected_payment = req.body.selected_payment ?  req.body.selected_payment.trim() : '';  


    start_time = start_time.split(" ");
    start_time = start_time[0]+"T"+start_time[1];
  
    end_time = end_time.split(" ");
    end_time = end_time[0]+"T"+end_time[1];
    
    if(type == "loyalty"){
      if (point == '' || point == 0) {
        res.status(400).send({ status: false, message: "Please enter point", data: null  });
        return;
      }  
    }

    const eventData = {
      seller_id: new ObjectId(seller_id),
      primary_number,
      secondary_number,
      type,
      name,
      venue,
      country,
      state,
      city,
      start_time,
      end_time,
      coupon_name,
      amount,
      instructions,
      transportation_charge,
      hire_charge,
      labour_charge,
      commision_charge,
      others,
      is_cover_charge_added,
      cover_charge,
      status,
      banner_id,
      point,
      user_booking_limit,
      is_private,
      latitude,
      longitude,
      selected_payment
    }; 

      // Check if image is not undefined
      if (image !== undefined) {
        eventData.image = image;
      }
   

      const updatedEvent =  await EventModel.findByIdAndUpdate(
        { _id: id },
        eventData,
        { new: true }
      );


      if (updatedEvent) {

        // Get the host (domain and port)
        const protocol = req.protocol;
        const host = req.get('host');

          // Combine protocol, host, and any other parts of the base URL you need
        const baseURL = `${protocol}://${host}`;
        const imageUrl = baseURL + '/uploads/events/' + updatedEvent.image;

        res.status(200).send({
          status: true,
          message: 'Event updated successfully',
          data: {
            ...updatedEvent.toObject(),
            image: imageUrl,
          },
        });
    } else {
      res.status(500).send({ status: false, message: "Failed ! please try again", data:null });
    }
      
      
     
    } catch (error) {
      console.log("error",error)
      res.status(500).send({
        status: false,
        message: error ?? "Internal Server Error",
      });
    }
  }
};

exports.close_event_counter = async (req, res, next) => {
  const event_id = req.query.event_id;
  

  if (!event_id) {
    return res.status(400).json({
      status: false,
      message: "Event ID missing",
      data: null
    });
  }

  try {
    const data = {
      is_closed: "yes",
    };

    const updatedEvent = await EventModel.findByIdAndUpdate(
      event_id,
      data,
      { new: true }
    );

    if (updatedEvent) {
      return res.status(200).json({
        status: true,
        message: 'Event closed successfully',
        data: updatedEvent,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed! Please try again",
        data: null
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: null
    });
  }
};


exports.get_expired_events = async (req, res) => {
  const id = req.params.id;
  const type = req.params.type;
  try {
    if(type == "food"){
      var results = await EventModel.aggregate([
        {
          $match: {
            $and: [
              { status: baseStatus.expired },
              { seller_id: new mongoose.Types.ObjectId(id) },
              { type: { $in: ['entry_food_event','food_event'] }},
            ],
          },
          
        },
        {
          $sort: {
            createdAt: -1 // Sort by createdAt field in descending order (latest first)
          }
        }
      ]);
    } else {
      var results = await EventModel.aggregate([
        {
          $match: {
            $and: [
              { status: baseStatus.expired },
              { seller_id: new mongoose.Types.ObjectId(id) },
            ],
          },
        },
        {
          $sort: {
            createdAt: -1 // Sort by createdAt field in descending order (latest first)
          }
        }
      ]);
    }
    

    if (results.length > 0) {
      // Get the host (domain and port)
      const protocol = req.protocol;
      const host = req.get('host');

      // Combine protocol, host, and any other parts of the base URL you need
      const baseURL = `${protocol}://${host}`;

      // Map over the results and modify each event
      const events = results.map((event) => ({
        ...event,
        image: baseURL + '/uploads/events/' + event.image,
      }));

      res.status(200).send({
        status: true,
        message: "success",
        data: events,
      });
    } else {
      res.status(404).send({
        status: false,
        message: "No events found",
      });
    }
  } catch (error) {
    res.status(500).send({
      status: false,
      message: error.toString() || "Internal Server Error",
    });
  }
};


exports.update_event_info = async (req, res, next) => {
  try {
    const data = {
      selected_payment: "seller",
      is_private: "no",
    };

    const updatedEvents = await EventModel.updateMany({}, data, { new: true });

    if (updatedEvents) {
      return res.status(200).json({
        status: true,
        message: 'Events updated successfully',
        data: updatedEvents,
      });
    } else {
      return res.status(500).json({
        status: false,
        message: "Failed! Please try again",
        data: null
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      data: null
    });
  }
};

