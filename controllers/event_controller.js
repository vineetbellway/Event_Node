const EventModel = require("../models/event.model");
const EventGuestModel = require("../models/event_guest.model");
const LoyalityOrderItem = require("../models/loyalty_order_item.model");
const mongoose = require("mongoose");
const { ObjectId } = require('mongoose').Types;
const moment = require("moment");
const { baseStatus, userStatus } = require("../utils/enumerator");
const Booking = require("../models/booking.model");


exports.create_event = (req, res, next) => {
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
    const start_time = req.body.start_time.trim();
    const end_time = req.body.end_time.trim();
    const coupon_name = req.body.coupon_name.trim();
    const amount = req.body.amount.trim();
    const instructions = req.body.instructions.trim();
    const transportation_charge = req.body.transportation_charge.trim();
    const hire_charge = req.body.hire_charge.trim();
    const labour_charge = req.body.labour_charge.trim();
    const commision_charge = req.body.commision_charge.trim();
    const is_cover_charge_added = (req.body.is_cover_charge_added!='') ?  req.body.is_cover_charge_added.trim() : 'no';
    
    
 

    
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
      point
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

      console.log("banner_data",banner_data)

      if(banner_data == null){
         // Update the event response
        var updatedResult = {
          ...result[0],
          image: eventImageUrl,
          banner_data: null,
        };
      } else {
        // Update the event response
        var updatedResult = {
          ...result[0],
          image: eventImageUrl,
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


exports.search_events = async (req, res) => {
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
          $or: [{ name: regex }, { coupon_name: regex }, { venue: regex } ],
          'status' : 'active'
        },
      },
    ]);
    await EventModel.aggregatePaginate(myAggregate, options)
      .then((result) => {
        console.log("result",result)
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
      await EventModel.findByIdAndDelete(id)
        .then((result) => {
          if (result) {
            res.status(200).send({
              status: true,
              message: "deleted",
              data: result,
            });
          } else {
            
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
    const start_time = req.body.start_time.trim();
    const end_time = req.body.end_time.trim();
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
      point
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
      res.status(500).send({ status: false, message: "Faile ! please try again", data:null });
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
  try {
    const results = await EventModel.aggregate([
      {
        $match: {
          $and: [
            { status: baseStatus.expired },
            { seller_id: new mongoose.Types.ObjectId(id) },
          ],
        },
      },
    ]);

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

