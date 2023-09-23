const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
var aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { baseStatus } = require("../utils/enumerator");

const schema = new mongoose.Schema(
  {
    seller_id: {
      type: mongoose.Schema.Types.ObjectID,
      ref: "Seller",
      required: true,
    },
    contact_name: {
      type: String,
    },
    contact_number: {
      type: String,
    },
    type: {
      type: String,
      default: "entry_event", //entry_event, food_event, entry_food_event, loyalty
    },
    image: {
      type: String,
    },
    name: {
      type: String,
      index: "text",
    },
    venue: {
      type: String,
      index: "text",
    },
    location: {
      type: String,
    },
    start_time: {
      type: Date,
    },
    end_time: {
      type: Date,
    },
    coupon_name: {
      type: String,
      index: "text",
    },
    tax_name: {
      type: String,
    },
    tax_percent: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    instructions: {
      type: String,
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

module.exports = mongoose.model("EventModel", schema);
