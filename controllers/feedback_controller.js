const Feedback = require("../models/feedback.model");
const Event = require("../models/event.model"); // Import the Event model
const nodemailer = require('nodemailer');
const { sendSystemNotification } = require('../helpers/notification_helper');


exports.give_feedback = (req, res, next) => {
  if (!req.body) {
    res.status(400).send({
      status: false,
      message: "Body missing",
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
                  sendThankYouEmail(event.name,feedbackData.email,feedbackData);
                  

                  // guest id will be later taken from token

                  var guest_id = "650bdb1e015e74e090374652";
                  // send notification
                  sendSystemNotification(guest_id,event.seller_id,'New feedback received');

                  res.status(201).send({
                    status: true,
                    message: "Thank you for your feedback. We will contact you soon",
                    data: result,
                  });
                } else {
                  res.status(404).send({
                    status: false,
                    message: "Not created",
                  });
                }
              })
              .catch((error) => {
                console.log("error", error);
                res.status(500).send({
                  status: false,
                  message: error.toString() || "Error",
                });
              });
          } else {
            res.status(404).send({
              status: false,
              message: "Event not found",
            });
          }
        })
        .catch((error) => {
          console.log("Error retrieving event data:", error);
          res.status(500).send({
            status: false,
            message: "Internal Server Error",
          });
        });
    } catch (error) {
      res.status(500).send({
        status: false,
        message: "Failure",
        error: error || "Internal Server Error",
      });
    }
  }
};

  
function sendThankYouEmail(event_name,senderEmail,feedbackData) {
  var firstName = feedbackData.first_name;
  var lastName = feedbackData.last_name;
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
    text: `New feedback is recieved from - \nFirst Name: ${firstName}\nLast Name: ${lastName}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ' + error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}