const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    guest_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Guest",
    },
    booking_type: {
      type: String,
      default: "entry", //entry, loyalty, order
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "EventModel",
    },
    approver_type: {
      type: String,
      default: "validator", //validator, seller
    },
    validator_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Validator",
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
    },
    approved_at: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: baseStatus.pending,
    },
    upi_id: {
      type: String,
    },
    reference: {
      type: String,
    },
    from: {
      type: String,
      default: Date.now(),
    },
    to: {
      type: String,
    },
  },
  {
    timestamps: true,
    strictPopulate: false,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("Transaction", schema);
