
const Notification = require('../models/notification.model'); // Import the Notification model

// Function to send a app notification to a user and save it to the "notification" table
async function sendAppNotification(from_user_id,to_user_id, message) {
  const notification = {
    from_user_id:from_user_id,
    to_user_id:to_user_id,
    message: message,
  };

  try {
    // Create a new notification entry in the database
    const newNotification = await new Notification(notification).save();


  } catch (error) {
    console.error('Error sending app notification:', error);
    // Handle the error, such as logging it or returning an error response
    throw error;
  }
}

module.exports = {
  sendAppNotification,
};
