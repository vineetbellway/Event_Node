const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const schema = new mongoose.Schema(
  {
    payment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceItemPayments",
      required: true,
  },
    service_item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceItem",
        required: true,
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "EventModel",
        required: true,
    },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    guest_id: {
        type: mongoose.Schema.Types.ObjectID,
        ref: "User",
        required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("ServiceItemBookings", schema);
