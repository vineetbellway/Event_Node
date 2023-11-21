const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const notificationSchema = new mongoose.Schema(
  {
    from_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    to_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    message: {
      type: String, 
    },

    is_read: {
      type: Number,
      enum: [0, 1], // Define the possible numeric values for is_read
      default: 0, // Set a default value
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.plugin(mongoosePaginate);
notificationSchema.plugin(aggregatePaginate);

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
