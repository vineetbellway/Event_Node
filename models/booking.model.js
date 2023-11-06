const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "EventModel",
      required: true,
    },
    guest_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Guest",
      required: true,
    },
    payment_mode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: baseStatus.pending,
    },
    transaction_id:{
        type: String,
    },
    booking_date: {
        type: String,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Booking", schema);
