const Feedback = require("../models/feedback.model");
const Event = require("../models/event.model"); // Import the Event model
const nodemailer = require('nodemailer');
const { addNotification } = require('../helpers/notification_helper');
const mongoose = require("mongoose");


exports.give_feedback = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "Body missing",
      data:null
    });
  } else {
    try {
      const feedbackData = req.body;
      const eventId = feedbackData.event_id; // Assuming the event_id is in the request body

      // Retrieve event data based on event_id
      Event.findById(eventId) // Assuming you're using Mongoose for MongoDB
        .exec()
        .then((event) => {
          if (event) {
            // Event found, you can use the event data here
            // Save feedback data to the database
            Feedback(feedbackData)
              .save()
              .then((result) => {
                if (result) {
                  // Send a thank-you email
                  //sendThankYouEmail(event.name,feedbackData.email,feedbackData);
                  

                  // guest id will be later taken from token

                 // var guest_id = "650bdb1e015e74e090374652";
                  // send notification
                //  addNotification(guest_id,event.seller_id,'New feedback received');

                  res.status(201).send({
                    status: true,
                    message: "Thank you for your feedback. We will contact you soon",
                    data: result,
                  });
                } else {
                  res.status(404).send({
                    status: false,
                    message: "Not created",
                    data:null
                  });
                }
              })
              .catch((error) => {
                console.log("error", error);
                res.status(500).send({
                  status: false,
                  message: error.toString() || "Error",
                  data:null
                });
              });
          } else {
            res.status(404).send({
              status: false,
              message: "Event not found",
              data:null
            });
          }
        })
        .catch((error) => {
          console.log("Error retrieving event data:", error);
          res.status(500).send({
            status: false,
            message: "Internal Server Error",
            data:null
          });
        });
    } catch (error) {
      res.status(500).send({
        status: false,
        message: error || "Internal Server Error",
        data:null
      });
    }
  }
};

  
function sendThankYouEmail(event_name,senderEmail,feedbackData) {
  var name = feedbackData.name;
  var email = feedbackData.email;
  var phone = feedbackData.phone;
  var message = feedbackData.message;

  const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'Gmail', 'Outlook'
    auth: {
      user: 'testuserbellway@gmail.com', // your email address
      pass: 'dgjjzvtcrxbuhwzk', // your app  password
    },
  });

  const mailOptions = {
    from: senderEmail,
    to: 'info@mailinator.com',
    subject: 'Feedback for event '+event_name,
    text: `New feedback is recieved from - \ Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ' + error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

exports.get_feedbacks = async (req, res) => {
  var event_id = req.query.event_id;
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
    var myAggregate = Feedback.aggregate([
      {
        $match: {
          "event_id": new mongoose.Types.ObjectId(event_id),
        },
      },
      {
        $sort: { createdAt: -1 }, // Sort by createdAt in descending order
      },
    ]);

    await Feedback.aggregatePaginate(myAggregate, options)
      .then((result) => {
        if (result) {
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