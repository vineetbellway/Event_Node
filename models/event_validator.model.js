const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { validatorRoles } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    validator_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
      required: true,
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "User",
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "EventModel",
      required: true,
    },
    role: {
      type: String,
      enum: ['cashier', 'bar_attender', 'booker'], // Add your allowed roles
      /*required: true,*/
    },
    status: {
      type: String,
      enum: ['pending','accept', 'reject'], // Add your allowed roles
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("EventValidator", schema);
