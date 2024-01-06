
const Notification = require('../models/notification.model'); // Import the Notification model

// Function to add to the "notification" table
async function addNotification(from_user_id,to_user_id,title, message,type) {
  const notification = {
    from_user_id:from_user_id,
    to_user_id:to_user_id,
    message: message,
    title : title,
    type : type    
  };

  try {
    // Create a new notification entry in the database
    await new Notification(notification).save();


  } catch (error) {
    console.error('Error sending notification:', error);
    // Handle the error, such as logging it or returning an error response
    throw error;
  }
}

module.exports = {
  addNotification
};
