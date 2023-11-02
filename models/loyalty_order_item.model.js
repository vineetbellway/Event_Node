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
    facility_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Facility",
      required: true,
    },
    guest_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Guest",
      required: true,
    },
    transaction_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Transaction",
      required: true,
    },
    quantity: {
      type: Number,
    },
    consumed: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    status: {
      type: String,
      default: baseStatus.active,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("LoyalityOrderItem", schema);
