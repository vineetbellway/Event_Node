var admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
  }),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

/**
 * Send a push notification.
 * @param {string} fcm_token - The FCM registration token of the device you want to send the notification to.
 * @param {object} notification - The notification object, including title and body.
 * @param {object} data - Additional data to send with the notification.
 * @param {string} sound - The name of the sound file to play (optional).
 * @returns {Promise} A promise that resolves when the notification is sent.
 */
function sendPushNotification(fcm_token, notification, data) {
  const message = {
    token: fcm_token,
    notification: {
      title: notification.title,
      body: notification.body,
     // sound: sound || "default", // You can set a default sound or provide a specific sound file name
    },
    data: data || {},
  };

  return admin.messaging().send(message);
}

module.exports = { admin, sendPushNotification };
