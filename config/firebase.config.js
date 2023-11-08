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
 * @param {string} registrationToken - The FCM registration token of the device you want to send the notification to.
 * @param {object} notification - The notification object, including title and body.
 * @param {object} data - Additional data to send with the notification.
 * @returns {Promise} A promise that resolves when the notification is sent.
 */
function sendPushNotification(registrationToken, notification, data) {
  const message = {
    token: registrationToken,
    notification: {
      title: notification.title,
      body: notification.body,
    },
    data: data || {},
  };

  return admin.messaging().send(message);
}

module.exports = { admin, sendPushNotification };
