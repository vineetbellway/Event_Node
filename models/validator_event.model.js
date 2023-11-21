const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    validator_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Validator",
      required: true,
    },
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
      required: true,
    },
    event_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "EventModel",
      required: true,
    },
    entry_cash: {
      type: Boolean,
      default: false,
    },
    food_cash: {
      type: Boolean,
      default: false,
    },
    food_serve: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: baseStatus.pending,
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(mongoosePaginate);
schema.plugin(aggregatePaginate);

module.exports = mongoose.model("ValidatorEvent", schema);
